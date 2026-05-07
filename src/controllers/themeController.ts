import { Request, Response } from 'express';
import prisma from '../prisma.js';

export const getAllThemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const themes = await prisma.theme.findMany();
    res.status(200).json(themes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
};

export const getThemeByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const  name  = req.params.name as string;
    const theme = await prisma.theme.findUnique({ where: { name } });
    
    if (!theme) {
      res.status(404).json({ error: 'Theme not found' });
      return;
    }
    res.status(200).json(theme);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
};