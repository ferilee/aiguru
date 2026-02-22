# Akademi Inovasi Guru (AI Guru)

Platform LMS untuk pelatihan guru dengan alur:
- Katalog course
- Enrollment peserta
- Classroom (video/text/pdf)
- Mark as Complete + progress stateful
- Quiz & assignment
- Sertifikat otomatis saat progress 100%
- Admin CMS (CRUD course/chapter/material, media metadata, analytics)

## Stack

- Next.js App Router
- API route di `/api/*`
- Drizzle ORM + SQLite
- Auth internal (email/password hash + HTTP-only JWT cookie)

## Setup

1. Install dependency:
```bash
npm install
```

2. Salin env:
```bash
cp .env.example .env.local
```

3. Generate schema database:
```bash
npm run db:push
```

4. Seed data awal (opsional):
```bash
npm run db:seed
```

5. Jalankan aplikasi:
```bash
npm run dev
```

## Bootstrap data awal

Endpoint bootstrap:
```bash
curl -X POST "http://localhost:3000/api/setup/bootstrap?key=YOUR_BOOTSTRAP_KEY"
```

Endpoint ini membuat (alternatif dari `npm run db:seed`):
- 1 akun admin
- 1 course published
- chapter + material contoh (video/quiz/assignment)

## API utama

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- Google Auth: `/api/auth/google/start`, `/api/auth/google/callback`
- Course: `/api/courses`, `/api/courses/:id`, `/api/courses/:id/enroll`
- Learning: `/api/learning/:courseId`, `/api/materials/:materialId/complete`
- Evaluation: `/api/quizzes/:quizId/submit`, `/api/assignments/:assignmentId/submit`
- Certificate: `/api/certificates/:courseId`
- Admin CMS: `/api/admin/*`

## Catatan MinIO

Upload media admin sudah menggunakan MinIO SDK (`putObject`) via `/api/admin/media/upload` dengan multipart form-data.
Pastikan env MinIO (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`) sudah diisi.

## Google Login/Register

1. Buat OAuth Client di Google Cloud Console (Web Application).
2. Tambahkan Authorized redirect URI:
   - `http://localhost:3000/api/auth/google/callback`
3. Isi env:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
4. User klik tombol "Login dengan Google" / "Daftar dengan Google".
5. Setelah callback sukses, app tetap memakai session cookie internal (`ai_guru_session`) yang sama seperti login biasa.
