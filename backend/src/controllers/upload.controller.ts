import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/errors';
import { uploadBufferToCloudinary } from '../config/cloudinary';

// Upload single property image
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No image file provided. Use form field "image".');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer);
  return sendSuccess(res, result, 201);
});

// Upload multiple property images (up to 10)
export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw AppError.badRequest('No image files provided. Use form field "images".');
  }

  const uploadPromises = files.map((file) => uploadBufferToCloudinary(file.buffer));
  const results = await Promise.all(uploadPromises);

  return sendSuccess(res, { images: results }, 201);
});
