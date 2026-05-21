import express from 'express';
import { getLinksByType, createLinkInfo } from '../controllers/utilsController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
router.get('/:type', protect, getLinksByType);
router.post('/', protect, createLinkInfo);
export default router;
