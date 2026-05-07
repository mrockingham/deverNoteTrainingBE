import express from 'express';
import { getAllThemes, getThemeByName } from '../controllers/themeController.js';

const router = express.Router();

router.get('/', getAllThemes);
router.get('/:name', getThemeByName);

export default router;