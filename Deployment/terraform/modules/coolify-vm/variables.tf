variable "vm_name" {
  description = "Name of the Coolify VM instance"
  type        = string
  default     = "coolify-prod"
}

variable "machine_type" {
  description = "GCE machine type for Coolify VM"
  type        = string
  default     = "e2-standard-2"
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_account_email" {
  description = "Service account email to attach to the VM"
  type        = string
}
