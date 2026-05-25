# ArgoCD — Setup Guide (GKE)

> Cluster: `34.50.82.124` | Repo: `Adrian463588/TechnoLoyaltyProgram`

---

## 1. Install ArgoCD

```bash
# Buat namespace
kubectl create namespace argocd

# Install ArgoCD (manifest resmi, versi stabil)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Tunggu semua pod ready (±2-3 menit)
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Verifikasi
kubectl get pods -n argocd
```

**Output yang diharapkan:**
```
NAME                                                READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                     1/1     Running   0          2m
argocd-dex-server-xxxxx                             1/1     Running   0          2m
argocd-notifications-controller-xxxxx               1/1     Running   0          2m
argocd-redis-xxxxx                                  1/1     Running   0          2m
argocd-repo-server-xxxxx                            1/1     Running   0          2m
argocd-server-xxxxx                                 1/1     Running   0          2m
```

---

## 2. Patch ArgoCD Server ke Mode HTTP (agar ingress bekerja tanpa ssl-passthrough)

> **Pilihan A (Recommended)**: Patch deployment ArgoCD agar menerima koneksi HTTP biasa.
> Ini memudahkan setup ingress tanpa perlu nginx ssl-passthrough.

```bash
# Tambah flag --insecure ke argocd-server
kubectl patch deployment argocd-server \
  -n argocd \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--insecure"}]'

# Tunggu rollout
kubectl rollout status deployment/argocd-server -n argocd
```

Jika pakai flag `--insecure`, **update argocd-ingress.yaml** agar pakai port 80:

```yaml
# argocd-ingress.yaml (mode HTTP/--insecure)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
spec:
  ingressClassName: nginx
  rules:
    - host: argocd.34.50.82.124.nip.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 80
```

---

## 3. Apply Ingress

```bash
# Apply ingress (gunakan versi --insecure di atas, atau versi HTTPS di argocd-ingress.yaml)
kubectl apply -f Deployment/argocd/argocd-ingress.yaml

# Verifikasi
kubectl get ingress -n argocd
```

---

## 4. Ambil Password Admin Awal

```bash
# Password awal tersimpan di secret argocd-initial-admin-secret
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Username: admin
# Password: (output command di atas)
```

---

## 5. Login via CLI (Opsional)

```bash
# Install argocd CLI jika belum ada
# Windows: choco install argocd atau download dari GitHub releases

# Login
argocd login argocd.34.50.82.124.nip.io \
  --username admin \
  --password <password-dari-langkah-4> \
  --insecure

# Ganti password admin (wajib setelah first login)
argocd account update-password
```

---

## 6. Hubungkan Repository GitHub

```bash
# Jika repo private, tambahkan credentials
argocd repo add https://github.com/Adrian463588/TechnoLoyaltyProgram \
  --username <github-username> \
  --password <github-pat-token>

# Verifikasi koneksi repo
argocd repo list
```

---

## 7. Create Project (jika belum ada)

```bash
# Buat project loyalty-program
kubectl apply -f Deployment/argocd/projects/ -n argocd
```

Contoh project YAML (`Deployment/argocd/projects/loyalty-project.yaml`):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: loyalty-program
  namespace: argocd
spec:
  description: Loyalty Program Production Project
  sourceRepos:
    - 'https://github.com/Adrian463588/TechnoLoyaltyProgram'
  destinations:
    - namespace: loyalty-prod
      server: https://kubernetes.default.svc
    - namespace: monitoring
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota
```

---

## 8. Deploy Aplikasi Loyalty Program

```bash
# Apply Application manifest
kubectl apply -f Deployment/argocd/applications/loyalty-prod.yaml

# Cek status sync
argocd app get loyalty-program-prod

# Manual sync jika perlu
argocd app sync loyalty-program-prod

# Tunggu healthy
argocd app wait loyalty-program-prod --health
```

---

## 9. Verifikasi via UI

1. Buka `http://argocd.34.50.82.124.nip.io`
2. Login dengan `admin` + password dari Step 4
3. Pastikan aplikasi `loyalty-program-prod` berstatus **Synced** dan **Healthy**
4. Jika **OutOfSync** → klik **Sync** → centang semua resource → **Synchronize**

---

## Troubleshooting ArgoCD

| Masalah | Periksa |
|---|---|
| Pod `argocd-server` CrashLoop | `kubectl logs deploy/argocd-server -n argocd` |
| Repo connection failed | Pastikan PAT token masih valid, cek `argocd repo list` |
| App stuck `Progressing` | Cek `argocd app events loyalty-program-prod` |
| Ingress 502 | Pastikan `--insecure` flag ada dan port ingress sesuai (80 vs 443) |
| Sync failed: namespace not found | Pastikan `CreateNamespace=true` ada di syncOptions |

