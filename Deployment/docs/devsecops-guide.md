# DevSecOps Guide — Loyalty Program

> Project: `project-654b743a-b24b-45ad-85e`
> Region: `asia-southeast2` (Jakarta)
> Cluster: `loyalty-cluster-prod`

---

## 1. Security Philosophy: Shift-Left

Security gates are embedded in every phase of the pipeline—not bolted on at the end.

```
Plan → Code → Build → Test → Release → Deploy → Monitor
  ↑       ↑      ↑       ↑       ↑         ↑        ↑
THREAT  SAST   SCAN  DAST  SBOM  SIGNED  ALERT
MODEL   LINT   TRIVY       IMAGE  IMAGE   RULES
```

---

## 2. Supply Chain Security

### 2.1 Image Signing (Cosign)
All images MUST be signed before pushing to Artifact Registry.
```bash
# Install cosign
cosign sign --key cosign.key \
  asia-southeast2-docker.pkg.dev/project-654b743a-b24b-45ad-85e/loyalty-program-repo/backend:TAG
```

### 2.2 SBOM Generation
Generate a Software Bill of Materials for every release.
```bash
# Generate SBOM with Syft
syft asia-southeast2-docker.pkg.dev/.../backend:TAG \
  -o spdx-json > sbom-backend-TAG.json
```

### 2.3 Dependency Scanning
Run at every PR and weekly cron:
```bash
# In Backend/
pnpm audit --audit-level=high

# Snyk (optional, if configured)
snyk test
```

---

## 3. Secret Management

**Rule: Zero plain-text secrets in Git. No exceptions.**

### Recommended: External Secrets Operator + GCP Secret Manager
```yaml
# Example ExternalSecret (ESO)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: loyalty-backend-secrets
  namespace: loyalty-prod
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: gcp-secret-store
    kind: SecretStore
  target:
    name: loyalty-backend-secrets
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: loyalty-backend-database-url
  - secretKey: JWT_SECRET
    remoteRef:
      key: loyalty-backend-jwt-secret
```

### Rotation Policy
- JWT_SECRET: rotate every 90 days
- DATABASE_URL password: rotate every 180 days
- GCP service account keys: prefer Workload Identity (no key rotation needed)

---

## 4. Identity & Access Management (IAM)

### Workload Identity (Preferred over SA keys)
```bash
# Create Kubernetes Service Account
kubectl create serviceaccount loyalty-backend-sa \
  --namespace=loyalty-prod

# Create GCP Service Account
gcloud iam service-accounts create loyalty-backend-gsa \
  --project=project-654b743a-b24b-45ad-85e

# Bind them
gcloud iam service-accounts add-iam-policy-binding \
  loyalty-backend-gsa@project-654b743a-b24b-45ad-85e.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:project-654b743a-b24b-45ad-85e.svc.id.goog[loyalty-prod/loyalty-backend-sa]"

kubectl annotate serviceaccount loyalty-backend-sa \
  --namespace=loyalty-prod \
  iam.gke.io/gcp-service-account=loyalty-backend-gsa@project-654b743a-b24b-45ad-85e.iam.gserviceaccount.com
```

### Least Privilege Roles
| Component         | GCP Role                              |
|-------------------|---------------------------------------|
| Backend SA        | `roles/secretmanager.secretAccessor`  |
| Backend SA        | `roles/cloudsql.client`               |
| Jenkins CI SA     | `roles/artifactregistry.writer`       |
| ArgoCD SA         | None (cluster-internal only)          |
| Prometheus SA     | `roles/monitoring.viewer`             |

---

## 5. Network Security

### GKE Private Cluster
- Nodes have no public IP addresses.
- API server access restricted to authorized networks.
- All node-to-node traffic via VPC.

### Network Policies (Default Deny)
Applied in `Deployment/kubernetes/overlays/prod/network-policy.yaml`:
- Default: deny ALL ingress and egress.
- Allowlist: frontend → backend, ingress-nginx → frontend, all pods → DNS.

### TLS Everywhere
- Ingress terminates TLS with cert-manager (Let's Encrypt or GCP-managed certs).
- Backend-to-database communication over TLS (Cloud SQL Proxy or direct SSL).

---

## 6. Runtime Security

### Pod Security Standards
All namespaces enforce `restricted` policy:
```bash
kubectl label namespace loyalty-prod \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### Container Hardening (applied to all pods)
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
```

### Falco (Runtime Threat Detection)
Deploy Falco daemonset to detect anomalous container behavior at runtime:
```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco-system \
  --create-namespace \
  --set falco.grpc.enabled=true
```

---

## 7. Jenkins Security Checklist

- [ ] Use Jenkins credentials store — never hardcode secrets in Jenkinsfile.
- [ ] Pin all Docker image versions (no `:latest` in build tools).
- [ ] Use `--frozen-lockfile` for pnpm to prevent supply chain attacks.
- [ ] Fail pipeline on Trivy CRITICAL CVEs (`--exit-code 1 --severity CRITICAL`).
- [ ] Run TruffleHog before build to catch leaked secrets.
- [ ] Sign images with Cosign after build.
- [ ] Use pinned image tags in GitOps manifests (not `:latest`).

---

## 8. Monitoring & Alerting

### Key Alert Rules (Prometheus)
| Alert                    | Condition                         | Severity |
|--------------------------|-----------------------------------|----------|
| PodCrashLooping          | restarts > 5 in 15m               | Critical |
| HighCPUUsage             | CPU > 90% for 5m                  | Warning  |
| HighMemoryUsage          | Memory > 85% for 5m               | Warning  |
| HPAMaxReplicasReached    | replicas == maxReplicas for 10m   | Warning  |
| BackendDown              | backend endpoint unreachable 1m   | Critical |
| TLSCertExpiringSoon      | cert expires < 14 days            | Warning  |

### Uptime Kuma Monitors
- Frontend: `https://loyalty.example.com` — HTTP 200 every 1m
- Backend health: `https://loyalty.example.com/api/health` — HTTP 200 every 1m
- Grafana: `https://grafana.loyalty.example.com` — HTTP 200 every 5m

---

## 9. Incident Response

1. **Detect** — Grafana alert fires / Uptime Kuma sends notification.
2. **Triage** — Check `kubectl get pods -n loyalty-prod` and recent ArgoCD sync history.
3. **Isolate** — Scale down affected deployment or apply network policy to block traffic.
4. **Rollback** — Revert the image tag commit in Git; ArgoCD auto-syncs to previous state.
5. **Root Cause** — Investigate logs in GCP Cloud Logging and Prometheus metrics.
6. **Post-Mortem** — Document within 48h: timeline, impact, root cause, action items.

---

## 10. Compliance & Audit

- All API mutations write to an audit log (enforced by AGENTS.md rule).
- TokenLedger is append-only — verified by repository layer.
- GCP Cloud Audit Logs captures all API and admin activity at the infrastructure level.
- Grafana dashboards retain 15 days of metrics (configurable via Prometheus retention).
