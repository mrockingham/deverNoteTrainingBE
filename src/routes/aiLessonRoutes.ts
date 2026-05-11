import express from "express";
import {
  generateAiLesson,
  generateAndSaveAiLesson,
} from "../controllers/aiLessonController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateAiLesson);
router.post("/generate-and-save", protect, generateAndSaveAiLesson);

export default router;