import driver from '../config/neo4j.js';
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js';

class AuthService {
  // User registration
  async registerUser(userData) {
    const session = driver.session();
    try {
      const { email, password, name, phone } = userData;
      const hashedPassword = await hashPassword(password);
      
      const result = await session.run(
        `CREATE (u:User {
          id: randomUUID(),
          email: $email,
          password: $password,
          name: $name,
          phone: $phone,
          role: 'USER',
          createdAt: datetime(),
          updatedAt: datetime()
        }) RETURN u`,
        { email, password: hashedPassword, name, phone }
      );
      
      const user = result.records[0].get('u').properties;
      const token = generateToken(user.id, 'USER');
      
      return { token, user: { ...user, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // Driver registration
  async registerDriver(driverData) {
    const session = driver.session();
    try {
      const { email, password, name, phone, licenseNumber, vehicleInfo } = driverData;
      const hashedPassword = await hashPassword(password);
      
      const result = await session.run(
        `CREATE (d:Driver {
          id: randomUUID(),
          email: $email,
          password: $password,
          name: $name,
          phone: $phone,
          role: 'DRIVER',
          status: 'ACTIVE',
          licenseNumber: $licenseNumber,
          vehicleInfo: $vehicleInfo,
          createdAt: datetime(),
          updatedAt: datetime()
        }) 
        WITH d
        CREATE (d)-[:OWNS]->(w:Wallet {
          id: randomUUID(),
          balance: 0.0,
          totalEarned: 0.0,
          totalTvaCollected: 0.0,
          updatedAt: datetime()
        })
        RETURN d`,
        { email, password: hashedPassword, name, phone, licenseNumber, vehicleInfo }
      );
      
      const driver = result.records[0].get('d').properties;
      const token = generateToken(driver.id, 'DRIVER');
      
      return { token, driver: { ...driver, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // Admin registration
  async registerAdmin(adminData) {
    const session = driver.session();
    try {
      const { email, password, name } = adminData;
      const hashedPassword = await hashPassword(password);
      
      const result = await session.run(
        `CREATE (a:Admin {
          id: randomUUID(),
          email: $email,
          password: $password,
          name: $name,
          role: 'ADMIN',
          createdAt: datetime(),
          updatedAt: datetime()
        })
        WITH a
        CREATE (a)-[:COLLECTS]->(w:Wallet {
          id: randomUUID(),
          balance: 0.0,
          totalEarned: 0.0,
          totalTvaCollected: 0.0,
          updatedAt: datetime()
        })
        RETURN a`,
        { email, password: hashedPassword, name }
      );
      
      const admin = result.records[0].get('a').properties;
      const token = generateToken(admin.id, 'ADMIN');
      
      return { token, admin: { ...admin, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // User login
  async loginUser(email, password) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );
      
      if (result.records.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.records[0].get('u').properties;
      const isValidPassword = await comparePassword(password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      const token = generateToken(user.id, 'USER');
      return { token, user: { ...user, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // Driver login
  async loginDriver(email, password) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (d:Driver {email: $email}) RETURN d',
        { email }
      );
      
      if (result.records.length === 0) {
        throw new Error('Driver not found');
      }
      
      const driver = result.records[0].get('d').properties;
      const isValidPassword = await comparePassword(password, driver.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      if (driver.status === 'BANNED') {
        throw new Error('Driver account is banned');
      }
      
      const token = generateToken(driver.id, 'DRIVER');
      return { token, driver: { ...driver, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // Admin login
  async loginAdmin(email, password) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Admin {email: $email}) RETURN a',
        { email }
      );
      
      if (result.records.length === 0) {
        throw new Error('Admin not found');
      }
      
      const admin = result.records[0].get('a').properties;
      const isValidPassword = await comparePassword(password, admin.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      const token = generateToken(admin.id, 'ADMIN');
      return { token, admin: { ...admin, password: undefined } };
    } finally {
      await session.close();
    }
  }

  // Get user by ID
  async getUserById(userId) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $userId}) RETURN u',
        { userId }
      );
      
      if (result.records.length === 0) {
        return null;
      }
      
      const user = result.records[0].get('u').properties;
      return { ...user, password: undefined };
    } finally {
      await session.close();
    }
  }

  // Get driver by ID
  async getDriverById(driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (d:Driver {id: $driverId}) RETURN d',
        { driverId }
      );
      
      if (result.records.length === 0) {
        return null;
      }
      
      const driver = result.records[0].get('d').properties;
      return { ...driver, password: undefined };
    } finally {
      await session.close();
    }
  }

  // Get admin by ID
  async getAdminById(adminId) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Admin {id: $adminId}) RETURN a',
        { adminId }
      );
      
      if (result.records.length === 0) {
        return null;
      }
      
      const admin = result.records[0].get('a').properties;
      return { ...admin, password: undefined };
    } finally {
      await session.close();
    }
  }
}

export default new AuthService();
