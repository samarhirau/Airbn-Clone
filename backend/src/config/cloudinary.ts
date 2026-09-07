import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

if (process.env.CLOUDINARY_ENABLED === 'true') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary credentials not provided. Using fallback mock for uploads.');
}

export interface UploadResult {
  url: string;
  publicId: string;
}

// Upload buffer stream to Cloudinary
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = 'stayhub/properties',
): Promise<UploadResult> {
  if (process.env.CLOUDINARY_ENABLED !== 'true') {
    const mockId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const mockUrl = `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80&mock=${mockId}`;
    return { url: mockUrl, publicId: mockId };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed with empty result.'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}
