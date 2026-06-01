output "coolify_external_ip" {
  description = "Public IP address of the Coolify VM"
  value       = google_compute_address.coolify_static_ip.address
}

output "coolify_dashboard_url" {
  description = "URL for the Coolify dashboard"
  value       = "http://${google_compute_address.coolify_static_ip.address}:8000"
}

output "coolify_vm_name" {
  description = "Name of the Coolify GCE instance"
  value       = google_compute_instance.coolify.name
}

output "coolify_zone" {
  description = "Zone of the Coolify GCE instance"
  value       = google_compute_instance.coolify.zone
}
