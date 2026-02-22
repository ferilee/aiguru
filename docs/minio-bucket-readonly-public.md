# Panduan: Ubah Bucket MinIO dari Private ke Read-Only Public

Dokumen ini menjelaskan cara mengubah bucket MinIO dari private menjadi **read-only public** (anonymous download).

## Tujuan

- File di bucket bisa **dibaca publik** (download/view).
- Bucket tetap tidak boleh di-upload oleh publik.

Mode yang dipakai: `download` (read-only).

## Prasyarat

- MinIO server sudah berjalan.
- Anda tahu:
  - endpoint MinIO (contoh: `http://localhost:9200`)
  - access key (contoh: `minioadmin`)
  - secret key (contoh: `minioadmin`)
- Nama bucket sudah ada (contoh: `aiguru`).

## Opsi A: Via MinIO Console (GUI)

1. Buka MinIO Console (contoh: `http://localhost:9201`).
2. Login sebagai admin.
3. Pilih bucket (contoh: `aiguru`).
4. Buka menu policy/access.
5. Pilih policy:
   - `Public`
   - atau `Download` (read-only), tergantung versi UI.
6. Simpan perubahan.

## Opsi B: Via MinIO Client (`mc`) dengan Docker

Jalankan command berikut:

```bash
docker run --rm --network host \
  -e MC_HOST_local=http://minioadmin:minioadmin@localhost:9200 \
  minio/mc anonymous set download local/aiguru
```

Penjelasan:
- `MC_HOST_local=...` mendefinisikan alias `local` + credential.
- `anonymous set download` mengatur bucket menjadi read-only public.

## Verifikasi

Cek header file publik:

```bash
curl -I http://localhost:9200/aiguru/nama-file.jpg
```

Jika sukses:
- status `200 OK` (atau redirect valid ke object).
- file bisa dibuka tanpa login.

## Mengembalikan ke Private

Jika ingin private lagi:

```bash
docker run --rm --network host \
  -e MC_HOST_local=http://minioadmin:minioadmin@localhost:9200 \
  minio/mc anonymous set none local/aiguru
```

## Error Umum

### 1. `Access Denied`
Penyebab:
- credential salah, atau
- alias `local` tidak tersimpan (jika dijalankan di container terpisah).

Solusi:
- Gunakan `MC_HOST_local=...` dalam command yang sama.
- Pastikan access key/secret key benar.

### 2. `bucket not found`
Penyebab:
- nama bucket salah.

Solusi:
- cek nama bucket di Console.

### 3. Tetap 403 setelah set `download`
Penyebab:
- URL endpoint salah, atau file/path salah.

Solusi:
- cek endpoint object (`http://localhost:9200` jika map `9200:9000`).
- pastikan object benar-benar ada di bucket.

