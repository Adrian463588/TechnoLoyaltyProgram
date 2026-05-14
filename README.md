# Berijalan Employee Loyalty Program Portal

[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Framework: Express](https://img.shields.io/badge/Framework-Express-000000?style=flat&logo=express)](https://expressjs.com/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![ORM: Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Testing: Cypress](https://img.shields.io/badge/Testing-Cypress-17202C?style=flat&logo=cypress)](https://www.cypress.io/)

Berijalan Employee Loyalty Program Portal adalah platform *enterprise* untuk manajemen program loyalitas karyawan di divisi **Optel** dan **Techno**. Proyek ini menggunakan arsitektur monorepo yang memisahkan logika Backend, Frontend, dan Suite Pengujian.

---

## 📁 Struktur Proyek (Monorepo)

-   **`Backend/`**: REST API menggunakan Express.js, Prisma ORM, dan PostgreSQL.
-   **`Frontend/`**: Aplikasi client menggunakan Next.js (App Router) dengan Tailwind CSS dan shadcn/ui.
-   **`TestSuite/`**: Suite pengujian End-to-End menggunakan Cypress.

---

## 🚀 Panduan Memulai

### 1. Kloning Repositori
```bash
git clone https://github.com/Adrian463588/TechnoLoyaltyProgram.git
cd TechnoLoyaltyProgram
```

### 2. Setup Backend
```bash
cd Backend
npm install
# Salin .env.example ke .env dan sesuaikan DATABASE_URL
# npx prisma generate
# npx prisma db push
npm run dev
```

### 3. Setup Frontend
```bash
cd ../Frontend
npm install
npm run dev
```

---

## 🛠️ Stack Teknologi

### Backend
-   **Core:** Express.js, TypeScript
-   **ORM:** Prisma
-   **Database:** PostgreSQL
-   **Testing:** Vitest

### Frontend
-   **Core:** Next.js (App Router), React
-   **Styling:** Tailwind CSS, shadcn/ui
-   **State Management:** React Hook Form, Zod
-   **Auth:** Auth.js (NextAuth)

### Testing
-   **E2E:** Cypress
-   **Unit:** Vitest

---

## 🧪 Pengujian

### Unit Test (Backend/Frontend)
Jalankan di folder masing-masing:
```bash
npm run test:unit
```

### E2E Test (TestSuite)
```bash
cd TestSuite
npm install
npx cypress open
```

---

## 🔒 Keamanan & Audit
-   **RBAC:** Role-Based Access Control untuk Admin, Leader, dan Mitra.
-   **Audit Log:** Pencatatan setiap aksi sensitif (upload, penukaran).
-   **Integritas Data:** Validasi skema di tingkat API dan Database.

---
**Berijalan Employee Loyalty Program Portal** - *Membangun Loyalitas, Memberdayakan Karyawan.*
