import multer from 'multer';
import { AppError } from '../utils/errors';

// Memory storage keeps file in buffer for Cloudinary streaming
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
