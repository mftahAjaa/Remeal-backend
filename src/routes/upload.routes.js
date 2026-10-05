import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Endpoint upload foto (hanya untuk user terautentikasi)
// Contoh penggunaan: POST /upload/avatars atau POST /upload/product-photos
router.post('/upload/:bucket', requireAuth, upload.single('file'), uploadController.uploadPhoto);

export default router;
