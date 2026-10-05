import multer from 'multer';

// Menggunakan memory storage agar bisa langsung diupload ke Supabase (tanpa simpan di disk server)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
});
