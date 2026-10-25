# PT. Zeea — Asset Management System

Aplikasi web Sistem Inventarisasi dan Pelepasan Aset Kantor PT. Zeea yang digunakan untuk mencatat, mengelola, dan memantau kondisi aset perusahaan. Aplikasi menggunakan HTML, CSS, dan JavaScript pada frontend serta Supabase PostgreSQL sebagai database.

Demo web: https://faarizaafifaah.github.io/Sistem-Aset-Kantor/

## 1. Fitur Aplikasi

- **Dashboard:** menampilkan ringkasan jumlah aset, kategori, aset rusak, disposal, dan total nilai aset.
- **Data Aset:** mengelola informasi aset perusahaan.
- **Disposal:** mencatat proses pelepasan aset perusahaan.
- **Aset Rusak:** menampilkan aset dengan kondisi rusak.
- **Kategori:** mengelola kategori aset.

## 2. Teknologi yang Digunakan

- HTML
- CSS
- JavaScript
- Supabase JavaScript Client v2
- Supabase PostgreSQL

## 3. Struktur Folder

```text
PT-Zeea/
├── backend/
│   ├── app.js
│   └── database.sql
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md
```

### Fungsi setiap file

**Folder `backend`**

- `app.js` — berisi konfigurasi atau logika backend yang diperlukan aplikasi.
- `database.sql` — berisi perintah SQL untuk struktur dan pengelolaan database PostgreSQL di Supabase.

**Folder `frontend`**

- `index.html` — struktur halaman dan komponen aplikasi.
- `style.css` — mengatur tampilan, warna, tata letak, dan responsivitas aplikasi.
- `script.js` — mengatur interaksi pengguna, pengambilan data, serta operasi tambah, baca, ubah, dan hapus data melalui Supabase.

## 4. Persiapan Aplikasi

1. Siapkan project Supabase yang sudah digunakan.
2. Pastikan tabel database yang dibutuhkan aplikasi tersedia.
3. Buka file `frontend/script.js`.
4. Periksa konfigurasi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
5. Isi URL dan anon/publishable key sesuai project Supabase milik kamu.
6. Simpan perubahan.
7. Buka `frontend/index.html` menggunakan browser dengan koneksi internet.

**Catatan:** gunakan project Supabase yang sudah ada. Jangan membuat project baru atau menjalankan SQL yang membuat ulang maupun menghapus tabel yang sudah memiliki data.

## 5. Database

Database menggunakan PostgreSQL melalui Supabase. Tabel utama aplikasi meliputi:

- `aset` — menyimpan data inventaris aset.
- `kategori` — menyimpan kategori aset.
- `disposal` — menyimpan catatan pelepasan aset.

Struktur kolom harus mengikuti database yang sudah digunakan aplikasi. Jika ada perubahan struktur, sesuaikan kode JavaScript dengan nama tabel dan kolom yang sebenarnya.

## 6. Cara Menggunakan

1. Jalankan aplikasi dengan membuka `frontend/index.html`.
2. Pilih menu Dashboard untuk melihat ringkasan inventaris.
3. Buka Data Aset untuk mengelola data aset.
4. Buka Disposal untuk mencatat pelepasan aset.
5. Buka Aset Rusak untuk memeriksa aset yang mengalami kerusakan.
6. Buka Kategori untuk mengelola pengelompokan aset.
7. Gunakan fitur pencarian dan formulir yang tersedia untuk mengelola data.

## 7. Pemecahan Masalah

### Data tidak muncul

- Pastikan URL dan key Supabase sudah benar.
- Pastikan tabel yang dibutuhkan tersedia.
- Periksa koneksi internet dan kebijakan Row Level Security (RLS).

### Data disposal gagal disimpan

- Periksa struktur tabel `disposal`.
- Pastikan nama kolom pada `script.js` sesuai dengan database.
- Pastikan tipe data dan relasi aset sudah benar.
- Periksa izin operasi `INSERT` pada kebijakan RLS.

### Muncul error HTTP 400

Periksa detail error pada Console atau Network browser. Penyebabnya dapat berupa nama kolom yang tidak sesuai, format data yang salah, atau tipe data yang tidak cocok.

## 8. Keamanan

- Jangan memasukkan `service_role` key atau secret key ke frontend.
- Gunakan anon/publishable key untuk koneksi browser.
- Atur kebijakan RLS agar akses data sesuai dengan hak pengguna.
- Lakukan backup sebelum mengubah struktur database.

## 9. Tujuan Proyek

Aplikasi ini dibuat untuk membantu PT. Zeea mengelola inventaris aset kantor secara lebih terstruktur, memantau kondisi aset, dan mendokumentasikan proses pelepasan aset dalam satu sistem.

## 10. Lisensi

Lisensi proyek belum ditentukan.
