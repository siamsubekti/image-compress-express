import { Request, Response } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import logger from "../utils/logger";
import { getCache, setCache } from '../utils/cache';
import axios from 'axios';

// Helper function to parse query parameters and validate them
const parseAndValidateImageRequest = (req: Request) => {
  const { url, w, h, q, expires, signature } = req.query;

  const imageUrl = url as string;
  const width = w ? parseInt(w as string) : undefined;
  const height = h ? parseInt(h as string) : undefined;
  const quality = q ? parseInt(q as string) : undefined;
  const expiresStr = expires as string;
  const signatureStr = signature as string;

  if (!imageUrl || !expiresStr || !signatureStr) {
    throw new Error('url, expires, and signature are required');
  }
  return { imageUrl, width, height, quality, expiresStr, signatureStr };
};

// Helper function to verify signature and expiration (placeholder)
const verifySignature = (url: string, expires: string, signature: string) => {
  // In a real application, you would verify the signature and expiration
  // For this example, we'll return true.
  return true;
};

// Helper function to generate cache key
const generateCacheKey = (
  url: string,
  width?: number,
  height?: number,
  quality?: number
) => {
  return `image-cache-${url}-${width || 'auto'}-${height || 'auto'}-${
    quality || 'auto'
  }`;
};

// Helper function to get image path (placeholder for actual image fetching)
const getImagePath = async (imageUrl: string) => {
  // In a real application, this would involve fetching the image from the URL
  // and saving it locally or streaming it. For this example, we'll use a dummy image.
  const dummyImagePath = path.join(
    __dirname,
    '..',
    '..',
    'assets',
    'dummy.jpg'
  );
  try {
    await fs.access(dummyImagePath);
    return dummyImagePath;
  } catch (error) {
    logger.error(`Dummy image not found at ${dummyImagePath}: ${error}`);
    throw new Error('Image not found');
  }
};

// Helper function to process image
const processImage = async (
  buffer: Buffer,
  contentType: string,
  width?: number,
  height?: number,
  quality?: number
) => {
  let image = sharp(buffer);

  if (width || height) {
    image = image.resize(width, height);
  }

  let format;

  if (contentType.includes('png')) format = 'png';
  else if (contentType.includes('webp')) format = 'webp';
  else if (contentType.includes('jpg') || contentType.includes('jpeg')) format = 'jpeg';

  switch (format) {
    case 'png':
      image = image.png({
        quality: quality || 80, compressionLevel: 8,
      });
      break;
    case 'webp':
      image = image.webp({
        quality: quality || 80,
      });
      break;
    case 'jpeg':
    default:
      image = image.jpeg({
        quality: quality || 80,
      });
      break;
  }

  return await image.toBuffer();
};

// Helper function to send image
const sendImage = (res: Response, buffer: Buffer, contentType: string, cacheKey: string) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(buffer);
  setCache(cacheKey, { contentType: contentType, buffer: buffer }); // Cache the processed image
};

// New function to handle image processing logic
const handleImageProcessing = async (
  imageUrl: string,
  width?: number,
  height?: number,
  quality?: number
) => {
  const cacheKey = generateCacheKey(imageUrl, width, height, quality);
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    logger.info(`Serving from cache: ${cacheKey}`);
    return { buffer: cachedData.buffer, contentType: cachedData.contentType || 'image/webp', cacheKey, fromCache: true };
  }

  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data);
  const contentType = response.headers['content-type'];
  
  const processedBuffer = await processImage(
    imageBuffer,
    contentType,
    width,
    height,
    quality
  );

  logger.info(`Processed and serving image for: ${imageUrl}`);
  return { buffer: processedBuffer, contentType: contentType, cacheKey, fromCache: false };
};

export const compress = async (req: Request, res: Response) => {
  try {
    const { imageUrl, width, height, quality, expiresStr, signatureStr } =
      parseAndValidateImageRequest(req);

    if (!verifySignature(imageUrl, expiresStr, signatureStr)) {
      return res.status(403).json({ error: 'Invalid signature or expired URL' });
    }

    const { buffer, contentType, cacheKey } = await handleImageProcessing(
      imageUrl,
      width,
      height,
      quality
    );

    sendImage(res, buffer, contentType, cacheKey);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error(`Error processing image: ${errorMessage}`);
    if (errorMessage === 'url, expires, and signature are required') {
      return res.status(400).json({ error: errorMessage });
    }
    if (errorMessage === 'Invalid signature or expired URL') {
      return res.status(403).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Error processing image' });
  }
};

