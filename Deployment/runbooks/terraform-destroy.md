# Terraform Destroy Runbook - Legacy GKE

Use this runbook to retire the legacy Terraform-managed GKE infrastructure after Coolify is serving production traffic.

## Preconditions

- Coolify backend and frontend are deployed and healthy.
- Coolify PostgreSQL and Redis are reachable by the backend.
- Production DNS points to Coolify or has a tested cutover plan.
- Uptime Kuma, Prometheus, Grafana, Jenkins, and ArgoCD are running on K3s.
- Database backup is complete if old Kubernetes PostgreSQL data must be retained.
- Terraform state backup is complete.
- A human reviewer has approved the destroy plan.

## Inventory

```bash
cd Deployment/terraform/environments/prod
terraform init
terraform workspace show
terraform state list
terraform output
```

Save the output with the deployment record for the cutover.

## Backup

Back up Terraform state from the configured GCS backend:

```bash
gsutil cp -r gs://loyalty-program-tf-state-prod/terraform/state ./tf-state-backup
```

If the old GKE PostgreSQL contains production data, take a database backup before destroying the cluster:

```bash
kubectl -n loyalty-prod exec deploy/loyalty-postgres -- pg_dump -U loyalty_admin loyalty_db > loyalty-db-before-gke-destroy.sql
```

Adjust the pod/deployment name if the old cluster uses a StatefulSet or a different PostgreSQL resource.

## Plan

```bash
cd Deployment/terraform/environments/prod
terraform plan -destroy -out destroy.tfplan
terraform show destroy.tfplan
```

Check that the plan destroys only legacy GKE/GCP resources owned by this Terraform state. Do not continue if the plan includes shared resources that Coolify, K3s, DNS, or artifact storage still need.

## Apply

```bash
terraform apply destroy.tfplan
```

This is destructive and cannot be safely rolled back without reprovisioning.

## Post-Destroy Verification

```bash
terraform state list
gcloud container clusters list --region asia-southeast2
curl -fsS https://<frontend-domain>/
curl -fsS https://<backend-domain>/health
kubectl get pods -A
```

Expected result:

- Terraform state is empty or contains only intentionally retained data resources.
- Legacy GKE cluster is gone.
- Coolify frontend and backend still pass health checks.
- K3s DevOps stack remains healthy.

## Rollback

There is no in-place rollback after `terraform apply destroy.tfplan`. Recovery means reprovisioning infrastructure and restoring database backups. Keep the old GKE stack alive until Coolify and K3s validation passes.
