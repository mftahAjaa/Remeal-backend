# Implementasi PRD Orang A

## Sebelum Perubahan

- Belum ada route atau service Reviews dan Complaints.
- Controller `reviews` dan `complaints` masih kosong.
- `mapDbError` belum menangani `ORDER_NOT_COMPLETED` dan `NOT_ORDER_OWNER`.
- `app.js` belum menggabungkan semua router Orang A melalui `routes/index.js`.
- Operasi katalog dan checkout Tahap 2 belum tersedia.

## Sesudah Perubahan

- Reviews memiliki endpoint buat, edit, dan lapor; Complaints memiliki endpoint pengajuan.
- Pembuatan review mengandalkan trigger database untuk validasi order dan pengisian `store_id`/`product_id`.
- Edit review memeriksa pemilik, batas waktu dari `platform_settings`, dan hanya mengubah `rating`, `comment`, atau `photo_url`.
- Complaint terkait order memeriksa kepemilikan konsumen atau kepemilikan toko seller.
- Route baru sudah dipasang pada app dan memakai autentikasi serta pemeriksaan role.
- `mapDbError` menerjemahkan error trigger dan unique violation.
- Stores, Categories, Products, dan Orders konsumen menggunakan pola routes/controllers/services.
- Pencarian toko/produk memakai RPC database; detail produk memakai `products_public`.
- Checkout dan pembatalan memanggil RPC atomik `create_order` dan `cancel_order`.
- `routes/index.js` menggabungkan seluruh router dengan total 29 endpoint Orang A.
- README memuat setup dan contoh request alur konsumen.

## Validasi

- Pemeriksaan sintaks dan diagnostik file lulus.
- `npm test` menjalankan smoke tests untuk schema, parameter RPC, jumlah route, serta urutan route QR.
- Route terlindungi diuji menolak request tanpa JWT dengan status 401.
- Integration tests ke Supabase nyata memvalidasi tabel, RPC katalog, dan workflow checkout sampai review/complaint.
- Dua checkout serentak untuk stok terakhir menghasilkan satu sukses dan satu `INSUFFICIENT_STOCK`.
- Replay webhook tidak membuat QR baru; QR kedua kali ditolak; penyelesaian manual juga diuji.
- Integration fixtures dihapus; pemeriksaan akhir menemukan nol fixture tersisa pada tabel yang disentuh.
- Test write hanya berjalan dengan `ALLOW_SUPABASE_TEST_WRITES=true` dan harus digunakan pada project non-production.

## Checklist Endpoint (29)

### Tahap 1: Akun dan Profil (8)

- [x] `POST /auth/register`
- [x] `POST /auth/verify-otp`
- [x] `POST /auth/login`
- [x] `POST /auth/logout`
- [x] `POST /auth/forgot-password`
- [x] `POST /auth/reset-password`
- [x] `GET /me`
- [x] `PATCH /me`

### Tahap 2: Katalog dan Pemesanan (10)

- [x] `GET /stores`
- [x] `GET /stores/{storeId}`
- [x] `GET /stores/{storeId}/reviews`
- [x] `GET /categories`
- [x] `GET /products`
- [x] `GET /products/{productId}`
- [x] `POST /orders`
- [x] `GET /orders`
- [x] `GET /orders/{orderId}`
- [x] `POST /orders/{orderId}/cancel`

### Tahap 3: Pembayaran dan QR Pickup (7)

- [x] `POST /orders/{orderId}/payment`
- [x] `POST /payments/webhook`
- [x] `GET /seller/orders`
- [x] `GET /seller/orders/{orderId}`
- [x] `POST /seller/orders/{orderId}/confirm`
- [x] `POST /seller/orders/verify-qr`
- [x] `POST /seller/orders/{orderId}/complete`

### Tahap 4: Ulasan dan Keluhan (4)

- [x] `POST /orders/{orderId}/review`
- [x] `PATCH /reviews/{reviewId}`
- [x] `POST /reviews/{reviewId}/report`
- [x] `POST /complaints`
