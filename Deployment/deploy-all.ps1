# Setup Namespaces
Write-Host "Creating Namespaces..." -ForegroundColor Cyan
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace tools --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace loyalty-prod --dry-run=client -o yaml | kubectl apply -f -

# Apply Prometheus
Write-Host "Applying Prometheus..." -ForegroundColor Cyan
kubectl apply -f Deployment/monitoring/prometheus/

# Apply Grafana
Write-Host "Applying Grafana..." -ForegroundColor Cyan
kubectl create secret generic grafana-secrets -n monitoring --from-literal=admin-user=$env:GRAFANA_ADMIN_USER --from-literal=admin-password=$env:GRAFANA_ADMIN_PASSWORD --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f Deployment/monitoring/grafana/

# Apply Uptime Kuma
Write-Host "Applying Uptime Kuma..." -ForegroundColor Cyan
kubectl apply -f Deployment/monitoring/uptime-kuma/
kubectl apply -f Deployment/monitoring/monitoring-ingress.yaml

# Apply Jenkins
Write-Host "Applying Jenkins..." -ForegroundColor Cyan
kubectl apply -f Deployment/jenkins/

# Apply ArgoCD
Write-Host "Applying ArgoCD..." -ForegroundColor Cyan
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host "Waiting for ArgoCD deployments to be created..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Patch ArgoCD Server to run in insecure mode for our Ingress
Write-Host "Patching ArgoCD for Ingress compatibility..." -ForegroundColor Cyan
kubectl patch deployment argocd-server -n argocd --type='json' -p='[{\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/args/-\",\"value\":\"--insecure\"}]'

kubectl apply -f Deployment/argocd/argocd-ingress.yaml
kubectl apply -f Deployment/argocd/projects/
kubectl apply -f Deployment/argocd/applications/loyalty-prod.yaml

Write-Host "Deployment scripts triggered successfully! Please wait for Pods to be ready." -ForegroundColor Green
kubectl get pods -A
