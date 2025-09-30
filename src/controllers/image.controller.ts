import { Request, Response } from "express";
import axios from "axios";
import sharp from "sharp";
import crypto from "crypto";
import { getCacheKey, getCache, setCache } from "../utils/cache";

export const compress = async(req: Request, res: Response) => {
  try {
    const { url, w, h, q, expires, signature } = req.query;

    if (!url || !expires || !signature) {
      return res.status(400).json({ message: 'url, expires, and signature are required' });
    }

    const secret = process.env.SIGNED_URL_SECRET;
    if (!secret) {
      throw new Error("SIGNED_URL_SECRET is not set");
    }

    if (Date.now() > parseInt(expires as string)) {
      return res.status(403).json({ message: 'URL has expired' });
    }

    const dataToSign = `${url}${w || ''}${h || ''}${q || ''}${expires}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const cacheKey = getCacheKey(req);
    const cached = getCache(cacheKey);

    if (cached) {
      res.set("Content-Type", cached.contentType);
      return res.send(cached.buffer);
    }

    const response = await axios.get(url as string, {
      responseType: 'arraybuffer'
    });

    const inputBuffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];

    let image = sharp(inputBuffer).resize(
      w ? parseInt(w as string) : undefined,
      h ? parseInt(h as string) : undefined,
      {
        fit: "cover",
        withoutEnlargement: true
      }
    );

    // Tentukan format berdasarkan content-type
    let format = "jpeg";
    if (contentType?.includes("png")) format = "png";
    else if (contentType?.includes("webp")) format = "webp";
    else if (contentType?.includes("jpg") || contentType?.includes("jpeg")) format = "jpeg";

    // Apply compression
    if (format === "jpeg") {
      image = image.jpeg({ quality: q ? parseInt(q as string) : 80 });
    } else if (format === "png") {
      image = image.png({ quality: q ? parseInt(q as string) : 80, compressionLevel: 8 });
    } else if (format === "webp") {
      image = image.webp({ quality: q ? parseInt(q as string) : 80 });
    }

    const outputBuffer = await image.toBuffer();

    setCache(cacheKey, { contentType: `image/${format}`, buffer: outputBuffer });

    res.set("Content-Type", `image/${format}`);
    res.send(outputBuffer);

  } catch (e: any) {
    console.error(e.message);
    res.status(500).json({ error: "Failed to process image" });
  }
}
