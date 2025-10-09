import express, { Application, Request, Response, NextFunction } from "express";
import routes from './routes/image.route';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8085;
const BASE_PATH = process.env.BASE_PATH || '/image-compress';

app.use(express.json());

// Basic health check endpoint
app.get('/healt', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'wec-fe-image-compress'
  });
});

// Mount routes under BASE_PATH
app.use(BASE_PATH, routes);

// Handle 404 - Route not found
app.use((req: Request, res: Response) => {
  logger.error(`Path not found: ${req.path}`);
  res.status(404).json({
    status: 'error',
    code: 'ROUTE_NOT_FOUND',
    message: 'The requested path does not exist',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    path: req.path
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}${BASE_PATH}`);
});
