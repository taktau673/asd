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

## Tracking sumber trafik & anti-duplikasi

Versi ini juga mencatat:
- Domain sumber dari HTTP `Referer` (contoh `google.com`, `domain.com`).
- Path halaman sumber (contoh `/folder1/artikel`).
- Keyword dari parameter `keyword`, `keywords`, `q`, `query`, `utm_term`, atau `search_term` jika tersedia.
- Parameter kampanye `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `gclid`, dan `fbclid` pada log aktivitas.
- Ringkasan domain dan keyword pada dashboard.

Contoh URL tracking dengan parameter kampanye:

```text
https://domain-kamu.vercel.app/go/promo?utm_source=facebook&utm_medium=social&utm_campaign=promo-november&keyword=produk+murah
```

Jika pengunjung datang dari halaman `https://domain.com/folder1/artikel`, browser dapat mengirim header `Referer` sehingga domain `domain.com` dan path `/folder1/artikel` bisa dicatat. Hasilnya bergantung pada kebijakan privasi browser, aplikasi, dan situs sumber.

### Pengurangan spam / hit berulang
- User-agent bot dan link-preview umum tidak dihitung sebagai klik.
- Identitas deduplikasi dibuat dari hash IP + user-agent; IP mentah tidak disimpan.
- Pengunjung yang sama pada slug yang sama dihitung maksimal sekali dalam jendela 45 detik.
- Redirect tetap berjalan walaupun request tidak dihitung sebagai klik baru.

Catatan: deduplikasi bukan firewall dan tidak menghentikan request jaringan. Ini mengurangi pencatatan statistik berulang. Pengguna di jaringan bersama dapat tergabung dalam deduplikasi, sedangkan IP dinamis atau user-agent yang berubah dapat membuat satu orang terhitung lagi. Keyword pencarian organik Google umumnya tidak tersedia di `Referer`, sehingga tidak bisa dijamin terbaca. Data lama tetap ada, tetapi ringkasan sumber/keyword hanya terisi untuk klik baru setelah versi ini dipasang.
