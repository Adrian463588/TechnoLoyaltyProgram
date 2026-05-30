# Deployment Guide - Loyalty Program

> Sprint 2.1 deployment strategy: fast Coolify application runtime with K3s-based DevSecOps tooling.

## 1. Target Architecture

- **Application runtime**: Coolify.
- **Backend service**: `loyalty-backend`, built from `Backend/Dockerfile`.
- **Frontend service**: `loyalty-frontend`, built from `Frontend/Dockerfile`.
- **Database**: Coolify managed PostgreSQL service `loyalty-postgres`.
- **Cache**: Coolify managed Redis service `loyalty-redis`.
- **DevOps cluster**: K3s on the Coolify VPS.
- **GitOps**: ArgoCD manages DevOps and monitoring manifests only.
- **CI/CD**: Jenkins builds, tests, scans, signs, pushes deterministic images, then triggers Coolify deploy.
- **Monitoring**: Uptime Kuma, Prometheus, Grafana, and Alertmanager run on K3s.
- **Legacy infrastructure**: Terraform-managed GKE is retired through the teardown runbook in `Deployment/runbooks/terraform-destroy.md`.

Coolify is the source of truth for backend/frontend runtime configuration. `Deployment/kubernetes/` is the source of truth for K3s DevOps tooling, not production application pods.

## 2. Coolify Application Design

Create one Coolify project for the Loyalty Program:

- `loyalty-postgres`: managed PostgreSQL, private network only.
- `loyalty-redis`: managed Redis, private network only.
- `loyalty-backend`: Docker image or Git build from `Backend/Dockerfile`.
- `loyalty-frontend`: Docker image or Git build from `Frontend/Dockerfile`.

Backend environment variables:

```txt
DATABASE_URL
REDIS_URL
JWT_SECRET
FRONTEND_ORIGIN
NODE_ENV=production
```

Frontend environment variables:

```txt
NEXTAUTH_SECRET
NEXTAUTH_URL
BACKEND_URL
NEXT_PUBLIC_BACKEND_URL
AUTH_TRUST_HOST=true
NODE_ENV=production
```

Do not add `/api` to `BACKEND_URL` or `NEXT_PUBLIC_BACKEND_URL`. Keep them as the backend origin so NextAuth does not produce double `/api/api/...` paths.

Prefer private service networking from frontend to backend when available. If the backend must be public, protect it with Coolify/reverse-proxy rate limits and expose only required routes such as `/health`, `/api/auth/login`, `/api/auth/verify`, `/api/employee`, `/api/admin`, `/api/leader`, and `/api-docs`.

## 3. K3s DevOps Stack

K3s runs operational tooling only:

- `devops` namespace: Jenkins.
- `argocd` namespace: ArgoCD.
- `monitoring` namespace: Prometheus, Grafana, Alertmanager, Uptime Kuma.

HPA is allowed only for safe stateless workloads. Do not add HPA to Coolify app services, PostgreSQL, Redis, Grafana with PVC, Prometheus with PVC, or Jenkins controller.

Bootstrap or refresh the K3s stack:

```powershell
.\Deployment\deploy-all.ps1
kubectl apply -k Deployment
```

ArgoCD application `loyalty-devops` syncs the root `Deployment` kustomization.

## 4. CI/CD Release Flow

Jenkins pipeline:

1. Checkout source and create tag `BUILD_NUMBER-shortSha`.
2. Run lint, typecheck, and unit tests.
3. Run SAST and secret scan.
4. Build backend/frontend Docker images.
5. Run Trivy container scan and fail on `CRITICAL`.
6. Generate SBOM with Syft.
7. Sign images with Cosign.
8. Push deterministic image tags to Artifact Registry.
9. Trigger Coolify deploy hooks for backend and frontend.

Jenkins must not commit Kubernetes app image tags anymore, because backend/frontend production runtime is Coolify.

Required Jenkins credentials:

```txt
gcp-sa-key
github-token
cosign-key
cosign-password
coolify-backend-webhook
coolify-frontend-webhook
discord-webhook-url
```

## 5. Two-Day Cutover Runbook

Day 1:

- Inventory Terraform/GKE resources, DNS, secrets, registry, and current app URLs.
- Backup Terraform state and old database if production data must be retained.
- Provision VPS with Docker, Coolify, K3s, kubectl, and Helm.
- Create Coolify services for PostgreSQL, Redis, backend, and frontend.
- Configure Coolify secrets and deploy backend/frontend.
- Run Prisma migration/seed through a controlled Coolify job or backend release command.
- Validate `/health`, login, PostgreSQL connectivity, and Redis connectivity.

Day 2:

- Deploy Jenkins, ArgoCD, Prometheus, Grafana, Alertmanager, and Uptime Kuma on K3s.
- Apply safe HPA and network policies for DevOps tooling.
- Wire Jenkins to build, scan, sign, push, and trigger Coolify.
- Wire ArgoCD to sync DevOps/monitoring manifests.
- Cut DNS to Coolify frontend.
- Validate smoke tests, uptime checks, dashboards, and alerts.
- Execute the Terraform destroy runbook only after Coolify is healthy.

## 6. Validation

Application:

```bash
curl -fsS https://<frontend-domain>/
curl -fsS https://<backend-domain>/health
```

K3s and GitOps:

```bash
kubectl get pods -n devops
kubectl get pods -n monitoring
kubectl get pods -n argocd
kubectl get hpa -A
kubectl kustomize Deployment
```

Terraform teardown:

```bash
cd Deployment/terraform/environments/prod
terraform init
terraform state list
terraform plan -destroy -out destroy.tfplan
terraform apply destroy.tfplan
```

Do not run `terraform apply destroy.tfplan` until the Coolify deployment, database, monitoring, and rollback path are verified.

## 7. Rollback

- Application rollback: redeploy the previous deterministic image tag in Coolify.
- DNS rollback: restore DNS to the previous endpoint while the old stack still exists.
- Jenkins rollback: disable Coolify webhook trigger and restore the previous pipeline commit.
- Terraform rollback: impossible after destructive apply without reprovisioning. Keep the GKE stack until Coolify health checks and business smoke tests pass.
