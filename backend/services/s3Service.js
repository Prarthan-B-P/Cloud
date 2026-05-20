import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppError } from '../utils/httpError.js';

const region = process.env.AWS_REGION || process.env.REGION;

const s3 = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

const mimeToExtension = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
};

export const uploadEventPoster = async (file) => {
  if (!file) return null;

  const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    throw new AppError('AWS_S3_BUCKET is not configured.', 500);
  }

  const extension = mimeToExtension(file.mimetype);
  const key = `event-posters/${Date.now()}-${randomUUID()}${extension}`;

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};
