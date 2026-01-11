import adminService from '../services/admin.service.js';
import complaintService from '../services/complaint.service.js';
import { adminAuth } from '../middleware/auth.js';

class AdminController {
  // Create a new driver
  async createDriver(req, res) {
    try {
      const { email, password, name, phone, licenseNumber, vehicleInfo, status } = req.body;

      if (!email || !password || !name || !phone || !licenseNumber || !vehicleInfo) {
        return res.status(400).json({ 
          error: 'All driver fields are required: email, password, name, phone, licenseNumber, vehicleInfo' 
        });
      }

      const driver = await adminService.createDriver({ 
        email, password, name, phone, licenseNumber, vehicleInfo, status 
      });
      res.status(201).json(driver);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Driver already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get all drivers
  async getAllDrivers(req, res) {
    try {
      const drivers = await adminService.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update driver status
  async updateDriverStatus(req, res) {
    try {
      const { driverId } = req.params;
      const { status } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const driver = await adminService.updateDriverStatus(driverId, status);
      res.json(driver);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      if (error.message.includes('Invalid status')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Ban driver
  async banDriver(req, res) {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      const driver = await adminService.banDriver(driverId);
      res.json(driver);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Pause driver
  async pauseDriver(req, res) {
    try {
      const { driverId } = req.params;
      const { days } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      if (!days || days <= 0) {
        return res.status(400).json({ error: 'Days must be a positive number' });
      }

      const driver = await adminService.pauseDriver(driverId, days);
      res.json(driver);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      if (error.message.includes('positive number')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get all trips
  async getAllTrips(req, res) {
    try {
      const trips = await adminService.getAllTrips();
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all complaints
  async getAllComplaints(req, res) {
    try {
      const complaints = await complaintService.getAllComplaints();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Process complaint
  async processComplaint(req, res) {
    try {
      const { complaintId } = req.params;
      const { action } = req.body;

      if (!complaintId) {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      const complaint = await complaintService.processComplaint(complaintId, action);
      res.json(complaint);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      if (error.message.includes('Invalid action')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get admin statistics
  async getAdminStats(req, res) {
    try {
      const stats = await adminService.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get driver by ID
  async getDriverById(req, res) {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      const driver = await adminService.getDriverById(driverId);
      
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get admin wallet
  async getAdminWallet(req, res) {
    try {
      const wallet = await adminService.getAdminWallet();
      res.json(wallet);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Admin wallet not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get complaint statistics
  async getComplaintStats(req, res) {
    try {
      const stats = await complaintService.getComplaintStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();
