import prisma from "../prisma.js";
import { AI_USAGE_COSTS } from "../config/aiUsage.js";
export const getAiCreditsRemaining = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiCreditsRemaining: true },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user.aiCreditsRemaining;
};
export const ensureSufficientAiCredits = async (userId, action) => {
    const creditsRemaining = await getAiCreditsRemaining(userId);
    const requiredCredits = AI_USAGE_COSTS[action];
    if (creditsRemaining < requiredCredits) {
        throw new Error(`Not enough AI credits. Required: ${requiredCredits}, remaining: ${creditsRemaining}`);
    }
};
export const consumeAiCredits = async (userId, action) => {
    const requiredCredits = AI_USAGE_COSTS[action];
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiCreditsRemaining: true },
    });
    if (!user) {
        throw new Error("User not found");
    }
    if (user.aiCreditsRemaining < requiredCredits) {
        throw new Error(`Not enough AI credits. Required: ${requiredCredits}, remaining: ${user.aiCreditsRemaining}`);
    }
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            aiCreditsRemaining: {
                decrement: requiredCredits,
            },
        },
        select: { aiCreditsRemaining: true },
    });
    return updatedUser.aiCreditsRemaining;
};
