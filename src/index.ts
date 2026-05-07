import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import codeBlockRoutes from './routes/codeBlockRoutes.js';
import themeRoutes from './routes/themeRoutes.js';
import utilsRoutes from './routes/utilsRoutes.js';
import imageRoutes from './routes/imageRoutes.js';




// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Basic health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'DevErNote Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/codeblocks', codeBlockRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/images', imageRoutes);

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});