import express from 'express';
import { 
  getMyCodeBlocks, 
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
  .get(getMyCodeBlocks)
  .post(createCodeBlock);

// Note: This must come BEFORE the /:id route so Express doesn't think "folders" is an ID
router.route('/folders')
  .get(getUserFolders);

router.route('/:id')
  .put(updateCodeBlock)
  .delete(deleteCodeBlock);

export default router;