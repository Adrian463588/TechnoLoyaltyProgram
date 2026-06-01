# Chatbot Database Integration: Function Calling Tools

Dokumentasi ini menjelaskan daftar fungsi (tools) yang akan digunakan oleh Chatbot (Gemini AI) untuk berinteraksi dengan Database PostgreSQL menggunakan Prisma.

## Arsitektur Keamanan
- **Context Injection:** NPK dan Role user diambil langsung dari session server-side.
- **Strict Access Control:** AI tidak dapat memanipulasi identitas user untuk mengakses data user lain.
- **Prisma-Powered:** Semua akses database menggunakan Prisma Client untuk memastikan keamanan dan integritas data.

---

## Daftar Fungsi (Tools)

### 1. Kategori: Akun & Personal (Semua User)

#### `get_my_token_summary()`
- **Kegunaan:** Mengambil informasi saldo token, tier, dan status eligibilitas user saat ini.
- **Parameter:** (Internal) `userNpk`.
- **Query Prisma:** 
  ```typescript
  prisma.user.findUnique({
    where: { npk },
    select: { currentTokens: true, membershipTier: true, lastLogin: true }
  })
  ```

#### `get_my_redemption_history(limit: number)`
- **Kegunaan:** Menampilkan riwayat penukaran hadiah terakhir milik user.
- **Parameter:** `limit` (default: 5).
- **Query Prisma:** 
  ```typescript
  prisma.redemptionRequest.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { item: true }
  })
  ```

---

### 2. Kategori: Katalog Hadiah (Global)

#### `get_reward_catalog(max_price?: number, category?: string)`
- **Kegunaan:** Mencari hadiah yang tersedia berdasarkan budget token atau kategori.
- **Parameter:** `max_price` (optional), `category` (optional).
- **Query Prisma:**
  ```typescript
  prisma.reward.findMany({
    where: {
      isActive: true,
      tokenCost: { lte: max_price },
      category: category
    }
  })
  ```

#### `check_reward_availability(reward_name: string)`
- **Kegunaan:** Mengecek sisa stok untuk item hadiah tertentu.
- **Parameter:** `reward_name`.

---

### 3. Kategori: Team Leader (Role: TEAM_LEADER)

#### `get_team_overview()`
- **Kegunaan:** Statistik ringkas mengenai total token dan aktivitas anggota tim.
- **Parameter:** (Internal) `divisionId`.
- **Logic:** Agregasi `currentTokens` dari semua `User` di divisi yang sama.

---

### 4. Kategori: Administrator (Role: HC_PM)

#### `get_global_pending_actions()`
- **Kegunaan:** Menghitung jumlah permintaan penukaran dan pendaftaran mitra yang berstatus 'PENDING'.
- **Logic:** `prisma.redemptionRequest.count({ where: { status: 'PENDING' } })`.

---

## Alur Eksekusi (Function Calling)

1. **User Request:** "Cek saldo saya dan hadiah apa yang cocok."
2. **AI Analysis:** Mendeteksi kebutuhan untuk memanggil `get_my_token_summary` dan `get_reward_catalog`.
3. **Internal Call:** Backend mengeksekusi Prisma Query sesuai instruksi AI.
4. **Data Injection:** Hasil JSON dari database diberikan kembali ke AI sebagai konteks.
5. **AI Response:** AI menyusun jawaban akhir yang ramah berdasarkan data asli database.

---

## Panduan Implementasi Selanjutnya
1. Pastikan Prisma Client sudah di-generate di folder Backend.
2. Implementasikan service handler di `Backend/src/services/chatbot.service.ts`.
3. Daftarkan skema fungsi di `Frontend/src/app/api/chatbot/stream/route.ts` pada konfigurasi `GoogleGenerativeAI`.
