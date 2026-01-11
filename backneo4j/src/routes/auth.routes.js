import express from 'express';
import authController from '../controllers/auth.controller.js';
import { adminAuth, driverAuth, userAuth } from '../middleware/auth.js';

const router = express.Router();

// Registration routes
router.post('/register/user', authController.registerUser);
router.post('/register/driver', authController.registerDriver);
router.post('/register/admin', authController.registerAdmin);

// Login routes
router.post('/login/user', authController.loginUser);
router.post('/login/driver', authController.loginDriver);
router.post('/login/admin', authController.loginAdmin);

// Profile routes (protected)
router.get('/profile/user', userAuth, authController.getUserProfile);
router.get('/profile/driver', driverAuth, authController.getDriverProfile);
router.get('/profile/admin', adminAuth, authController.getAdminProfile);

// Logout routes (protected)
router.post('/logout/user', userAuth, authController.logoutUser);
router.post('/logout/driver', driverAuth, authController.logoutDriver);
router.post('/logout/admin', adminAuth, authController.logoutAdmin);

export default router;
