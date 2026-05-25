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

module "gke" {
  source     = "../../modules/gke"
  project_id = var.project_id
  region     = var.region
  cluster_name = "loyalty-cluster-prod"
}
