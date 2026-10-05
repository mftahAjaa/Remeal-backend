import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Endpoint upload foto (hanya untuk user terautentikasi)
router.post('/upload', requireAuth, upload.single('file'), uploadController.uploadPhoto);

export default router;
