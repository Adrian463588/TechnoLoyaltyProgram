# ============================================================
# Coolify VM Module
# ============================================================
# Provisions a GCP Compute Engine VM to self-host Coolify.
# Coolify manages frontend and backend app deployments.
# Auto-deploy is triggered via Coolify webhooks on git push.
# ============================================================

resource "google_compute_address" "coolify_static_ip" {
  name   = "${var.vm_name}-ip"
  region = var.region
}

resource "google_compute_instance" "coolify" {
  name         = var.vm_name
  machine_type = var.machine_type
  zone         = "${var.region}-a"

  tags = ["coolify-vm", "http-server", "https-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 50
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.coolify_static_ip.address
    }
  }

  # DevSecOps: Use shielded VM
  shielded_instance_config {
    enable_secure_boot          = true
    enable_integrity_monitoring = true
    enable_vtpm                 = true
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # Install Docker
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
      gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Install Coolify
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    # Signal startup completion
    touch /var/coolify-ready
  EOF

  service_account {
    email  = var.service_account_email
    scopes = ["cloud-platform"]
  }

  labels = {
    env     = "prod"
    service = "coolify"
  }
}

resource "google_compute_firewall" "coolify_allow" {
  name    = "${var.vm_name}-allow"
  network = "default"

  # Allow HTTP, HTTPS, and Coolify dashboard
  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["coolify-vm"]
}

resource "google_compute_firewall" "coolify_allow_ssh_iap" {
  name    = "${var.vm_name}-allow-iap-ssh"
  network = "default"

  # DevSecOps: SSH only via IAP - no public port 22
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"] # IAP range
  target_tags   = ["coolify-vm"]
}
