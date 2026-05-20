import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
export const AWS_REGION = process.env.AWS_REGION || process.env.REGION || 'ap-southeast-1';
