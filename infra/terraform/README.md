# DigitalOcean Terraform

This Terraform module provisions the first production Droplet for the Watchparty/Jitsi stack.

For the complete operational procedure, including the temporary Ansible
environment, image upload, validation, and safe destroy/migration flows, see
[`docs/terraform-ansible-runbook.md`](../../docs/terraform-ansible-runbook.md).

It creates:

- one Ubuntu Droplet;
- a DigitalOcean firewall;
- an optional Reserved IP;
- an optional `A` record when `domain_name` is set.

## Requirements

- Terraform >= 1.6.
- A DigitalOcean API token.
- An SSH key already registered in DigitalOcean.

## Usage

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`, then export the token:

```bash
export TF_VAR_do_token="<digitalocean-token>"
```

Run the module directly for a quick provisioning cycle:

```bash
terraform init
terraform plan
terraform apply
```

For repeatable operation, prefer the plan-file flow documented in the runbook:

```bash
terraform plan -out=watchparty.tfplan
terraform apply watchparty.tfplan
```

Generate the Ansible inventory from the Terraform output:

```bash
terraform output -raw ansible_inventory > ../ansible/inventory.generated.ini
```

Do not commit `terraform.tfvars`, `*.tfstate`, `.terraform/`, or `inventory.generated.ini`.

Important: `terraform destroy` also removes the Reserved IP created by this
module. If the IP must be kept for migration, follow the preservation procedure
in the runbook before destroying the Droplet.
