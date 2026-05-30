# ============================================================
# LOYALTY PROGRAM — Full Infrastructure Deploy Script
# ============================================================
# Usage:
#   .\Deployment\deploy-all.ps1 -Destroy     # destroy then apply
#   .\Deployment\deploy-all.ps1 -ApplyOnly   # apply only (no destroy)
#   .\Deployment\deploy-all.ps1 -Monitoring  # apply monitoring stack only
# ============================================================

param(
  [switch]$Destroy,
  [switch]$ApplyOnly,
  [switch]$Monitoring
)

$ErrorActionPreference = "Stop"

$PROJECT_ID = "project-654b743a-b24b-45ad-85e"
$REGION     = "asia-southeast2"
$ZONE       = "asia-southeast2-a"
$TF_DIR     = "Deployment\terraform\environments\prod"

function Write-Step($msg) {
  Write-Host "`n[$msg]" -ForegroundColor Cyan
}

function Assert-Env($name) {
  if (-not (Get-Item Env:$name -ErrorAction SilentlyContinue)) {
    Write-Error "Environment variable '$name' is not set."
    exit 1
  }
}

# ─── Preflight checks ───────────────────────────────────────
Write-Step "Pre-flight checks"

if (-not $Monitoring) {
  # Terraform destroy/apply requires these
  Assert-Env "GRAFANA_ADMIN_USER"
  Assert-Env "GRAFANA_ADMIN_PASSWORD"

  $tfStatus = gcloud auth list --format="value(account)" 2>$null
  if (-not $tfStatus) {
    Write-Error "Not authenticated with gcloud. Run: gcloud auth application-default login"
    exit 1
  }
  Write-Host "gcloud authenticated as: $tfStatus" -ForegroundColor Green
}

# ─── Phase 1: Terraform Destroy (optional) ──────────────────
if ($Destroy) {
  Write-Step "PHASE 1: Terraform Destroy"
  Write-Host "WARNING: This will destroy all Terraform-managed infrastructure!" -ForegroundColor Red
  $confirm = Read-Host "Type 'destroy' to confirm"
  if ($confirm -ne "destroy") {
    Write-Error "Destroy cancelled."
    exit 1
  }

  Push-Location $TF_DIR
  terraform init -reconfigure
  terraform destroy -auto-approve
  Pop-Location
  Write-Host "Infrastructure destroyed." -ForegroundColor Yellow
}

# ─── Phase 2: Terraform Apply ────────────────────────────────
if ($Destroy -or $ApplyOnly) {
  Write-Step "PHASE 2: Terraform Apply"
  Push-Location $TF_DIR
  terraform init -reconfigure
  terraform validate
  terraform plan -out=tfplan
  terraform apply tfplan
  Remove-Item tfplan -ErrorAction SilentlyContinue

  # Capture outputs
  $COOLIFY_IP  = terraform output -raw coolify_external_ip
  $SSH_COMMAND = terraform output -raw ssh_command
  Pop-Location

  Write-Host ""
  Write-Host "==========================================" -ForegroundColor Green
  Write-Host " Terraform Apply Complete!" -ForegroundColor Green
  Write-Host "==========================================" -ForegroundColor Green
  Write-Host " Coolify IP:       $COOLIFY_IP" -ForegroundColor Yellow
  Write-Host " Coolify Dashboard: http://${COOLIFY_IP}:8000" -ForegroundColor Yellow
  Write-Host " SSH Command:      $SSH_COMMAND" -ForegroundColor Yellow
  Write-Host "==========================================" -ForegroundColor Green

  # Get GKE credentials
  Write-Step "Getting GKE credentials"
  gcloud container clusters get-credentials loyalty-cluster-prod `
    --region $REGION `
    --project $PROJECT_ID
}

# ─── Phase 3: Kubernetes Namespaces ─────────────────────────
Write-Step "PHASE 3: Creating Kubernetes Namespaces"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

kubectl label namespace monitoring `
  pod-security.kubernetes.io/enforce=baseline `
  pod-security.kubernetes.io/warn=restricted `
  --overwrite

Write-Host "Namespaces configured." -ForegroundColor Green

# ─── Phase 4: Grafana Secret ────────────────────────────────
Write-Step "PHASE 4: Creating Grafana secret"
kubectl create secret generic grafana-secrets `
  -n monitoring `
  --from-literal=admin-user=$env:GRAFANA_ADMIN_USER `
  --from-literal=admin-password=$env:GRAFANA_ADMIN_PASSWORD `
  --dry-run=client -o yaml | kubectl apply -f -

# ─── Phase 5: Apply Monitoring Stack ────────────────────────
Write-Step "PHASE 5: Deploying Monitoring Stack (Prometheus + Grafana + Uptime Kuma)"
kubectl apply -k Deployment\monitoring

Write-Host "Waiting for monitoring pods to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/prometheus -n monitoring --timeout=120s
kubectl rollout status deployment/grafana -n monitoring --timeout=120s
kubectl rollout status deployment/uptime-kuma -n monitoring --timeout=120s

# ─── Phase 6: Apply DevSecOps Policies ──────────────────────
Write-Step "PHASE 6: Applying DevSecOps Kubernetes Policies"
kubectl apply -f Deployment\kubernetes\base\network-policies.yaml
kubectl apply -f Deployment\kubernetes\base\opa-gatekeeper.yaml

# ─── Summary ─────────────────────────────────────────────────
Write-Step "DEPLOYMENT COMPLETE"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Service Status" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

kubectl get pods -n monitoring
kubectl get hpa -n monitoring
kubectl get svc -n monitoring

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Next Steps" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host " 1. SSH into Coolify VM and run setup-coolify.sh" -ForegroundColor Yellow
Write-Host " 2. Add GitHub secrets for the workflow" -ForegroundColor Yellow
Write-Host " 3. Copy Coolify webhooks to GitHub secrets" -ForegroundColor Yellow
Write-Host " 4. Push to main branch to test auto-deploy" -ForegroundColor Yellow
Write-Host " 5. Configure Grafana and Uptime Kuma dashboards" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
