# PT. Zeea — Asset Management System

Aplikasi web sederhana untuk mengelola inventarisasi dan pelepasan aset kantor PT. Zeea. Aplikasi menggunakan HTML, CSS, dan JavaScript dengan Supabase sebagai database.

## 1. Fitur Aplikasi

- **Dashboard:** menampilkan ringkasan jumlah aset, aset baik, aset rusak, dan total nilai aset.
- **Data Aset:** melihat, menambah, mengedit, mencari, dan menghapus data aset.
- **Disposal:** mencatat pelepasan aset perusahaan.
- **Aset Rusak:** menampilkan aset yang mengalami kerusakan.
- **Kategori:** mengelola kategori aset perusahaan.

## 2. Teknologi yang Digunakan

- HTML
- CSS
- JavaScript
- Supabase JavaScript Client v2
- Supabase PostgreSQL

## 3. Struktur File

```text
PT-Zeea/
├── PT_Zeea_Asset_Management.html
└── README.md
```

File HTML berisi kode tampilan, styling CSS, dan JavaScript aplikasi dalam satu file agar mudah diedit menggunakan Notepad++.

## 4. Persiapan dan Instalasi

1. Pastikan sudah memiliki project Supabase.
2. Buka project Supabase yang digunakan oleh aplikasi.
3. Ambil Project URL dan anon/publishable key dari pengaturan API Supabase.
4. Buka file `PT_Zeea_Asset_Management.html` menggunakan Notepad++.
5. Cari konfigurasi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
6. Pastikan URL dan key sesuai dengan project Supabase yang digunakan.
7. Simpan perubahan dan buka file HTML menggunakan browser.
8. Pastikan perangkat terhubung ke internet agar library Supabase dari CDN dapat dimuat.

**Catatan keamanan:** jangan pernah memasukkan `service_role` key atau secret key ke dalam file HTML/JavaScript yang dapat diakses pengguna.

## 5. Database

Aplikasi menggunakan tiga tabel utama:

### Tabel `aset`

Kolom yang diharapkan oleh kode saat ini:

- `id`
- `kode_aset`
- `nama_aset`
- `kategori_id`
- `lokasi`
- `tanggal_perolehan`
- `harga_perolehan`
- `masa_manfaat_tahun`
- `kondisi`
- `status`

### Tabel `kategori`

Kolom yang diharapkan:

- `id`
- `nama_kategori`
- `keterangan`

### Tabel `disposal`

Kolom yang diasumsikan oleh formulir saat ini:

- `id`
- `aset_id`
- `tanggal_disposal`
- `alasan`
- `nilai_jual`
- `keterangan`

**Penting:** nama tabel dan kolom harus disesuaikan dengan database Supabase yang sebenarnya. Jangan membuat ulang atau menghapus tabel yang sudah ada hanya untuk mengikuti dokumentasi ini.

## 6. Cara Menggunakan

1. Buka aplikasi melalui browser.
2. Pilih menu Dashboard, Data Aset, Disposal, Aset Rusak, atau Kategori.
3. Klik tombol Tambah Data pada menu yang sesuai.
4. Isi formulir dengan data yang benar.
5. Klik Simpan Data.
6. Gunakan fitur pencarian untuk menemukan data.
7. Gunakan tombol Edit atau Hapus jika tersedia.

## 7. Pemecahan Masalah

### Data tidak muncul

- Periksa koneksi internet.
- Pastikan Project URL dan key Supabase benar.
- Periksa nama tabel dan kolom.
- Periksa kebijakan Row Level Security (RLS).

### Data disposal gagal disimpan

- Pastikan tabel `disposal` tersedia.
- Cocokkan nama kolom dengan konfigurasi JavaScript.
- Pastikan aset yang dipilih tersedia.
- Periksa tipe data dan kebijakan RLS untuk operasi `INSERT`.

### Muncul error HTTP 400

Periksa detail error di Console atau Network pada browser. Error ini dapat terjadi karena nama kolom tidak sesuai, tipe data salah, atau format data yang dikirim tidak valid.

### Muncul peringatan Tracking Prevention

Peringatan ini dapat berkaitan dengan pembatasan penyimpanan oleh browser. Periksa apakah aplikasi masih dapat terhubung ke Supabase. Jika request gagal, periksa juga pesan error dari API Supabase.

## 8. Keamanan

- Gunakan anon/publishable key pada frontend.
- Jangan memasukkan secret key ke dalam kode frontend.
- Terapkan kebijakan RLS sesuai kebutuhan pengguna.
- Hindari memberikan izin baca dan tulis kepada semua pengguna tanpa pembatasan.
- Lakukan backup sebelum mengubah struktur database.

## 9. Tujuan Proyek

Aplikasi ini bertujuan membantu perusahaan PT. Zeea melakukan pencatatan aset, memantau kondisi aset, mengelompokkan kategori, dan mendokumentasikan proses pelepasan aset secara lebih teratur.

## 10. Lisensi

Lisensi proyek belum ditentukan.
