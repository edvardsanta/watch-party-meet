# Watchparty Infrastructure Runbook

This is the operational procedure to create, configure, update, and remove a Watchparty/Jitsi installation on a DigitalOcean droplet.

The flow is split into three parts:

1. Terraform creates the infrastructure on DigitalOcean.
2. Ansible installs Docker and configures the remote host.
3. A local script builds the web image, sends it over SSH, and Ansible starts Compose.

The server doesn't need to compile the frontend. It receives the ready image and runs the Docker services.

## Prerequisites

On the local machine:

- Docker with Buildx;
- `curl`, `unzip`, `rsync`, and `ssh`;
- an SSH key already registered with DigitalOcean;
- a DigitalOcean token with permission to create, change, and remove Droplets, Reserved IPs, and firewalls;
- the Watchparty repository in a local directory.

The token must not be put in versioned files, saved in shell history, or pasted into chat.

## Local variables ignored by Git

The files below are local and must not be committed:

```text
infra/terraform/terraform.tfvars
infra/terraform/.terraform/
infra/terraform/*.tfstate*
infra/ansible/group_vars/production.yml
infra/ansible/inventory.generated.ini
```

`terraform.tfvars.example` and `infra/ansible/group_vars/production.yml.example` serve as templates.

## 1. Set up Terraform under `/tmp`

The binary and the Ansible environment can live under `/tmp`, since they're just local machine tools. Terraform's state, however, must stay in the `infra/terraform` directory, protected by `.gitignore`, so that `apply` and `destroy` use the same state source.

```bash
mkdir -p /tmp/watchparty-terraform-bin /tmp/watchparty-terraform-download
curl -fsSL \
  -o /tmp/watchparty-terraform-download/terraform.zip \
  https://releases.hashicorp.com/terraform/1.16.1/terraform_1.16.1_linux_amd64.zip
unzip -o /tmp/watchparty-terraform-download/terraform.zip \
  -d /tmp/watchparty-terraform-bin
/tmp/watchparty-terraform-bin/terraform version
```

For a different architecture, swap the `linux_amd64` package for your local machine's architecture.

## 2. Configure and apply Terraform

Copy the template and fill in the local values:

```bash
cp infra/terraform/terraform.tfvars.example \
  infra/terraform/terraform.tfvars
$EDITOR infra/terraform/terraform.tfvars
```

For the first deploy, the important values are:

```hcl
project_name        = "watchparty"
region              = "nyc1"
droplet_size        = "s-2vcpu-2gb"
enable_reserved_ip  = true
existing_reserved_ip = ""
domain_name         = ""
record_name         = "meet"
```

`domain_name` should only be filled in when the DNS zone is managed by DigitalOcean. When DNS lives elsewhere (e.g. at your registrar), leave it empty and create the `A` record there pointing at the `public_ip` output.

Restrict `allowed_ssh_cidrs` to your public IP when possible. Using `0.0.0.0/0` is acceptable only as a temporary test configuration.

Export the token only for the current session:

```bash
export TF_VAR_do_token='PUT_THE_TOKEN_HERE'
```

Always run Terraform from the module's directory:

```bash
cd infra/terraform
/tmp/watchparty-terraform-bin/terraform init
/tmp/watchparty-terraform-bin/terraform fmt -check
/tmp/watchparty-terraform-bin/terraform validate
/tmp/watchparty-terraform-bin/terraform plan -out=watchparty.tfplan
/tmp/watchparty-terraform-bin/terraform apply watchparty.tfplan
```

After `apply`, save what Ansible needs:

```bash
/tmp/watchparty-terraform-bin/terraform output
/tmp/watchparty-terraform-bin/terraform output -raw public_ip
/tmp/watchparty-terraform-bin/terraform output -raw ansible_inventory \
  > ../ansible/inventory.generated.ini
```

`public_ip` is the Reserved IP when `enable_reserved_ip = true`. This is the IP to use in DNS, in the shared link, and in `jvb_advertise_ips`.

## 3. Set up the temporary Ansible environment

```bash
python3 -m venv /tmp/watchparty-ansible-venv
/tmp/watchparty-ansible-venv/bin/pip install --upgrade pip ansible
ANSIBLE_LOCAL_TEMP=/tmp/ansible-local \
  /tmp/watchparty-ansible-venv/bin/ansible-galaxy collection install ansible.posix
```

The temporary directory used by Ansible needs to exist and be writable:

