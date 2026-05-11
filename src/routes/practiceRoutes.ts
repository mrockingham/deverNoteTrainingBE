import express from "express";
import {
  createPracticeSession,
  getPracticeSessionById,
  updatePracticeSession,
  submitStepAttempt,
} from "../controllers/practiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/sessions", createPracticeSession);
router.get("/sessions/:id", getPracticeSessionById);
router.put("/sessions/:id", updatePracticeSession);
router.post("/sessions/:id/attempts", submitStepAttempt);

export default router;