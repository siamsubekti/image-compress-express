import express, { Application } from "express";
import routes from './routes/image.route';
import dotenv from 'dotenv';
// import morgan from 'morgan';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.use(express.json());

app.use('/api', routes);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});