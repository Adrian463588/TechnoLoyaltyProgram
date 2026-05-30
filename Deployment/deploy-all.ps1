# Setup Namespaces
Write-Host "Creating Namespaces..." -ForegroundColor Cyan
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace devops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace monitoring pod-security.kubernetes.io/enforce=baseline pod-security.kubernetes.io/warn=restricted --overwrite
kubectl label namespace devops pod-security.kubernetes.io/enforce=baseline pod-security.kubernetes.io/warn=restricted --overwrite
kubectl label namespace argocd pod-security.kubernetes.io/enforce=baseline pod-security.kubernetes.io/warn=restricted --overwrite

# Apply Grafana secret before the GitOps overlay references Grafana
Write-Host "Preparing Grafana secret..." -ForegroundColor Cyan
if (-not $env:GRAFANA_ADMIN_USER -or -not $env:GRAFANA_ADMIN_PASSWORD) {
  Write-Error "Set GRAFANA_ADMIN_USER and GRAFANA_ADMIN_PASSWORD before running this script."
  exit 1
}

kubectl create secret generic grafana-secrets -n monitoring --from-literal=admin-user=$env:GRAFANA_ADMIN_USER --from-literal=admin-password=$env:GRAFANA_ADMIN_PASSWORD --dry-run=client -o yaml | kubectl apply -f -

# Apply ArgoCD
Write-Host "Applying ArgoCD..." -ForegroundColor Cyan
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host "Waiting for ArgoCD deployments to be created..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Patch ArgoCD Server to run in insecure mode for our Ingress
Write-Host "Patching ArgoCD for Ingress compatibility..." -ForegroundColor Cyan
kubectl patch deployment argocd-server -n argocd --type='json' -p='[{\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/args/-\",\"value\":\"--insecure\"}]'

Write-Host "Applying K3s DevOps stack..." -ForegroundColor Cyan
kubectl apply -k Deployment

Write-Host "DevOps stack deployment triggered successfully. Application runtime is managed by Coolify." -ForegroundColor Green
kubectl get pods -A
