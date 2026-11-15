# Vercel Link Tracker

Dashboard tanpa halaman login, dengan alamat khusus `/dashbboorrddx`.

## Fitur
- Dashboard di `/dashbboorrddx` tanpa password
- Tambah, edit, hapus link
- URL tracking berbentuk `/go/slug`
- Total klik per link dan keseluruhan
- Grafik klik harian 7 hari terakhir
- Riwayat klik terbaru
- Redis sebagai penyimpanan

## Environment Variables Vercel
Tambahkan:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `APP_BASE_URL` (domain Vercel/custom domain tanpa slash terakhir)

`ADMIN_TOKEN` tidak digunakan pada versi ini.

## Deploy
1. Ekstrak ZIP.
2. Upload seluruh isi folder project ke repository GitHub yang terhubung ke Vercel, dengan mempertahankan struktur folder.
3. Commit perubahan.
4. Tunggu deployment otomatis selesai dengan status Ready. Jika tidak otomatis, buka Deployments lalu redeploy deployment terbaru.

## Akses
- Dashboard: `https://domain-kamu.vercel.app/dashbboorrddx`
- Tracking: `https://domain-kamu.vercel.app/go/slug`

## Catatan keamanan
Dashboard tidak memakai login/password. Alamat yang tidak mudah ditebak hanya menyamarkan lokasi halaman, bukan mengamankan API. Siapa pun yang mengetahui URL dashboard atau endpoint API dapat berpotensi melihat statistik dan mengelola link. Jangan gunakan untuk data sensitif atau jika perubahan link harus dibatasi.

Sistem menghitung request ke endpoint redirect; bot dan preview tautan juga bisa ikut tercatat. Statistik harian memakai UTC. Log menyimpan waktu, referrer, dan user-agent; IP tidak disimpan.
