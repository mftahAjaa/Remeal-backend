# ReMeal Backend

Backend API konsumen dan transaksi ReMeal menggunakan Node.js 20+, Express, dan Supabase.

## Menjalankan Lokal

1. Jalankan `npm install`.
2. Salin `.env.example` menjadi `.env`, lalu isi URL dan key Supabase.
3. Jalankan `npm run dev`; API tersedia di `http://localhost:4000/api/v1`.
4. Cek `GET http://localhost:4000/health` untuk status proses.

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