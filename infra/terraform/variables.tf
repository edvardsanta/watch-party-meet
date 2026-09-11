variable "do_token" {
  description = "DigitalOcean API token. Prefer TF_VAR_do_token or DIGITALOCEAN_TOKEN in the shell."
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Name prefix used for DigitalOcean resources."
  type        = string
  default     = "watchparty"
}

variable "digitalocean_project_id" {
  description = "Optional DigitalOcean Project ID used to group created resources in the control panel."
  type        = string
  default     = ""
}

variable "region" {
  description = "DigitalOcean region slug."
  type        = string
  default     = "nyc1"
}

variable "droplet_size" {
  description = "Droplet size slug."
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "droplet_image" {
  description = "DigitalOcean Droplet image slug."
  type        = string
  default     = "ubuntu-24-04-x64"
}

variable "enable_backups" {
  description = "Enable paid Droplet backups."
  type        = bool
  default     = false
}

variable "ssh_key_ids" {
  description = "Existing DigitalOcean SSH key IDs or fingerprints allowed on the Droplet."
  type        = list(string)
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to reach SSH."
  type        = list(string)
}

variable "enable_reserved_ip" {
  description = "Create and attach a Reserved IP for easier migration."
  type        = bool
  default     = true
}

variable "existing_reserved_ip" {
  description = "Existing Reserved IP to attach instead of creating a new one. Leave empty to create one."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Optional base domain already managed in DigitalOcean DNS, for example example.com."
  type        = string
  default     = ""
}

variable "record_name" {
  description = "DNS record name inside domain_name, for example meet. Use @ for apex."
  type        = string
  default     = "meet"
}

variable "tags" {
  description = "Extra tags to attach to DigitalOcean resources."
  type        = list(string)
  default     = []
}
