import * as uploadService from '../services/upload.service.js';

export async function uploadPhoto(req, res, next) {
  try {
    const { bucket } = req.params;
    const result = await uploadService.uploadPhoto(req.file, bucket);
    return res.status(200).json({
      message: 'Foto berhasil diupload',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
