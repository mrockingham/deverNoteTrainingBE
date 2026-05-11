import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import codeBlockRoutes from './routes/codeBlockRoutes.js';
import themeRoutes from './routes/themeRoutes.js';
import utilsRoutes from './routes/utilsRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import lessonPlanRoutes from './routes/lessonPlanRoutes.js';
import lessonStepRoutes from './routes/lessonStepRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import aiLessonRoutes from './routes/aiLessonRoutes.js';
import aiUsageRoutes from './routes/aiUsageRoutes.js';
import sandboxSessionRoutes from './routes/sandboxSessionRoutes.js';




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
app.use('/api/projects', projectRoutes);
app.use("/api/lesson-plans", lessonPlanRoutes);
app.use("/api/lesson-steps", lessonStepRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/ai-lessons", aiLessonRoutes);
app.use("/api/ai-usage", aiUsageRoutes);
app.use("/api/sandbox-sessions", sandboxSessionRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/images', imageRoutes);

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});