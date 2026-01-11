import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import driver from '../config/neo4j.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user from database
    const session = driver.session();
    let user = null;
    
    try {
      if (decoded.role === 'USER') {
        const result = await session.run(
          'MATCH (u:User {id: $userId}) RETURN u',
          { userId: decoded.userId }
        );
        if (result.records.length > 0) {
          user = result.records[0].get('u').properties;
          user.role = 'USER';
        }
      } else if (decoded.role === 'DRIVER') {
        const result = await session.run(
          'MATCH (d:Driver {id: $userId}) RETURN d',
          { userId: decoded.userId }
        );
        if (result.records.length > 0) {
          user = result.records[0].get('d').properties;
          user.role = 'DRIVER';
        }
      } else if (decoded.role === 'ADMIN') {
        const result = await session.run(
          'MATCH (a:Admin {id: $userId}) RETURN a',
          { userId: decoded.userId }
        );
        if (result.records.length > 0) {
          user = result.records[0].get('a').properties;
          user.role = 'ADMIN';
        }
      }
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = user;
      next();
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// User-specific middleware
export const userAuth = [authenticate, authorize('USER')];

// Driver-specific middleware
export const driverAuth = [authenticate, authorize('DRIVER')];

// Admin-specific middleware
export const adminAuth = [authenticate, authorize('ADMIN')];

// Multi-role middleware
export const userDriverAuth = [authenticate, authorize('USER', 'DRIVER')];
export const driverAdminAuth = [authenticate, authorize('DRIVER', 'ADMIN')];
export const allRolesAuth = [authenticate, authorize('USER', 'DRIVER', 'ADMIN')];
