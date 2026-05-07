import express from 'express';
import { 
  getCodeBlocks,     // <--- 1. Swapped import here
  createCodeBlock, 
  updateCodeBlock, 
  deleteCodeBlock, 
  getUserFolders 
} from '../controllers/codeblock/codeBlockController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply the 'protect' middleware to all routes
router.use(protect);

router.route('/')
  .get(getCodeBlocks) // <--- 2. Swapped function here
  .post(createCodeBlock);

// Note: This must come BEFORE the /:id route so Express doesn't think "folders" is an ID
router.route('/folders')
  .get(getUserFolders);

router.route('/:id')
  .put(updateCodeBlock)
  .delete(deleteCodeBlock);

export default router;