# Panduan Setup Kredensial Google OAuth (Step by Step)

Dokumen ini menjelaskan cara membuat kredensial Google OAuth untuk fitur `Login dengan Google` di aplikasi AI Guru.

## 1. Buka Google Cloud Console

1. Masuk ke: `https://console.cloud.google.com/`
2. Pilih project yang akan dipakai (atau buat project baru).

## 2. Konfigurasi OAuth Consent Screen

1. Buka menu: `APIs & Services` -> `OAuth consent screen`.
2. Pilih tipe user:
   - `External` untuk akun Google publik.
   - `Internal` jika hanya akun organisasi Google Workspace.
3. Isi data wajib:
   - App name
   - User support email
   - Developer contact email
4. Simpan.

Catatan:
- Untuk mode `External`, tambahkan `Test users` jika app masih testing.

## 3. Buat OAuth Client ID

1. Buka menu: `APIs & Services` -> `Credentials`.
2. Klik `Create Credentials` -> `OAuth client ID`.
3. Pilih `Application type`: `Web application`.
4. Isi nama client (contoh: `AI Guru Web`).
5. Isi:
   - `Authorized JavaScript origins`:
     - `http://localhost:3000`
   - `Authorized redirect URIs`:
     - `http://localhost:3000/api/auth/google/callback`
6. Klik `Create`.

Setelah dibuat, Anda akan mendapat:
- `Client ID`
- `Client Secret`

## 4. Masukkan Kredensial ke `.env.local`

Tambahkan baris berikut di file `.env.local`:

```env
GOOGLE_CLIENT_ID=isi_dengan_client_id_dari_google
GOOGLE_CLIENT_SECRET=isi_dengan_client_secret_dari_google
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 5. Restart Aplikasi

Setelah ubah env, restart server:

```bash
npm run dev
```

## 6. Verifikasi

1. Buka halaman login.
2. Klik `Login dengan Google`.
3. Jika berhasil, user akan diarahkan kembali ke aplikasi dan otomatis login.

## 7. Troubleshooting

### Error: `Missing env variable: GOOGLE_CLIENT_ID`
- Pastikan `GOOGLE_CLIENT_ID` ada di `.env.local`.
- Pastikan tidak ada typo nama variabel.
- Restart server setelah ubah env.

### Error: `redirect_uri_mismatch`
- Nilai `GOOGLE_REDIRECT_URI` harus sama persis dengan yang terdaftar di Google Console.
- Cocokkan domain, port, path, dan protokol (`http` vs `https`).

### Error saat consent (app belum diverifikasi / test user)
- Jika mode `External` masih testing, akun login harus ditambahkan ke `Test users`.

