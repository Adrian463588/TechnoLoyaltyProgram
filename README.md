# Berijalan Employee Loyalty Program Portal

[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![ORM: Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Testing: Cypress](https://img.shields.io/badge/Testing-Cypress-17202C?style=flat&logo=cypress)](https://www.cypress.io/)

Berijalan Employee Loyalty Program Portal adalah platform *enterprise* untuk manajemen program loyalitas karyawan di divisi **Optel** dan **Techno**. Sistem ini mengintegrasikan pengolahan data bulanan, kalkulasi poin otomatis, dan manajemen katalog hadiah dalam satu dashboard terpusat.

---

## 📖 Ringkasan Proyek

Sistem ini dirancang untuk menggantikan proses manual dalam pelacakan loyalitas karyawan. Fokus utama adalah pada **integritas data**, **transparansi poin**, dan **efisiensi operasional**.

### Target Pengguna:
-   **Mitra (Employee):** Melihat poin, tier, dan menukarkan hadiah.
-   **HC PM (Admin):** Mengelola unggahan data, perhitungan poin bulanan, dan fulfillment hadiah.
-   **Team Leader:** Memantau kemajuan loyalitas dan readiness hadiah anggota tim.

---

## 🛠️ Stack Teknologi

-   **Frontend:** Next.js 16 (App Router), React Hook Form, Zod.
-   **Backend:** Next.js Server Actions, Route Handlers.
-   **Database:** PostgreSQL dengan Prisma ORM.
-   **Styling:** Tailwind CSS, shadcn/ui (Radix UI), Framer Motion.
-   **Auth:** NextAuth.js (Auth.js) dengan proteksi rute di Middleware & Server Layer.
-   **Testing:** Cypress (E2E), Vitest (Unit & Integration).
-   **Tools:** pnpm (Preferred), ESLint, Prettier.

---

## 🧠 Aturan Bisnis & Logika Inti

Penting bagi developer untuk memahami aturan inti yang diimplementasikan di `src/server/policies` dan `src/server/services`:

### 1. Periode Penilaian (Fixed Periods)
Sistem beroperasi dalam dua siklus tahunan tetap:
-   **P1:** 16 Desember s/d 15 Juni.
-   **P2:** 16 Juni s/d 15 Desember.
*Setiap akhir periode, sistem melakukan "Snapshot" untuk mengunci data poin dan status tier.*

### 2. Mesin Kalkulasi Token (Division Specific)
-   **Divisi Optel:** Berbasis pada *slot-based earning* (input slot performa).
-   **Divisi Techno:** Berbasis pada *sprint-based earning* (kapasitas & deliverable sprint).

### 3. Validasi Penukaran (Redemption)
Sebelum permintaan penukaran diverifikasi, sistem mengecek:
-   Saldo token mencukupi.
-   Status karyawan aktif (tidak resign/inactive).
-   Waktu penukaran berada dalam jendela yang valid.
-   Stok item tersedia.

---

## 📁 Struktur Folder Lengkap

```text
src/
├── app/                      # Next.js Routing & Layouts
│   ├── (auth)/               # Login, Register, Forgot Password
│   ├── (admin)/              # Dashboard Admin (Uploads, Users, Rewards)
│   ├── (employee)/           # Dashboard Mitra & Catalog
│   ├── (leader)/             # Team Monitoring Views
│   ├── api/                  # RESTful Endpoints (File uploads, Webhooks)
│   └── layout.tsx            # Root layout dengan Theme & Auth Provider
├── components/
│   ├── ui/                   # Komponen atomik shadcn (Button, Dialog, dll)
│   ├── shared/               # Komponen lintas fitur (Navbar, Sidebar, StatCards)
│   ├── dashboard/            # Komponen spesifik dashboard
│   └── rewards/              # Katalog & Form penukaran
├── features/                 # (Optional/Future) Domain-specific modules
├── server/                   # Backend Business Logic
│   ├── services/             # Abstraksi Database (LoyaltyService, UserService)
│   ├── policies/             # Aturan bisnis murni (Calculation Formulas)
│   └── repositories/         # Akses data tingkat rendah (Prisma wrappers)
├── lib/                      # Utilitas & Konfigurasi
│   ├── auth/                 # Konfigurasi & Callback NextAuth
│   ├── db/                   # Prisma Client Singleton
│   ├── validations/          # Skema Zod untuk form & API
│   └── utils.ts              # Fungsi pembantu (Formatting, Tailwind Merge)
├── types/                    # Definisi Interface & Enum Global
└── test/                     # Unit & Integration tests (Vitest)

prisma/                       # Schema DB, Migrasi, & Seed Scripts
cypress/                      # E2E Testing suite
public/                       # Aset statis (Images, Icons)
```

---

## ⚙️ Panduan Instalasi & Pengembangan

### 1. Kloning & Dependensi
```bash
git clone <url-repo>
cd LoyatlyProgram
npm install  # atau pnpm install
```

### 2. Variabel Lingkungan (.env)
Buat file `.env` di root directory:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/loyalty_db"
NEXTAUTH_SECRET="random-string-minimal-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
npx prisma generate  # Menghasilkan client library
npx prisma db push   # Sinkronisasi schema ke database
npx prisma db seed   # Memasukkan data awal (Admin user, Default rewards)
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```

---

## 🧪 Pengujian & Kualitas Kode

Sistem ini mewajibkan pengujian otomatis untuk setiap perubahan pada logika kalkulasi:

-   **Unit Tests:** Fokus pada formula token & tiering logic.
    ```bash
    npm run test
    ```
-   **End-to-End (E2E):** Menguji alur dari upload file oleh admin hingga penukaran oleh mitra.
    ```bash
    npm run test:e2e       # Run headless
    npm run test:e2e:open  # Buka Cypress UI
    ```

---

## 🔒 Keamanan & Audit

-   **RBAC (Role-Based Access Control):** Proteksi rute di tingkat Middleware dan validasi sesi di setiap Server Action.
-   **Audit Logging:** Setiap perubahan status hadiah (Redemption Status) dan unggahan data (Upload History) dicatat secara permanen di database.
-   **Immutability:** Data snapshot periode tidak dapat diubah setelah dikunci untuk menjaga integritas sejarah poin.

---
**Berijalan Employee Loyalty Program Portal** - *Membangun Loyalitas, Memberdayakan Karyawan.*
