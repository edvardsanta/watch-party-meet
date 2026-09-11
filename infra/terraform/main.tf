locals {
  tags = distinct(concat(var.tags, [var.project_name, "jitsi", "production"]))
}

resource "digitalocean_tag" "tags" {
  for_each = toset(local.tags)

  name = each.value
}

resource "digitalocean_droplet" "jitsi" {
  image    = var.droplet_image
  name     = "${var.project_name}-prod-01"
  region   = var.region
  size     = var.droplet_size
  ipv6     = true
  backups  = var.enable_backups
  ssh_keys = var.ssh_key_ids
  tags     = [for tag in digitalocean_tag.tags : tag.name]

  lifecycle {
    ignore_changes = [
      image
    ]
  }
}

resource "digitalocean_reserved_ip" "jitsi" {
  count = var.enable_reserved_ip && var.existing_reserved_ip == "" ? 1 : 0

  region = var.region
}

resource "digitalocean_reserved_ip_assignment" "jitsi" {
  count = var.enable_reserved_ip ? 1 : 0

  ip_address = local.reserved_ip
  droplet_id = digitalocean_droplet.jitsi.id
}

resource "digitalocean_firewall" "jitsi" {
  name        = "${var.project_name}-prod-firewall"
  droplet_ids = [digitalocean_droplet.jitsi.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.allowed_ssh_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "udp"
    port_range       = "10000"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

resource "digitalocean_project_resources" "jitsi" {
  count = var.digitalocean_project_id == "" ? 0 : 1

  project = var.digitalocean_project_id
  resources = [
    digitalocean_droplet.jitsi.urn
  ]
}

resource "digitalocean_record" "jitsi" {
  count = var.domain_name == "" ? 0 : 1

  domain = var.domain_name
  type   = "A"
  name   = var.record_name
  value  = local.public_ip
  ttl    = 300
}

locals {
  reserved_ip = var.existing_reserved_ip != "" ? var.existing_reserved_ip : try(digitalocean_reserved_ip.jitsi[0].ip_address, "")
  public_ip   = var.enable_reserved_ip ? local.reserved_ip : digitalocean_droplet.jitsi.ipv4_address
  fqdn        = var.domain_name == "" ? "" : digitalocean_record.jitsi[0].fqdn
}
