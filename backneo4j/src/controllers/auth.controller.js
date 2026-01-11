import authService from '../services/auth.service.js';

class AuthController {
  // User registration
  async registerUser(req, res) {
    try {
      const { email, password, name, phone } = req.body;
      
      if (!email || !password || !name || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const result = await authService.registerUser({ email, password, name, phone });
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'User already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Driver registration
  async registerDriver(req, res) {
    try {
      const { email, password, name, phone, licenseNumber, vehicleInfo } = req.body;
      
      if (!email || !password || !name || !phone || !licenseNumber || !vehicleInfo) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const result = await authService.registerDriver({ 
        email, password, name, phone, licenseNumber, vehicleInfo 
      });
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Driver already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Admin registration
  async registerAdmin(req, res) {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const result = await authService.registerAdmin({ email, password, name });
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Admin already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // User login
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.loginUser(email, password);
      res.json(result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid password')) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Driver login
  async loginDriver(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.loginDriver(email, password);
      res.json(result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid password')) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (error.message.includes('banned')) {
        return res.status(403).json({ error: 'Driver account is banned' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Admin login
  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.loginAdmin(email, password);
      res.json(result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid password')) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get current user profile
  async getUserProfile(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get current driver profile
  async getDriverProfile(req, res) {
    try {
      const driver = await authService.getDriverById(req.user.id);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get current admin profile
  async getAdminProfile(req, res) {
    try {
      const admin = await authService.getAdminById(req.user.id);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      res.json(admin);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Logout methods (JWT stateless - just return success)
  async logoutUser(req, res) {
    try {
      // With JWT, logout is handled client-side by removing the token
      // We can add blacklisting here if needed
      res.json({ message: 'User logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async logoutDriver(req, res) {
    try {
      // With JWT, logout is handled client-side by removing the token
      res.json({ message: 'Driver logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async logoutAdmin(req, res) {
    try {
      // With JWT, logout is handled client-side by removing the token
      res.json({ message: 'Admin logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AuthController();