```bash
mkdir -p /tmp/ansible-local
```

Edit the generated inventory and fill in the SSH key, if needed:

```ini
[production]
watchparty-prod ansible_host=IP_RESERVED ansible_user=root ansible_ssh_private_key_file=~/.ssh/digital_ocean
```

Create the group's private config:

```bash
cp infra/ansible/group_vars/production.yml.example \
  infra/ansible/group_vars/production.yml
$EDITOR infra/ansible/group_vars/production.yml
```

At minimum, adjust `public_hostname`, `public_url`, `jvb_advertise_ips`, `web_image`, Jitsi's internal service passwords, and the TLS options. For the Caddy setup:

```yaml
public_hostname: meet.example.com
public_url: "https://{{ public_hostname }}"
jvb_advertise_ips: "IP_RESERVED"
enable_caddy_tls: true
enable_letsencrypt: false
pull_images: false
web_image_pull_policy: never
```

The room passphrase (`watchparty_room_password`) lives in `production.yml` and is applied automatically to every room as soon as it's created, via the custom Prosody module (`mod_muc_default_password.lua`). There's no more nginx Basic Auth. To change the passphrase later, without a full redeploy, see section 6.

## 4. Build and send the web image

The command below runs on the local machine. It compiles the image for the droplet's platform and sends the file via `docker save | ssh | docker load`.

```bash
TAG=$(git rev-parse --short HEAD) \
PLATFORM=linux/amd64 \
SKIP_WEB_BUILD=true \
DROPLET_HOST=IP_RESERVED \
DROPLET_USER=root \
SSH_KEY_PATH=~/.ssh/digital_ocean \
./scripts/build-local-export-droplet.sh
```

Use `SKIP_WEB_BUILD=true` only when the assets are already built. For a normal frontend change, drop that variable to run `make compile deploy` before `docker buildx`.

The tag value needs to match `infra/ansible/group_vars/production.yml`:

```yaml
web_image: watchparty/jitsi-web:COMMIT_TAG
web_image_pull_policy: never
pull_images: false
```

## 5. Run Ansible

Test the connection first:

```bash
ANSIBLE_LOCAL_TEMP=/tmp/ansible-local \
ANSIBLE_HOST_KEY_CHECKING=False \
/tmp/watchparty-ansible-venv/bin/ansible \
  -i infra/ansible/inventory.generated.ini production -m ping
```

Then apply the playbook:

```bash
ANSIBLE_LOCAL_TEMP=/tmp/ansible-local \
ANSIBLE_HOST_KEY_CHECKING=False \
/tmp/watchparty-ansible-venv/bin/ansible-playbook \
  -i infra/ansible/inventory.generated.ini \
  infra/ansible/playbook.yml
```

The playbook installs Docker, creates `/opt/watchparty`, syncs the core without `.env` files, renders the production environment, sets up Caddy, and runs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d
```

Not `--force-recreate`: that would restart every service (including prosody/jicofo/jvb) on
every deploy, even when only the web image changed, causing a ~15-20s window where jicofo
has no operational bridge and any join attempted then fails and gets kicked. Plain `up -d`
still recreates whichever service's image or config actually changed.

Check the result:

```bash
ssh -i ~/.ssh/digital_ocean root@IP_RESERVED \
  'cd /opt/watchparty/docker-jitsi-core && \
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps'
curl -I --max-time 15 https://meet.example.com/watchparty
```

A `200`/`302` response on the page, with the room asking for the passphrase on join, means HTTPS and the room lock are working. For media issues, also confirm port `10000/udp` and the JVB logs.

## 6. Change the room passphrase without exposing it

This command should be run by the operator in their own terminal. The prompt happens on the operator's terminal and the passphrase must never be sent to the agent. It updates `WATCHPARTY_ROOM_PASSWORD` in the droplet's `.env` and restarts Prosody (the current room drops and gets recreated locked with the new passphrase on the next join):

```bash
ssh -t -i ~/.ssh/digital_ocean root@IP_RESERVED '
cd /opt/watchparty/docker-jitsi-core &&
./scripts/set-room-password.sh --prompt
'
```

Then open `https://meet.example.com/watchparty` and use the passphrase you just set. Don't put real passphrases directly in `group_vars/production.yml`; use the prompt script instead.

## 7. Update only the web image

```bash
TAG=$(git rev-parse --short HEAD) \
SKIP_WEB_BUILD=true \
DROPLET_HOST=IP_RESERVED \
SSH_KEY_PATH=~/.ssh/digital_ocean \
./scripts/build-local-export-droplet.sh
```

