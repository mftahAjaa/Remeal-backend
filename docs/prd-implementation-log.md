# Catatan Implementasi PRD ReMeal: Orang B

Dokumen ini mencatat kondisi implementasi sebelum dan sesudah pekerjaan berdasarkan `docs/PRD ReMeal_ Orang B.md`. Kontrak endpoint tetap mengikuti `docs/openapi.yaml`.

## Sebelum Perubahan

- Tanggal pemeriksaan: 2026-10-02.
- Branch `main` berada pada commit `a0198a1`; working tree berisi PRD Orang B sebagai file belum terlacak.
- PRD mencakup 28 operasi pada empat tahap.
- Aplikasi sudah memiliki runtime Express dan route untuk Auth, Profile, Payments, Seller Orders, Reviews, serta pengajuan Complaints.
- Fondasi yang tersedia meliputi autentikasi Supabase, pemeriksaan role, validasi Zod, format error `{ code, message, details }`, pagination, dan beberapa service domain.
- Route untuk Stores, Categories, Seller Products, Seller Dashboard, dan Admin belum dipasang pada aplikasi.
- Beberapa controller domain Orang B masih kosong. Fitur toko, kategori, produk seller, dashboard, dan operasi admin belum terimplementasi.
- Tahap 4 baru sebagian: pembuatan/edit/laporan ulasan dan pengajuan keluhan tersedia; balasan ulasan seller, daftar laporan admin, dan moderasi admin belum tersedia.
- `supabase/migrations` hanya berisi `.gitkeep`; skema database dan RPC belum terdokumentasi di repo.
- Belum ada test suite yang berjalan; script `npm test` masih placeholder.

## Sesudah Perubahan

Tanggal: 2026-10-02.

- Tahap 1 tersedia: registrasi dan update toko, profil toko seller, daftar/filter toko admin, keputusan verifikasi beserta alasan wajib saat reject/suspend, dan CRUD kategori admin. Daftar kategori publik ikut dipasang sesuai OpenAPI.
- Tahap 2 tersedia: daftar, tambah, ubah, hapus, dan tutup produk seller; SQL menghitung status dari stok/tenggat dengan penutupan manual sebagai prioritas; dashboard dan pengingat stok menggunakan ambang yang diatur pada `platform_settings`.
- Tahap 3 tersedia: dashboard admin, daftar/aktif-nonaktif/hapus pengguna, pemantauan pesanan dan status pembayaran, daftar/penanganan keluhan, serta baca/ubah pengaturan.
- Tahap 4 tersedia: daftar ulasan seller, balasan maksimal 500 karakter, daftar laporan, dan moderasi show/hide/delete. Moderasi serta penyelesaian laporan menggunakan RPC database dalam satu transaksi; trigger memperbarui agregat rating dan kolom verifikasi/moderasi mencatat aktor serta waktu.
- Seluruh 28 operasi PRD telah didaftarkan pada route yang dipasang aplikasi. Smoke test mengirim request anonim ke setiap method/path dan memverifikasi status `401` serta bentuk error sesuai kontrak.
- SQL kanonis tersedia lokal sebagai `docs/.sql`, tetapi file tersebut di-ignore dan tidak termasuk commit; schema/RPC harus dikelola atau diterapkan secara terpisah. Tidak ada migration SQL Orang B di `supabase/migrations`.
- README sekarang memuat cara menjalankan aplikasi dan contoh request seller/admin.
- Tes lokal: `npm test` lulus (11 test); `node --check` lulus untuk 61 file JavaScript; diagnostik editor tidak menemukan error.

### Batas Verifikasi dan Pekerjaan Lanjutan

- Seluruh tabel backend dan RPC `get_admin_dashboard` telah dicek read-only pada Supabase live melalui `.env`; endpoint `/health` dan `GET /api/v1/categories` juga lulus.
- Database live belum memiliki `reviews.consumer_name`; backend mengambil nama dari relasi `profiles` sebagai fallback. Kolom snapshot tersedia di SQL baru dan dapat ditambahkan pada database berjalan dengan statement upgrade di README.
- SQL belum dijalankan dari workspace karena `psql`, Supabase CLI, dan URL koneksi PostgreSQL langsung tidak tersedia. Fungsi tulis/RPC dan alur seller/admin belum diuji dengan data nyata.
- Status produk disinkronkan oleh `refresh_product_statuses()`; aktifkan jadwal `pg_cron` opsional di bagian akhir `docs/.sql` agar transisi waktu terjadi tanpa request.
- SQL menyimpan snapshot nama toko/produk dan harga pada pesanan; integrasi langsung dengan perubahan produk tetap belum diuji terhadap database.
- Dashboard menggunakan zona waktu `Asia/Jakarta` dari `app_tz()` pada SQL acuan.
- Ambang pengingat stok dapat diatur pada `platform_settings`, tetapi field tersebut tidak diekspos oleh schema PATCH `/admin/settings` di OpenAPI; perubahan kontrak diperlukan sebelum dapat diatur melalui API.
- Tes menggunakan kredensial dummy hanya untuk memastikan routing/auth guard tanpa koneksi Supabase; belum ada uji integrasi dengan akun seller/admin riil.