output "droplet_id" {
  value = digitalocean_droplet.jitsi.id
}

output "droplet_name" {
  value = digitalocean_droplet.jitsi.name
}

output "public_ip" {
  value = local.public_ip
}

output "fqdn" {
  value = local.fqdn
}

output "ansible_inventory" {
  value = templatefile("${path.module}/templates/inventory.ini.tftpl", {
    host = local.public_ip
  })
}
