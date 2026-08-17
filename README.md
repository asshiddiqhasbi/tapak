# 👣 Tapak

**Every Watch Leaves a Footprint.**

Tapak adalah web app personal untuk mencatat perjalanan menontonmu — anime, series, dan film. Lupa udah sampai episode berapa? Tapak bantu kamu track progress, status tontonan, sampai kasih rating & catatan pribadi untuk setiap judul.

🔗 **Live Demo:** [tapak-seven.vercel.app](https://tapak-seven.vercel.app)

---

## ✨ Kenapa Dibuat

Sering lupa sudah nonton apa dan sampai episode berapa, terutama saat nonton anime/series yang berjeda karena kesibukan. Tapak dibuat untuk mencatat itu semua di satu tempat, sekaligus jadi arsip pribadi dari semua yang pernah ditonton.

## 🚀 Fitur

- **Autentikasi** — Register & login dengan email/password
- **CRUD Tontonan** — Tambah, edit, hapus judul (anime/series/film)
- **Progress Tracking** — Update episode terakhir ditonton, dengan smart suggestion tandai selesai
- **Status Tontonan** — Plan to Watch, Watching, Completed, On Hold, Dropped
- **Rating & Catatan Pribadi** — Beri rating 1-10 dan catatan personal untuk tiap judul
- **Dashboard** — Ringkasan aktivitas, Continue Watching, Recently Added
- **Profile & Statistik** — Breakdown tontonan per status, total episode ditonton
- **Upload Gambar** — Poster tontonan & avatar profil (dengan kompresi otomatis)

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | [Prisma](https://prisma.io) |
| Auth & Storage | Supabase Auth & Storage |
| Deployment | [Vercel](https://vercel.com) |

## 📸 Preview

<!-- Tambahkan screenshot Dashboard di sini -->

## 🧑‍💻 Menjalankan Secara Lokal

1. Clone repo ini
   ```bash
   git clone https://github.com/asshiddiqhasbi/tapak.git
   cd tapak
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Buat file `.env.local` dan isi dengan environment variables berikut:
   ```env
   DATABASE_URL=
   DIRECT_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. Push schema database
   ```bash
   npx prisma db push
   ```

5. Jalankan development server
   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Database

**User** — id, username, email, createdAt
**WatchEntry** — id, userId, title, type (Anime/Series/Film), posterUrl, totalEpisodes, currentEpisode, status, rating, notes, startedAt, completedAt

## 🗺️ Roadmap

- [ ] Integrasi API eksternal (Jikan/TMDB) untuk auto-fill data & poster
- [ ] Crop gambar sebelum upload
- [ ] Statistik lanjutan (genre favorit, total jam nonton)

---

Dibuat dengan ❤️ sebagai portfolio project.
