import { Request } from "express";

const cache = new Map<string, { contentType: string, buffer: Buffer }>();

export const getCacheKey = (req: Request) => {
  const { url, w, h, q } = req.query;
  return `${url}-${w || ''}-${h || ''}-${q || ''}`;
}

export const getCache = (key: string) => {
  return cache.get(key);
}

export const setCache = (key: string, value: { contentType: string, buffer: Buffer }) => {
  cache.set(key, value);
}
