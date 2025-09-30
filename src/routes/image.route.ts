import { Router } from "express";
import { compress } from "../controllers/image.controller";

const router = Router();

router.get('/', compress);

export default router;
