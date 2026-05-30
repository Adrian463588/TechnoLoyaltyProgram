# DevSecOps Guide — Loyalty Program

> Application runtime: Coolify
> DevOps cluster: K3s on the Coolify VPS
> Legacy cluster: Terraform-managed GKE, retired through `Deployment/runbooks/terraform-destroy.md`

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
All release images MUST use deterministic tags and be signed after they are pushed to the registry.
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

### Runtime Secret Stores

- Coolify stores backend/frontend application secrets.
- Jenkins credential store keeps registry, Cosign, GitHub, Coolify, and notification credentials.
- Kubernetes Secrets are allowed only for K3s DevOps tooling such as Grafana bootstrap credentials.
- No plaintext secret may be committed to Git.

### Optional: External Secrets Operator
```yaml
# Example ExternalSecret (ESO)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: grafana-secrets
  namespace: monitoring
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: gcp-secret-store
    kind: SecretStore
  target:
    name: grafana-secrets
  data:
  - secretKey: admin-user
    remoteRef:
      key: grafana-admin-user
  - secretKey: admin-password
    remoteRef:
      key: grafana-admin-password
```

### Rotation Policy
- JWT_SECRET: rotate every 90 days
- DATABASE_URL password: rotate every 180 days
- GCP service account keys: prefer Workload Identity (no key rotation needed)

---

## 4. Identity & Access Management (IAM)

### Least Privilege

Prefer short-lived credentials and dedicated service accounts. If a cloud provider is used for registry or backups, grant only the roles required by that component.

### K3s Service Accounts

Keep K3s service accounts scoped to their namespace unless a component needs read-only cluster discovery. Prometheus is the only default cluster reader in this stack.

### Least Privilege Roles
| Component         | GCP Role                              |
|-------------------|---------------------------------------|
| Jenkins CI SA     | `roles/artifactregistry.writer`       |
| Jenkins CI SA     | registry read for scan/sign verification |
| ArgoCD SA         | K3s cluster-internal only             |
| Prometheus SA     | K3s read-only metrics access          |

---

## 5. Network Security

### K3s Host Protection
- Restrict SSH to administrator IPs.
- Keep Coolify, Docker, K3s, kubectl, and Helm patched.
- Expose only required HTTPS endpoints through the reverse proxy.
- Use host firewall rules for SSH, HTTP, HTTPS, and any required K3s administration port.

### Network Policies (Default Deny)
Applied through the root `Deployment` kustomization:
- Default deny per namespace.
- Allow required ingress/egress for ingress, registry access, webhooks, DNS, scraping, and GitOps.
- Backend/frontend app traffic is governed by Coolify networking, not Kubernetes NetworkPolicy.

### TLS Everywhere
- Ingress terminates TLS with cert-manager (Let's Encrypt or GCP-managed certs).
- Backend-to-database communication over TLS (Cloud SQL Proxy or direct SSL).

---

## 6. Runtime Security

### Pod Security Standards
All namespaces enforce `restricted` policy:
```bash
kubectl label namespace devops monitoring argocd \
  pod-security.kubernetes.io/enforce=baseline \
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

### Falco (Runtime Threat Detection - Optional)
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
- [ ] Push deterministic image tags only; do not push production `:latest`.
- [ ] Trigger Coolify deploy hooks from Jenkins credentials.
- [ ] Do not commit application image tags into Kubernetes manifests.

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
- Frontend: Coolify frontend URL, HTTP 200 every 1m.
- Backend health: Coolify backend `/health`, HTTP 200 every 1m.
- Coolify dashboard: HTTP 200 every 5m.
- Jenkins: HTTP 200 every 5m.
- ArgoCD: HTTP 200 every 5m.
- Grafana: HTTP 200 every 5m.

---

## 9. Incident Response

1. **Detect** — Grafana alert fires / Uptime Kuma sends notification.
2. **Triage** — Check Coolify deployment logs, K3s pods, and recent Jenkins/ArgoCD history.
3. **Isolate** — Disable the affected Coolify route or block traffic at the reverse proxy.
4. **Rollback** — Redeploy the previous deterministic image tag in Coolify.
5. **Root Cause** — Investigate Coolify logs, container logs, Jenkins evidence, and Prometheus metrics.
6. **Post-Mortem** — Document within 48h: timeline, impact, root cause, action items.

---

## 10. Compliance & Audit

- All API mutations write to an audit log (enforced by AGENTS.md rule).
- TokenLedger is append-only — verified by repository layer.
- Coolify deployment history, Jenkins logs, ArgoCD sync history, and Git history capture operational changes.
- Grafana dashboards retain 15 days of metrics (configurable via Prometheus retention).
