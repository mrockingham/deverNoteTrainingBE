import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { getAiCreditsRemaining } from "../services/aiUsageService.js";

export const getMyAiCredits = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const aiCreditsRemaining = await getAiCreditsRemaining(userId);

    res.status(200).json({ aiCreditsRemaining });
  } catch (error) {
    console.error("Error fetching AI credits:", error);
    res.status(500).json({ error: "Failed to fetch AI credits" });
  }
};