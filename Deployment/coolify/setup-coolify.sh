#!/bin/bash
# ============================================================
# LOYALTY PROGRAM — Coolify VM Post-Install Setup Guide
# ============================================================
# Run this AFTER the Coolify VM startup script has completed.
# SSH into the VM first:
#   gcloud compute ssh coolify-prod --zone=asia-southeast2-a \
#     --tunnel-through-iap --project=<YOUR_PROJECT_ID>
# ============================================================

set -euo pipefail

COOLIFY_URL="http://localhost:8000"

echo "=============================================="
echo " Loyalty Program — Coolify Setup Assistant"
echo "=============================================="

# Wait for Coolify to be ready
echo "[1/5] Waiting for Coolify to become ready..."
for i in $(seq 1 30); do
  if curl -fsS "${COOLIFY_URL}" > /dev/null 2>&1; then
    echo "      Coolify is up!"
    break
  fi
  echo "      Attempt $i/30 — waiting 10s..."
  sleep 10
done

echo ""
echo "[2/5] Coolify is ready. Open the dashboard and complete initial setup:"
echo "      URL: ${COOLIFY_URL}"
echo "      → Create your Admin account"
echo "      → Skip the server setup (using localhost)"
echo ""

echo "[3/5] Connect GitHub Repository:"
echo "      Coolify Dashboard → Sources → Add → GitHub App"
echo "      → Allow access to: Adrian463588/TechnoLoyaltyProgram"
echo ""

echo "[4/5] Create Services in Coolify:"
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  Project: loyalty-program                               │"
echo "  │                                                         │"
echo "  │  Service 1: loyalty-postgres                            │"
echo "  │    Type: PostgreSQL (Coolify managed)                   │"
echo "  │                                                         │"
echo "  │  Service 2: loyalty-redis                               │"
echo "  │    Type: Redis (Coolify managed)                        │"
echo "  │                                                         │"
echo "  │  Service 3: loyalty-backend                             │"
echo "  │    Type: Application                                    │"
echo "  │    Source: GitHub → main branch                         │"
echo "  │    Dockerfile: Backend/Dockerfile                       │"
echo "  │    Port: 3000                                           │"
echo "  │    Auto-deploy on push: ENABLED                         │"
echo "  │                                                         │"
echo "  │  Service 4: loyalty-frontend                            │"
echo "  │    Type: Application                                    │"
echo "  │    Source: GitHub → main branch                         │"
echo "  │    Dockerfile: Frontend/Dockerfile                      │"
echo "  │    Port: 3001                                           │"
echo "  │    Auto-deploy on push: ENABLED                         │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""

echo "[5/5] After creating services, copy Deploy Webhooks from Coolify:"
echo "      Coolify → loyalty-backend → Configuration → Webhooks"
echo "      → Copy webhook URL"
echo "      → Add to GitHub repository secrets as: COOLIFY_BACKEND_WEBHOOK"
echo ""
echo "      Coolify → loyalty-frontend → Configuration → Webhooks"
echo "      → Copy webhook URL"
echo "      → Add to GitHub repository secrets as: COOLIFY_FRONTEND_WEBHOOK"
echo ""
echo "      Also add these GitHub Secrets:"
echo "      GCP_PROJECT_ID  = project-654b743a-b24b-45ad-85e"
echo "      GCP_SA_KEY      = <service account JSON key content>"
echo "      BACKEND_HEALTH_URL = https://<your-backend-domain>"
echo "      FRONTEND_URL       = https://<your-frontend-domain>"
echo ""
echo "=============================================="
echo " Setup complete! GitHub Actions will now"
echo " auto-deploy on every push to main branch."
echo "=============================================="
