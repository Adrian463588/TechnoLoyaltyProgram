# AGENTS.md - Deployment Loyalty Program

Panduan ini berlaku untuk semua pekerjaan di folder `Deployment/`. Dokumen ini melengkapi `../AGENTS.md`; jika ada konflik, ikuti aturan yang lebih ketat dan jangan lanjutkan perubahan berisiko tanpa dasar yang jelas.

---

## 1. Misi Deployment

Jaga deployment Loyalty Program tetap aman, replikatif, dan mudah diverifikasi.

Target deployment saat ini:

- Cloud provider: Google Cloud Platform (GCP)
- Kubernetes: Google Kubernetes Engine (GKE)
- Cluster: `loyalty-cluster-prod`
- Namespace aplikasi: `loyalty-prod`
- Registry: Artifact Registry `asia-southeast2-docker.pkg.dev/.../loyalty-program-repo`
- GitOps path: `Deployment/kubernetes/overlays/prod`
- CD: ArgoCD pull-based GitOps
- CI: Jenkins pipeline
- Runtime utama: Backend Node.js/Express/Prisma, Frontend Next.js, PostgreSQL, Redis

---

## 2. Baca Sebelum Mengubah

Sebelum mengubah file deployment:

1. Baca `../AGENTS.md`.
2. Baca `Deployment/README.md`.
3. Baca `Deployment/docs/devsecops-guide.md` jika perubahan menyentuh CI/CD, security scan, policy, secrets, atau monitoring.
4. Baca manifest terkait di folder yang akan diubah.
5. Identifikasi dampak ke cluster, namespace, registry, ingress, secret, PVC, dan rollout.
6. Jangan invent kebijakan deployment yang belum ada. Pakai `TODO(OQ-...)` untuk keputusan operasional yang belum jelas.

---

## 3. Ownership Folder

| Folder / file | Tanggung jawab |
|---|---|
| `kubernetes/base/` | Workload, Service, HPA, Job, dan resource reusable. |
| `kubernetes/overlays/prod/` | Kustomize production, namespace, ingress, dan network policy. |
| `argocd/` | ArgoCD project, application, ingress, dan instruksi instalasi. |
| `jenkins/` | Jenkins manifests dan pipeline CI/CD. |
| `monitoring/` | Prometheus, Grafana, Alertmanager, Uptime Kuma, rules, dan dashboard. |
| `terraform/` | Provisioning GKE dan infrastructure GCP. |
| `deploy-all.ps1` | Bootstrap script untuk namespace, tools, monitoring, Jenkins, dan ArgoCD. |

Placement rule:

- Perubahan deployment aplikasi produksi masuk ke `kubernetes/overlays/prod/` bila environment-specific.
- Perubahan workload reusable masuk ke `kubernetes/base/`.
- Perubahan CI image build, scan, push, atau GitOps update masuk ke `jenkins/Jenkinsfile`.
- Perubahan sync behavior ArgoCD masuk ke `argocd/applications/` atau `argocd/projects/`.
- Perubahan cluster/infrastructure GCP masuk ke `terraform/`.

---

## 4. Guardrails Non-Negotiable

Jangan commit:

- Secret, token, password, kubeconfig, service account key, private key, atau credential cloud.
- Webhook URL baru yang berisi token atau path sensitif.
- File state Terraform, kecuali memang sudah menjadi bagian repo dan user secara eksplisit meminta perubahan.

Jangan ubah tanpa mengecek `Deployment/README.md` dan manifest terkait:

- Namespace `loyalty-prod`.
- Host ingress production.
- Artifact Registry path.
- Routing ingress.
- Nama service yang dipakai ingress, monitoring, atau ArgoCD.
- Storage/PVC PostgreSQL dan Redis.

Aturan produksi:

- Jangan pakai image `latest` sebagai target rilis produksi final. Jenkins/GitOps harus memakai tag deterministik seperti build number + commit SHA.
- Manifest harus idempotent dan aman di-apply berulang.
- Jangan hapus PVC, database, Redis, namespace, atau ArgoCD finalizer tanpa instruksi eksplisit.
- Jangan menjalankan command yang mengubah cluster production kecuali diminta jelas oleh user.
- Migration Prisma harus dijalankan melalui Job Kubernetes atau prosedur operasional yang aman dan terdokumentasi.
- Perubahan security policy, network policy, RBAC, atau ingress harus menyertakan validasi dan rollback notes.

---

## 5. Aturan Ingress dan Environment

Jaga collision path antara NextAuth Frontend dan Backend API.

Aturan routing:

- Backend API harus dirutekan secara eksplisit sesuai desain di `Deployment/README.md`.
- Frontend Next.js tetap menjadi fallback root path `/`.
- Jangan membuat rule ingress yang membuat `/api/auth/session`, `/api/auth/error`, atau route NextAuth frontend diarahkan ke Backend.
- Untuk production, `BACKEND_URL` dan `NEXT_PUBLIC_BACKEND_URL` tidak boleh diberi suffix `/api`.

Secrets penting:

