import express from 'express';
import driverController from '../controllers/driver.controller.js';
import { driverAuth } from '../middleware/auth.js';

const router = express.Router();

// All driver routes require authentication
router.use(driverAuth);

// Trip creation and management
router.post('/trips', driverController.createTrip);
router.post('/trips/cancel', driverController.cancelTrip);
router.post('/trips/start', driverController.startTrip);
router.post('/trips/complete', driverController.completeTrip);
router.get('/trips', driverController.getMyTrips);
router.get('/trips/:tripId', driverController.getTripById);

// Complaint routes
router.get('/complaints', driverController.getMyComplaints);

// Wallet routes
router.get('/wallet', driverController.getMyWallet);

// Location routes
router.post('/location', driverController.updateLocation);

export default router;
