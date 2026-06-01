# Coolify — Loyalty Program App Runtime

Coolify runs on a dedicated GCP Compute Engine VM provisioned by Terraform.
It manages the lifecycle of the frontend and backend applications.

Auto-deploy is triggered by GitHub Actions on every push to `main`.

---

## Architecture

```
GitHub push → main
  └─ GitHub Actions
       ├─ Lint + Tests
       ├─ TruffleHog secret scan
       ├─ Docker build (backend + frontend)
       ├─ Trivy vulnerability scan
       ├─ Push to GCP Artifact Registry
       └─ POST Coolify deploy webhooks
                  │
                  ▼
            Coolify VM (GCE)
            ├─ loyalty-backend   (port 3000)
            ├─ loyalty-frontend  (port 3001)
            ├─ loyalty-postgres  (Coolify managed)
            └─ loyalty-redis     (Coolify managed)
```

---

## Services to Create in Coolify

Create these services under **one Coolify Project** (`loyalty-program`):

| Service | Type | Source | Port |
|---|---|---|---|
| `loyalty-postgres` | PostgreSQL | Coolify managed | 5432 |
| `loyalty-redis` | Redis | Coolify managed | 6379 |
| `loyalty-backend` | Application | `Backend/Dockerfile` @ `main` | 3000 |
| `loyalty-frontend` | Application | `Frontend/Dockerfile` @ `main` | 3001 |

**Enable "Auto-deploy on push" for both backend and frontend.**

---

## Required App Secrets

### Backend (`loyalty-backend`)

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<generate with: openssl rand -base64 32>
FRONTEND_ORIGIN=https://<your-frontend-domain>
NODE_ENV=production
```

### Frontend (`loyalty-frontend`)

```env
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://<your-frontend-domain>
BACKEND_URL=https://<your-backend-domain>
NEXT_PUBLIC_BACKEND_URL=https://<your-backend-domain>
AUTH_TRUST_HOST=true
NODE_ENV=production
```

> Keep `BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` as origins **without** trailing `/api`.

---

## GitHub Secrets Required for CI/CD

Add these to your GitHub repository under **Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `GCP_PROJECT_ID` | `project-654b743a-b24b-45ad-85e` |
| `GCP_SA_KEY` | JSON key of the Terraform service account |
| `COOLIFY_BACKEND_WEBHOOK` | From Coolify → loyalty-backend → Webhooks |
| `COOLIFY_FRONTEND_WEBHOOK` | From Coolify → loyalty-frontend → Webhooks |
| `BACKEND_HEALTH_URL` | `https://<your-backend-domain>` |
| `FRONTEND_URL` | `https://<your-frontend-domain>` |

---

## First-Time Setup

1. SSH into the Coolify VM:
   ```bash
   gcloud compute ssh coolify-prod \
     --zone=asia-southeast2-a \
     --tunnel-through-iap \
     --project=project-654b743a-b24b-45ad-85e
   ```

2. Run the setup assistant:
   ```bash
   bash /path/to/Deployment/coolify/setup-coolify.sh
   ```

3. Access Coolify dashboard at `http://<VM_IP>:8000`

4. Connect your GitHub account (Sources → GitHub App)

5. Create all four services with settings above

6. Copy deploy webhooks into GitHub secrets

7. Push to `main` to verify the end-to-end flow

---

## Release Validation

```bash
curl -fsS https://<backend-domain>/health
curl -fsS https://<frontend-domain>/
```

Run login smoke tests after each production cutover.
