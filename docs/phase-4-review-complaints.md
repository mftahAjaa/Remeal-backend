# Tahap 4: Reviews dan Complaints

## Sebelum Perubahan

- Belum ada route atau service Reviews dan Complaints.
- Controller `reviews` dan `complaints` masih kosong.
- `mapDbError` belum menangani `ORDER_NOT_COMPLETED` dan `NOT_ORDER_OWNER`.
- `app.js` memasang router satu per satu dan belum memuat route Reviews/Complaints.

## Sesudah Perubahan

- Reviews memiliki endpoint buat, edit, dan lapor; Complaints memiliki endpoint pengajuan.
- Pembuatan review mengandalkan trigger database untuk validasi order dan pengisian `store_id`/`product_id`.
- Edit review memeriksa pemilik, batas waktu dari `platform_settings`, dan hanya mengubah `rating`, `comment`, atau `photo_url`.
- Complaint terkait order memeriksa kepemilikan konsumen atau kepemilikan toko seller.
- Route baru sudah dipasang pada app dan memakai autentikasi serta pemeriksaan role.
- `mapDbError` menerjemahkan error trigger dan unique violation.

## Validasi

- Pemeriksaan sintaks dan diagnostik file lulus.
- Schema review/complaint dan error trigger diuji.
- Keempat route baru diuji menolak request tanpa JWT dengan status 401.
- Integrasi dengan database Supabase belum diuji.

## Integrasi Tertunda

- `routes/index.js` belum dibuat karena router Stores, Categories, Products, dan Orders belum tersedia di workspace.
- Checklist 29 endpoint menunggu daftar path/metode yang dimaksud; `docs/openapi.yaml` saat ini mendefinisikan 57 operasi.
