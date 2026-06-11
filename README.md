# AI Monitoring System

Sistem ini memonitor penggunaan AI (seperti Claude) dengan arsitektur tersentralisasi. Sistem ini terdiri dari komponen **Admin** (untuk dashboard sentral dan manajemen data) dan komponen **Lokal/User** (berjalan di masing-masing komputer user).

Sistem menggunakan arsitektur monorepo dengan [pnpm](https://pnpm.io/) workspaces.

## Arsitektur

- **Admin (Server Sentral)**
  - `apps/admin-api`: Backend API yang menerima sinkronisasi data dari masing-masing agen lokal.
  - `apps/admin-dashboard`: Dashboard web (Next.js) bagi Admin untuk melihat seluruh statistik dari berbagai user.
  - `packages/db-admin`: Paket yang menangani skema database terpusat (menggunakan Drizzle ORM).

- **User (Komputer Lokal)**
  - `packages/local-agent`: Agen yang selalu berjalan di background untuk memantau/mencatat aktivitas/log AI (seperti Claude) dan melakukan sinkronisasi dengan `admin-api`.
  - `apps/local-dashboard`: Web app lokal (Next.js) yang opsional agar setiap user bisa melihat statistiknya sendiri.
  - `packages/db-local`: Database SQLite lokal untuk menampung data sebelum sukses di-sync ke server Admin.

---

## Prasyarat
- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)

## 1. Setup Admin (Di Server Sentral)

Sebagai admin, Anda bertanggung jawab untuk menjalankan API Sentral dan Dashboard Admin.

### Langkah-langkah:

1. **Install dependencies di root proyek:**
   ```bash
   pnpm install
   ```
2. **Setup Database Admin:**
   Masuk ke folder `db-admin` dan lakukan migrasi skema database.
   ```bash
   cd packages/db-admin
   # Copy environment file dan sesuaikan konfigurasi koneksi DB (misal: PostgreSQL URL)
   cp .env.example .env
   # Jalankan perintah migrasi Drizzle
   pnpm run db:push
   ```
3. **Jalankan Admin API:**
   Jalankan backend yang menerima *sync* data.
   ```bash
   cd ../../apps/admin-api
   # Copy environment file dan sesuaikan (Contoh: PORT=4000, DATABASE_URL)
   cp .env.example .env
   pnpm run dev
   ```
4. **Jalankan Admin Dashboard:**
   ```bash
   cd ../admin-dashboard
   # Copy environment file dan pastikan mengarah ke port admin-api
   cp .env.example .env
   pnpm run dev
   ```

---

## 2. Setup User (Di Tiap Komputer Karyawan)

Setiap user perlu menginstall dan menjalankan aplikasi *agent* di perangkat masing-masing untuk melacak aktivitas AI lokal.

### Langkah-langkah:

1. **Clone repository dan install dependencies:**
   ```bash
   git clone https://github.com/tiofani03/ai-monitoring.git
   cd ai-monitoring
   pnpm install
   ```
2. **Setup Database Lokal:**
   User menggunakan SQLite secara lokal untuk menyimpan sementara.
   ```bash
   cd packages/db-local
   cp .env.example .env
   pnpm run db:push
   ```
3. **Jalankan Local Agent:**
   Ini adalah script yang harus berjalan di *background* untuk membaca log AI.
   ```bash
   cd ../../packages/local-agent
   # local-agent menggunakan file ~/.ai-usage/config.json untuk konfigurasi.
   # Jika belum ada, Anda bisa menyalin format dari file config.example.json:
   # cp config.example.json ~/.ai-usage/config.json
   # Edit ~/.ai-usage/config.json dan pastikan "sync_endpoint" terisi dengan benar.
   pnpm run dev
   # Saran: gunakan PM2 (pm2 start src/index.ts) atau buat service sistem agar berjalan terus.
   ```
4. **(Opsional) Local Dashboard:**
   Jika user ingin mengecek penggunaannya sendiri melalui tampilan web:
   ```bash
   cd ../../apps/local-dashboard
   cp .env.example .env
   pnpm run dev
   ```

---

## Alur Sinkronisasi Data

1. User berinteraksi dengan AI (misal via Claude). Log aktivitas disimpan ke lokal oleh script pada `packages/integrations`.
2. `local-agent` akan membaca log tersebut, menyimpannya sementara ke `db-local` (SQLite).
3. `local-agent` memiliki proses *Sync Engine* secara berkala untuk mengirim (`push`) data ke server `admin-api`.
4. Jika berhasil di-*sync*, data tersebut akan tercatat di database admin (`db-admin`) dan tampil pada `admin-dashboard`.
