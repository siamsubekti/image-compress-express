import { describe, it, expect, vi } from 'vitest';
import { compress } from './image.controller';
import { Request, Response } from 'express';

// Mock the cache module
vi.mock('../utils/cache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
}));

// Mock the logger module
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Image Controller', () => {
  it('should return 400 if url, expires, and signature are missing', async () => {
    const req = {
      query: {},
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await compress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'url, expires, and signature are required',
    });
  });
});