# ReMeal Backend

## Alur Konsumen dan Transaksi
Backend API konsumen dan transaksi ReMeal menggunakan Node.js 20+, Express, dan Supabase.

## Menjalankan Lokal

1. Jalankan `npm install`.
2. Salin `.env.example` menjadi `.env`, lalu isi URL dan key Supabase.
3. Jalankan `npm run dev`; API tersedia di `http://localhost:4000/api/v1`.
4. Cek `GET http://localhost:4000/health` untuk status proses.

Swagger UI tersedia di `http://localhost:4000/api-docs/`; dokumen OpenAPI JSON tersedia di `http://localhost:4000/api-docs.json`.

Jalankan unit/smoke tests dengan `npm test`. Integration suite Supabase memakai `.env` lokal dan mencakup read checks serta workflow write dengan fixture sementara. Fixture mencakup akun, toko, produk, pesanan, pembayaran, ulasan, dan keluhan, lalu dibersihkan. Jalankan hanya pada project Supabase non-production dengan opt-in eksplisit:

```bash
$env:ALLOW_SUPABASE_TEST_WRITES = 'true'; npm run test:integration; Remove-Item Env:ALLOW_SUPABASE_TEST_WRITES
```

## Contoh Alur Konsumen

Registrasi:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register -H "Content-Type: application/json" -d '{"full_name":"Dina","email":"dina@example.com","password":"password123","role":"consumer"}'
```

Cari produk:

```bash
curl "http://localhost:4000/api/v1/products?q=roti&sort=nearest&page=1&limit=20"
```

Buat pesanan dengan token hasil login/verifikasi:

```bash
curl -X POST http://localhost:4000/api/v1/orders -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"product_id":"00000000-0000-0000-0000-000000000001","quantity":1,"note":"Tanpa sambal"}'
```

Mulai pembayaran mock:

```bash
curl -X POST http://localhost:4000/api/v1/orders/$ORDER_ID/payment -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"method":"qris"}'
```

Webhook mock menerima body `external_id`, `status`, dan `signature`. Signature adalah HMAC-SHA256 hex dari JSON payload tanpa field `signature`, menggunakan `WEBHOOK_SECRET`.

Scan QR sebagai seller:

```bash
curl -X POST http://localhost:4000/api/v1/seller/orders/verify-qr -H "Authorization: Bearer $SELLER_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"qr_code":"<qr_code_dari_pesanan>"}'
```

Semua endpoint konsumen dan transaksi Orang A terdaftar di `src/routes/index.js`; kontrak lengkap ada di `docs/openapi.yaml`.
## Alur Seller dan Admin

## Menjalankan

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Isi `.env` dengan kredensial proyek Supabase dan secret webhook yang sesuai. Jangan commit file `.env` atau secret. Server mendengarkan port `4000` secara default.

Jalankan tes lokal:

```powershell
npm test
```

## Contoh Request Tahap Orang B

> Gunakan access token Supabase untuk endpoint seller dan admin. Admin memakai akun ber-role `super_admin`.

Daftarkan toko sebagai seller:

```sh
curl -X POST http://localhost:4000/api/v1/stores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Roti Pagi","business_type":"bakery","address":"Jl. Melati 1","latitude":-7.8,"longitude":110.3,"contact_phone":"08123456789"}'
```

Setujui toko sebagai admin:

```sh
curl -X PATCH http://localhost:4000/api/v1/admin/stores/STORE_ID/verification \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

Tambahkan produk untuk toko yang sudah disetujui:

```sh
curl -X POST http://localhost:4000/api/v1/seller/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Roti Sore","category_id":"CATEGORY_ID","normal_price":20000,"discount_price":15000,"stock":8,"sale_start_at":"2030-01-01T15:00:00Z","order_deadline_at":"2030-01-01T18:00:00Z","pickup_deadline_at":"2030-01-01T19:00:00Z"}'
```

Lihat dashboard seller dan admin:

```sh
curl http://localhost:4000/api/v1/seller/dashboard -H "Authorization: Bearer $TOKEN"
curl http://localhost:4000/api/v1/admin/dashboard -H "Authorization: Bearer $ADMIN_TOKEN"
```

Balas ulasan dan moderasi laporan sebagai seller/admin:

```sh
curl -X POST http://localhost:4000/api/v1/seller/reviews/REVIEW_ID/reply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reply":"Terima kasih atas ulasannya."}'
curl -X PATCH http://localhost:4000/api/v1/admin/reviews/REVIEW_ID/moderation \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"hide","note":"Ditinjau admin"}'
```

Semua error menggunakan `{ "code", "message", "details" }`; validasi gagal memakai HTTP `422`.

## Database

Definisi schema dan RPC dikelola di luar file yang dilacak repository; file SQL lokal dikecualikan oleh aturan ignore. Pastikan database Supabase sudah memiliki tabel dan fungsi yang dipakai backend sebelum menjalankan endpoint. Untuk upgrade database review lama, jalankan `alter table public.reviews add column if not exists consumer_name text;` melalui SQL Editor. Jangan jalankan ulang script schema penuh pada database yang sudah berisi schema.
