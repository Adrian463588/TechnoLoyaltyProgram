# Deployment — Loyalty Program

> GCP · GKE · GitOps · DevSecOps

---

## Architecture Overview

```
GitHub (Source of Truth)
    │
    ├─► Jenkins CI  ────────────────────────────────────────────────────────┐
    │   Checkout → Lint → Test → SAST → Build → Scan (Trivy) → Push → Tag  │
    │                                                                        ▼
    │                                                          Artifact Registry (GCR)
    │                                                                        │
    └─► ArgoCD CD  ◄─── watches Deployment/kubernetes/overlays/prod ◄──── Git commit
            │
            ▼
    GKE Cluster (loyalty-cluster-prod)
    ├── Namespace: loyalty-prod
    │   ├── Frontend Deployment (HPA: 2–5 replicas)
    │   ├── Backend  Deployment (HPA: 2–5 replicas)
    │   ├── Ingress  (NGINX + TLS)
    │   └── NetworkPolicy (default-deny, allowlisted)
    └── Namespace: monitoring
        ├── Prometheus
        ├── Grafana
        └── Uptime Kuma
```

---

## Directory Structure

```
Deployment/
├── terraform/
│   ├── environments/prod/   # Prod-specific config (project, region, cluster name)
│   └── modules/gke/         # Reusable GKE + Artifact Registry module
├── kubernetes/
│   ├── base/
│   │   ├── backend/         # Deployment, Service, HPA (min 2, max 5)
│   │   └── frontend/        # Deployment, Service, HPA (min 2, max 5)
│   └── overlays/prod/       # Kustomize patch: image tags, namespace, NetworkPolicy, Ingress
├── argocd/
│   ├── applications/        # ArgoCD Application — auto-sync + self-heal
│   └── projects/            # ArgoCD AppProject — source/destination RBAC
├── jenkins/
│   └── Jenkinsfile          # CI pipeline: lint → test → SAST → build → scan → push → gitops
├── monitoring/
│   ├── prometheus/          # Prometheus ConfigMap + Deployment
│   ├── grafana/             # Grafana Deployment + datasource/dashboard provisioning
│   └── uptime-kuma/         # Uptime Kuma Deployment + PVC
└── docs/
    └── devsecops-guide.md   # Security practices, IAM, secret management, alerting
```

---

## Quick Start

### 1. Provision Infrastructure

```bash
cd Deployment/terraform/environments/prod

# Authenticate
gcloud auth application-default login
gcloud config set project project-654b743a-b24b-45ad-85e

# Init & apply
tofu init
tofu plan
tofu apply
```

### 2. Connect to GKE

```bash
gcloud container clusters get-credentials loyalty-cluster-prod \
  --region asia-southeast2 \
  --project project-654b743a-b24b-45ad-85e
```

### 3. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply project and app
kubectl apply -f Deployment/argocd/projects/loyalty-project.yaml
kubectl apply -f Deployment/argocd/applications/loyalty-prod.yaml
```

### 4. Deploy Monitoring Stack

```bash
kubectl create namespace monitoring

# Prometheus
kubectl apply -f Deployment/monitoring/prometheus/

# Grafana
kubectl apply -f Deployment/monitoring/grafana/

# Uptime Kuma
kubectl apply -f Deployment/monitoring/uptime-kuma/
```

### 5. Jenkins Setup

1. Create Jenkins pipeline pointing to `Deployment/jenkins/Jenkinsfile`.
2. Add credentials:
   - `gcp-sa-key` (GCP service account JSON with `roles/artifactregistry.writer`)
   - `github-token` (GitHub personal access token with `repo` scope)
3. On every push to `main`, Jenkins runs CI; ArgoCD auto-deploys.

---

## HPA Configuration

| Workload      | Min Replicas | Max Replicas | CPU Target | Memory Target |
|---------------|:---:|:---:|:---:|:---:|
| Backend       | 2   | 5   | 70% | 80% |
| Frontend      | 2   | 5   | 70% | 80% |

---

## DevSecOps Highlights

| Practice                | Tool / Method                         |
|-------------------------|---------------------------------------|
| Secret scanning         | TruffleHog (Jenkins stage)            |
| Container vulnerability | Trivy (fail on CRITICAL)              |
| Image signing           | Cosign                                |
| SBOM                    | Syft                                  |
| Runtime threat detection| Falco                                 |
| Secret management       | External Secrets Operator + GCP SM    |
| Identity                | Workload Identity (no SA keys)        |
| Network isolation       | Kubernetes NetworkPolicy (deny-all)   |
| Pod hardening           | Non-root, read-only FS, drop ALL caps |
| Uptime monitoring       | Uptime Kuma                           |
| Metrics & alerting      | Prometheus + Grafana                  |

See [`docs/devsecops-guide.md`](./docs/devsecops-guide.md) for the full reference.
