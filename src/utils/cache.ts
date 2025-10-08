import { Request } from "express";
import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL as string);

export const getCacheKey = (req: Request) => {
  const { url, w, h, q } = req.query;
  return `${url}-${w || ''}-${h || ''}-${q || ''}`;
}

export const getCache = async (key: string) => {
  const data = await redis.getBuffer(key);
  if (!data) {
    return null;
  }
  const contentType = await redis.get(`${key}:contentType`);
  return { buffer: data, contentType };
}

export const setCache = (key: string, value: { contentType: string, buffer: Buffer }) => {
  redis.set(key, value.buffer);
  redis.set(`${key}:contentType`, value.contentType);
}