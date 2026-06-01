# ============================================================
# LOYALTY PROGRAM — Production Infrastructure
# ============================================================
# Stack:
#   - GKE cluster for monitoring (Prometheus, Grafana, Uptime Kuma)
#   - Coolify VM for Frontend and Backend app runtime
#   - Artifact Registry for Docker images
#   - IAP-only SSH (DevSecOps)
# ============================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "loyalty-program-tf-state-prod"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------------------------------
# Service Account for Coolify VM
# -----------------------------------------------
resource "google_service_account" "coolify_sa" {
  account_id   = "coolify-vm-sa"
  display_name = "Coolify VM Service Account"
}

# Allow Coolify SA to read from Artifact Registry
resource "google_project_iam_member" "coolify_artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.coolify_sa.email}"
}

# -----------------------------------------------
# GKE Cluster — Monitoring stack only
# -----------------------------------------------
module "gke" {
  source       = "../../modules/gke"
  project_id   = var.project_id
  region       = var.region
  cluster_name = "loyalty-cluster-prod"
}

# -----------------------------------------------
# Coolify VM — Frontend & Backend App Runtime
# -----------------------------------------------
module "coolify_vm" {
  source                = "../../modules/coolify-vm"
  project_id            = var.project_id
  region                = var.region
  vm_name               = "coolify-prod"
  machine_type          = "e2-standard-2"
  service_account_email = google_service_account.coolify_sa.email
}

# -----------------------------------------------
# Outputs
# -----------------------------------------------
output "gke_cluster_name" {
  value = module.gke.cluster_name
}

output "coolify_dashboard_url" {
  description = "Access Coolify dashboard at this URL after VM is ready"
  value       = module.coolify_vm.coolify_dashboard_url
}

output "coolify_external_ip" {
  description = "External IP of Coolify VM"
  value       = module.coolify_vm.coolify_external_ip
}

output "ssh_command" {
  description = "SSH into Coolify VM via IAP"
  value       = "gcloud compute ssh ${module.coolify_vm.coolify_vm_name} --zone=${module.coolify_vm.coolify_zone} --tunnel-through-iap --project=${var.project_id}"
}
