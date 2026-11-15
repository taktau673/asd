# Vercel Link Tracker

Dashboard satu domain untuk membuat banyak short tracking links, mencatat request klik, lalu redirect ke URL tujuan.

## Isi fitur

- Dashboard langsung terbuka tanpa login atau password
- Tambah, edit, hapus link
- URL tracking berbentuk `/go/slug`
- Total klik per link dan keseluruhan
- Grafik klik harian 7 hari terakhir
- Riwayat 10 klik terbaru per link (maksimal 30 ditampilkan)
- Redis sebagai penyimpanan permanen

## 1. Siapkan database Upstash Redis

1. Buat database Redis di Upstash.
2. Buka detail database dan salin `UPSTASH_REDIS_REST_URL` serta `UPSTASH_REDIS_REST_TOKEN`.
3. Jangan masukkan token Redis ke file HTML.

## 2. Deploy ke Vercel

1. Upload folder project ini ke repository GitHub.
2. Import repository tersebut di Vercel.
3. Framework preset: Other.
4. Build command dan output directory dapat dikosongkan.
5. Tambahkan Environment Variables berikut di Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_TOKEN` (minimal 24 karakter acak)
   - `APP_BASE_URL` (URL domain Vercel atau custom domain, tanpa slash terakhir)
6. Deploy atau Redeploy setelah environment variables disimpan.

## 3. Buka dashboard

Buka root domain Vercel, misalnya `https://domain-kamu.vercel.app`, dan dashboard langsung terbuka tanpa login.

Contoh:
- URL tracking: `https://domain-kamu.vercel.app/go/promo-a`
- Pengunjung yang membuka URL tersebut akan dicatat lalu diarahkan ke URL tujuan.

## 4. Pengujian

1. Tambahkan link dengan slug `uji-coba` dan URL tujuan milikmu.
2. Buka `https://domain-kamu.vercel.app/go/uji-coba` di tab baru.
3. Kembali ke dashboard dan tekan Refresh data.
4. Jumlah klik seharusnya bertambah.

## Catatan penting

- Sistem ini menghitung request ke endpoint redirect. Bot, preview WhatsApp/Telegram, crawler, dan pemeriksa keamanan tautan juga dapat dihitung sebagai klik. Ini bukan pengukuran pengunjung manusia yang sempurna.
- Log menyimpan waktu, referrer, dan user-agent. IP pengunjung tidak disimpan.
- Hapus link akan menghapus akses link dari daftar, tetapi counter/log Redis lama tidak otomatis dihapus. Jangan gunakan slug yang sama lagi jika ingin mempertahankan pemisahan statistik.
- **PERINGATAN:** Versi ini tidak memakai login/password. Siapa pun yang mengetahui alamat dashboard dapat melihat statistik serta menambah, mengubah, dan menghapus link. Jangan gunakan pada domain publik jika data atau link harus dirahasiakan. Untuk keamanan, batasi akses menggunakan proteksi deployment/akses di depan aplikasi.
- Statistik harian memakai tanggal UTC.
- Untuk penggunaan produksi, aktifkan proteksi tambahan seperti pembatasan akses admin dan pemantauan biaya Redis.
