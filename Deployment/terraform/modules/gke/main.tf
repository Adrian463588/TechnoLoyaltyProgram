resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  network    = "default"
  subnetwork = "default"

  release_channel {
    channel = "REGULAR"
  }

  # DevSecOps: Shielded GKE Nodes
  node_config {
    machine_type = "e2-small"
    disk_size_gb = 20
    disk_type    = "pd-standard"

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

# Primary node pool — for general workloads (app services if needed in future)
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/trace.append",
    ]

    machine_type = "e2-medium"
    disk_size_gb = 20
    disk_type    = "pd-standard"
    spot         = true

    # DevSecOps: Use Workload Identity instead of default compute service account
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

# Monitoring node pool — dedicated for Prometheus, Grafana, Uptime Kuma
resource "google_container_node_pool" "monitoring_nodes" {
  name       = "${var.cluster_name}-monitoring-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 2
  }

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/trace.append",
    ]

    machine_type = "e2-medium"
    disk_size_gb = 20
    disk_type    = "pd-standard"
    spot         = true

    labels = {
      role = "monitoring"
    }

    # Taint to prevent regular workloads from scheduling here
    taint {
      key    = "dedicated"
      value  = "monitoring"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

# DevSecOps: Artifact Registry for storing images securely
resource "google_artifact_registry_repository" "loyalty_repo" {
  location      = var.region
  repository_id = "loyalty-program-repo"
  description   = "Docker repository for Loyalty Program"
  format        = "DOCKER"
}