Update `web_image` in the private Ansible file and run the playbook again. The rest of the infrastructure isn't recreated by Terraform.

## 8. Quick diagnostics

```bash
ssh -i ~/.ssh/digital_ocean root@IP_RESERVED 'free -h && docker stats --no-stream'
ssh -i ~/.ssh/digital_ocean root@IP_RESERVED \
  'cd /opt/watchparty/docker-jitsi-core && \
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200'
dig +short A meet.example.com
```

If the domain doesn't resolve, the problem is DNS. If HTTPS fails, confirm that `80/tcp` and `443/tcp` are open and that Caddy can complete the HTTP challenge. If the call connects but media doesn't work, check `10000/udp`, `jvb_advertise_ips`, and the JVB logs.

### Stuck/ghost JVB bridge ("no operational bridges")

Symptom: a second participant can't join (kicked back to the error screen, or the whole
call drops for everyone), and `jicofo` logs show either of these repeating every ~10s
with no recovery:

```
JvbDoctor$HealthCheckTask.doHealthCheck: Unexpected error returned by the bridge: ...
  <error ...><not-acceptable .../><text>You are not currently connected to this chat</text></error>
BridgeSelector.selectBridge: There are no operational bridges.
```

jicofo's `BridgeSelector` is holding a bridge registration that no longer corresponds to
an actual JVB present in the internal `jvbbrewery` MUC room - typically left over after
`prosody` got restarted (breaking jicofo/jvb's long-lived XMPP connections to it) while
jicofo/jvb themselves kept running. jicofo doesn't self-heal this; it keeps health-checking
the dead reference indefinitely.

Fix: recreate jicofo and jvb (not prosody, which is healthy) so they rejoin the brewery
room from scratch:

```bash
ssh -i ~/.ssh/digital_ocean root@IP_RESERVED \
  'cd /opt/watchparty/docker-jitsi-core && \
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate jicofo jvb'
```

Confirm recovery by tailing jicofo's logs for a fresh `BridgeSelector.addJvbAddress: Added
new videobridge` with no further health-check errors after it, before letting anyone back in.

## 9. Destroy the infrastructure

Before destroying, check the state and note the Reserved IP:

```bash
cd infra/terraform
/tmp/watchparty-terraform-bin/terraform output -raw public_ip
/tmp/watchparty-terraform-bin/terraform state list
```

### Destroy everything, including the Reserved IP

Use this when the whole infrastructure can be removed:

```bash
/tmp/watchparty-terraform-bin/terraform plan -destroy
/tmp/watchparty-terraform-bin/terraform destroy
```

For automation without an interactive confirmation, use `-auto-approve` only after reviewing the plan:

```bash
/tmp/watchparty-terraform-bin/terraform destroy -auto-approve
```

### Destroy the Droplet while keeping the Reserved IP

Terraform's current resource also manages the Reserved IP it created. So a direct `terraform destroy` can release that IP too. To keep the IP around for a migration, first back up the state and remove only the Reserved IP resources from it:

```bash
/tmp/watchparty-terraform-bin/terraform state pull > /tmp/watchparty-state-backup.json
/tmp/watchparty-terraform-bin/terraform state rm \
  'digitalocean_reserved_ip.jitsi[0]' \
  'digitalocean_reserved_ip_assignment.jitsi[0]'
/tmp/watchparty-terraform-bin/terraform plan -destroy
/tmp/watchparty-terraform-bin/terraform destroy
```

Confirm on DigitalOcean that the IP is still reserved before creating another Droplet. On the next deploy, fill in:

```hcl
enable_reserved_ip  = true
existing_reserved_ip = "PRESERVED_RESERVED_IP"
```

Don't run the preservation procedure without reviewing `terraform state list` and the plan. The backup file under `/tmp` is only a local safety net and should be removed once you've confirmed the result.

## 10. Local cleanup

After the work is done, remove only the temporary environments created for this runbook, if they're no longer needed:

```bash
rm -rf /tmp/watchparty-terraform-bin /tmp/watchparty-terraform-download
rm -rf /tmp/watchparty-ansible-venv /tmp/ansible-local
rm -f /tmp/watchparty-state-backup.json
```

Don't remove `infra/terraform/terraform.tfstate` while the infrastructure exists. Without that state, Terraform loses track of the resources it created and a `destroy` stops being reliable.
