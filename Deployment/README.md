# Deployment Guide — Loyalty Program

> Comprehensive Deployment Documentation for GKE, DevOps, and Infrastructure Configurations.

This guide details the complete deployment architecture, tools used, configuration details, and step-by-step instructions to deploy the Loyalty Program platform on Google Kubernetes Engine (GKE) with best-practice DevOps standards.

---

## 1. Architecture & Tools

- **Cloud Provider**: Google Cloud Platform (GCP)
- **Orchestrator**: Google Kubernetes Engine (GKE) (`loyalty-cluster-prod`)
- **Namespace**: `loyalty-prod`
- **Container Registry**: GCP Artifact Registry
- **Database**: PostgreSQL (Stateful Deployment in Kubernetes via PVC)
- **Cache**: Redis (Deployment in Kubernetes)
- **Backend**: Node.js + Express + Prisma ORM
- **Frontend**: Next.js (App Router) + NextAuth.js v5
- **Ingress Controller**: NGINX Ingress Controller
- **TLS / SSL**: Cert-Manager (Let's Encrypt Prod)
- **DNS Pattern**: `nip.io` wildcard DNS (e.g., `loyaltyprogramberijalan.34.101.180.46.nip.io`)

---

## 2. Infrastructure Configurations & Best Practices

### A. NGINX Ingress & Rate Limiting (Anti Brute-Force)
To protect the authentication endpoints and the server from brute-force and DDoS attacks, the Ingress is configured with rate-limiting annotations:
- `nginx.ingress.kubernetes.io/limit-rps: "10"` (Maksimal 10 request per detik dari satu IP)
- `nginx.ingress.kubernetes.io/limit-connections: "20"` (Maksimal 20 koneksi bersamaan dari satu IP)
- Jika dilanggar, server akan mengembalikan error `503 Service Temporarily Unavailable`.

### B. Ingress Routing (Menyelesaikan NextAuth Path Collision)
Next.js (NextAuth) pada Frontend dan Express API pada Backend sama-sama menggunakan namespace path `/api/...`. Jika menggunakan konfigurasi standar, akan terjadi *path collision* di mana rute NextAuth frontend tertimpa oleh Backend.
**Solusi Konfigurasi:**
- Backend API diregistrasi **secara spesifik** di Ingress: `/api/employee`, `/api/admin`, `/api/leader`, `/api/auth/login`, `/api/auth/verify`, `/health`, dan `/api-docs`.
- Frontend (Next.js) diregistrasi pada *root path* `/`. Rute ini bertindak sebagai *fallback* sehingga path internal NextAuth seperti `/api/auth/session` dan `/api/auth/error` otomatis diarahkan ke Frontend.

### C. Persistent Storage untuk Database
PostgreSQL menggunakan `PersistentVolumeClaim` (PVC) dengan spesifikasi `subPath: pgdata`. Ini adalah *best practice* di Kubernetes untuk mencegah kegagalan inisialisasi basis data apabila direktori pemasangan (mount) memiliki folder sistem tersembunyi (seperti `lost+found`).

### D. SSL/TLS Certificates (HTTPS)
Menggunakan `cert-manager` dengan `ClusterIssuer` yang terhubung ke **Let's Encrypt**. NGINX Ingress secara otomatis melakukan *provisioning*, verifikasi, dan perpanjangan sertifikat SSL, sehingga seluruh lalu lintas dienkripsi secara penuh (`https://`).

---

## 3. Step-by-Step Implementation Guide

Berikut adalah panduan langkah demi langkah bagi Developer atau DevOps untuk men-deploy keseluruhan proyek ini dari awal.

### Persiapan (Prerequisites)
1. Install alat CLI: `kubectl`, `gcloud`, `docker`, dan `node` (dengan npm/pnpm).
2. Autentikasi ke GKE cluster di Google Cloud:
   ```bash
   gcloud container clusters get-credentials loyalty-cluster-prod --region asia-southeast2 --project <YOUR_PROJECT_ID>
   ```
3. Pastikan **NGINX Ingress Controller** dan **Cert-Manager** sudah ter-install secara global di klaster tersebut.

### Langkah 1: Deploy Database dan Cache
Lakukan deployment untuk PostgreSQL dan Redis beserta layanan dan volume persistennya ke dalam namespace `loyalty-prod`.
```bash
# Pastikan namespace ada
kubectl create namespace loyalty-prod

# Apply database dan cache
kubectl apply -f Deployment/kubernetes/base/postgres.yaml
kubectl apply -f Deployment/kubernetes/base/redis.yaml
```

### Langkah 2: Konfigurasi Environment Variables (Secrets)
Buat Kubernetes Secrets untuk menyimpan variabel lingkungan yang sensitif. 

> **PERHATIAN (Frontend Secret)**: Jangan menambahkan akhiran `/api` pada `BACKEND_URL` maupun `NEXT_PUBLIC_BACKEND_URL`, cukup domain utamanya saja. Jika ada `/api`, NextAuth akan melipatgandakan *path* menjadi `/api/api/auth/login` dan menyebabkan error 500/404.

**Membuat Backend Secrets:**
```bash
kubectl create secret generic loyalty-backend-secrets -n loyalty-prod \
  --from-literal=DATABASE_URL="postgresql://loyalty_admin:loyalty_secure_password_2024@loyalty-postgres:5432/loyalty_db?schema=public" \
  --from-literal=REDIS_URL="redis://loyalty-redis:6379" \
  --from-literal=JWT_SECRET="YOUR_SECURE_JWT_SECRET" \
  --from-literal=FRONTEND_ORIGIN="https://loyaltyprogramberijalan.34.101.180.46.nip.io"
```

**Membuat Frontend Secrets:**
```bash
kubectl create secret generic loyalty-frontend-secrets -n loyalty-prod \
  --from-literal=NEXTAUTH_SECRET="YOUR_NEXTAUTH_32_CHAR_SECRET_KEY" \
  --from-literal=NEXTAUTH_URL="https://loyaltyprogramberijalan.34.101.180.46.nip.io" \
  --from-literal=BACKEND_URL="https://loyaltyprogramberijalan.34.101.180.46.nip.io" \
  --from-literal=NEXT_PUBLIC_BACKEND_URL="https://loyaltyprogramberijalan.34.101.180.46.nip.io" \
  --from-literal=AUTH_TRUST_HOST="true"
```

### Langkah 3: Database Migration & Seeding
Untuk menyiapkan struktur tabel di database GCP dan menyuntikkan data admin bawaan (HC PM):
1. Buka *tunnel* (*port-forward*) dari klaster ke lokal:
   ```bash
   kubectl port-forward svc/loyalty-postgres 5432:5432 -n loyalty-prod
   ```
2. Di terminal baru, masuk ke direktori `Backend/`, sesuaikan `.env` lokal Anda menunjuk ke port lokal, lalu eksekusi Prisma:
   ```bash
   cd Backend
   npx prisma db push
   npx prisma db seed
   ```

### Langkah 4: Build, Push, dan Deploy Aplikasi
Pastikan *image* Docker Frontend dan Backend sudah di-*build* dan di-*push* ke GCP Artifact Registry. Kemudian jalankan:
```bash
kubectl apply -f Deployment/kubernetes/base/backend.yaml
kubectl apply -f Deployment/kubernetes/base/frontend.yaml
```
*(Anda dapat memantau status Pod menggunakan perintah `kubectl get pods -n loyalty-prod -w`)*

### Langkah 5: Ekspose Aplikasi via Ingress (TLS & Routing Khusus)
Terapkan sertifikat TLS dan atur *routing* lalu lintas internet ke Pod yang sesuai.
```bash
# Apply konfigurasi Let's Encrypt
kubectl apply -f Deployment/terraform/environments/prod/cert-manager-clusterissuer.yaml

# Apply Ingress NGINX
kubectl apply -f Deployment/terraform/environments/prod/loyalty-ingress-tls.yaml
```

### Langkah 6: Verifikasi Deployment Akhir
1. Pastikan semua Pod berstatus `Running`:
   ```bash
   kubectl get pods -n loyalty-prod
   ```
2. Pastikan sertifikat SSL sukses di-*provisioning* (`READY: True`):
   ```bash
   kubectl get certificate -n loyalty-prod
   ```
3. Buka *browser* pada domain `https://loyaltyprogramberijalan.34.101.180.46.nip.io`.
4. Coba *login* menggunakan NPK: `12345` dan Password: `password123`.

---
*Dokumen ini dibuat dan dikelola untuk memastikan implementasi best-practice di lingkungan cloud yang dapat direplikasi kapan saja.*
