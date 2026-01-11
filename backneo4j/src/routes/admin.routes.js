import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

// Driver management routes
router.post('/drivers', adminController.createDriver);
router.get('/drivers', adminController.getAllDrivers);
router.get('/drivers/:driverId', adminController.getDriverById);
router.put('/drivers/:driverId/status', adminController.updateDriverStatus);
router.post('/drivers/:driverId/ban', adminController.banDriver);
router.post('/drivers/:driverId/pause', adminController.pauseDriver);

// Trip management routes
router.get('/trips', adminController.getAllTrips);

// Complaint management routes
router.get('/complaints', adminController.getAllComplaints);
router.put('/complaints/:complaintId/process', adminController.processComplaint);
router.get('/complaints/stats', adminController.getComplaintStats);

// Statistics routes
router.get('/stats', adminController.getAdminStats);
router.get('/statistics', adminController.getAdminStats);

// Wallet routes
router.get('/wallet', adminController.getAdminWallet);

export default router;
