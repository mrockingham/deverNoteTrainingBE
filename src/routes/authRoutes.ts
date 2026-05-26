import express from 'express';
import { register, login, updateProfile, getProfile, logout, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', protect, logout);

// PUT /api/auth/profile    

router.put('/profile', protect, updateProfile);

router.get('/profile', protect, getProfile);

router.post('/google', googleLogin)


export default router;