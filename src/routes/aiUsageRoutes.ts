import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyAiCredits } from "../controllers/aiUsageController.js";

const router = express.Router();

router.get("/me", protect, getMyAiCredits);

export default router;