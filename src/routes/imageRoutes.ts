import express from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/imageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Notice how the uploadMiddleware sits right before the controller
router.post('/upload', protect, uploadMiddleware, uploadImage);

export default router;