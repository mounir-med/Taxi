import express from 'express';
import userController from '../controllers/user.controller.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(userAuth);

// Trip browsing and acceptance
router.get('/trips/available', userController.getAvailableTrips);
router.post('/trips/accept', userController.acceptTrip);
router.get('/trips', userController.getMyTrips);
router.get('/trips/:tripId', userController.getTripById);

// Complaint routes
router.post('/complaints', userController.fileComplaint);
router.get('/complaints', userController.getMyComplaints);

// Utility routes
router.get('/drivers/available', userController.getAvailableDrivers);

export default router;