- Backend secret minimal mencakup `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, dan `FRONTEND_ORIGIN`.
- Frontend secret minimal mencakup `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL`, dan `AUTH_TRUST_HOST`.
- Nilai secret asli harus dibuat melalui Kubernetes Secret, external secret manager, atau pipeline credential store; jangan hardcode di manifest repo.

---

## 6. CI/CD dan GitOps

Jenkins bertanggung jawab untuk:

- Checkout source.
- Lint, typecheck, dan unit test.
- SAST/secret scan.
- Build image Backend dan Frontend.
- Scan container image.
- Generate SBOM.
- Push image ke Artifact Registry.
- Update manifest GitOps dengan tag image deterministik.

ArgoCD bertanggung jawab untuk:

- Sync `Deployment/kubernetes/overlays/prod`.
- Self-heal drift dari cluster.
- Prune resource yang sudah dihapus dari Git sesuai policy aplikasi.

Aturan perubahan:

- Jangan bypass GitOps untuk perubahan aplikasi permanen.
- Perubahan hotfix manual di cluster harus dicatat dan disusul commit manifest.
- Jika mengubah `syncPolicy.prune`, `selfHeal`, atau target path ArgoCD, jelaskan risiko rollout dan rollback.
- Jika mengubah Jenkins credentials ID, registry, branch deploy, atau repo URL, verifikasi semua reference yang bergantung.

---

## 7. Database, Cache, dan Migration

PostgreSQL dan Redis adalah stateful dependency.

Aturan:

- Jangan menghapus PVC production.
- Jangan mengganti storage class, mount path, atau `subPath` tanpa rencana migrasi.
- PostgreSQL harus tetap memakai pola PVC yang aman untuk direktori data.
- Redis changes harus memperhatikan persistence, resource limit, dan readiness/liveness bila ditambahkan.
- Migration Prisma untuk production harus idempotent, dapat diamati statusnya, dan punya rollback notes.

---

## 8. Monitoring dan Operability

Untuk perubahan monitoring:

- Prometheus scrape config harus menunjuk service/port yang benar.
- Alertmanager rule harus actionable dan tidak noisy.
- Grafana dashboard harus memakai datasource yang tersedia.
- Uptime Kuma endpoint harus memakai URL production yang benar.
- Jangan commit credential Grafana/Alertmanager production.

Untuk perubahan deployment app:

- Pastikan readiness/liveness probe tetap valid.
- Pastikan resource request/limit realistis.
- Pastikan HPA memakai metric yang tersedia.
- Pastikan NetworkPolicy tidak memutus koneksi Frontend, Backend, PostgreSQL, Redis, ingress, atau monitoring.

---

## 9. Validasi Sebelum Selesai

Minimal untuk perubahan manifest Kubernetes:

```bash
kubectl kustomize Deployment/kubernetes/overlays/prod
```

Jika cluster tersedia dan user mengizinkan validasi server-side:

```bash
kubectl apply --dry-run=server -k Deployment/kubernetes/overlays/prod
```

Jika perubahan menyentuh build/deploy aplikasi:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
```

Jika perubahan menyentuh flow user production atau ingress auth:

```bash
pnpm test:integration
pnpm test:e2e
```

Verifikasi cluster bila deployment benar-benar dijalankan:

```bash
kubectl get pods -n loyalty-prod
kubectl get svc -n loyalty-prod
kubectl get ingress -n loyalty-prod
kubectl get certificate -n loyalty-prod
```

Verifikasi GitOps dan observability:

- ArgoCD application `loyalty-program-prod` sehat dan synced.
- Pod Backend, Frontend, PostgreSQL, Redis running.
- Ingress HTTPS valid.
- Login dan NextAuth session tidak terkena route collision.
- Dashboard/alert/uptime endpoint tidak broken.

Jangan klaim command pass jika tidak benar-benar dijalankan.

---

## 10. Rollback Notes

Setiap perubahan deployment harus punya rollback sederhana:

- Untuk image release: revert tag image di `kubernetes/overlays/prod/kustomization.yaml`.
- Untuk manifest app: revert commit manifest dan biarkan ArgoCD sync.
- Untuk ingress: restore rule sebelumnya dan validasi NextAuth serta Backend API.
- Untuk migration: jelaskan apakah rollback database tersedia, manual, atau tidak aman dilakukan.
- Untuk Terraform: gunakan plan sebelum apply dan dokumentasikan resource yang akan berubah.

---

## 11. Format Output Agent Deployment

Saat menyelesaikan pekerjaan deployment, jawab ringkas dengan format:

```md
1. Root cause
2. Patch summary
3. Files changed
4. Validation commands
5. Rollback notes
6. Remaining risks
```

Gunakan diff atau ringkasan perubahan. Jangan paste full manifest kecuali diminta.

---

## 12. Anti-Patterns

Jangan:

- Mengubah cluster production lewat `kubectl apply` tanpa instruksi eksplisit.
- Menyimpan secret di YAML repo.
- Mengganti ingress `/` dan `/api` tanpa memahami collision NextAuth.
- Menghapus finalizer ArgoCD untuk "mempercepat" delete.
- Mengganti image registry atau repo URL tanpa validasi pipeline.
- Menghapus PostgreSQL/Redis/PVC untuk memperbaiki deployment.
- Menonaktifkan scan security hanya agar pipeline hijau.
- Mengubah Terraform dan Kubernetes untuk resource yang sama tanpa menjelaskan source of truth.
- Mengklaim deployment sukses hanya dari build lokal.
