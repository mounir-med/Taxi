import driver from '../config/neo4j.js';

class AdminService {
  // Create a new driver
  async createDriver(driverData) {
    const session = driver.session();
    try {
      const { email, password, name, phone, licenseNumber, vehicleInfo, status = 'ACTIVE' } = driverData;
      
      // Hash password using bcrypt
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await session.run(
        `CREATE (d:Driver {
          id: randomUUID(),
          email: $email,
          password: $password,
          name: $name,
          phone: $phone,
          role: 'DRIVER',
          status: $status,
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
        { email, password: hashedPassword, name, phone, status, licenseNumber, vehicleInfo }
      );
      
      const driver = result.records[0].get('d').properties;
      return { ...driver, password: undefined };
    } finally {
      await session.close();
    }
  }

  // Get all drivers
  async getAllDrivers() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver)
         OPTIONAL MATCH (d)-[:OWNS]->(w:Wallet)
         OPTIONAL MATCH (d)<-[:AGAINST]-(c:Complaint)
         RETURN d, w, count(c) as complaintCount
         ORDER BY d.createdAt DESC`,
        {}
      );

      return result.records.map(record => {
        const driver = record.get('d').properties;
        const wallet = record.get('w');
        const complaintCount = record.get('complaintCount').toNumber();
        
        return {
          ...driver,
          password: undefined,
          wallet: wallet ? wallet.properties : null,
          complaintCount
        };
      });
    } finally {
      await session.close();
    }
  }

  // Update driver status
  async updateDriverStatus(driverId, status) {
    const session = driver.session();
    try {
      const validStatuses = ['ACTIVE', 'PAUSED', 'BANNED'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be: ACTIVE, PAUSED, or BANNED');
      }

      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})
         SET d.status = $status,
             d.updatedAt = datetime()
         RETURN d`,
        { driverId, status }
      );

      if (result.records.length === 0) {
        throw new Error('Driver not found');
      }

      const driver = result.records[0].get('d').properties;
      return { ...driver, password: undefined };
    } finally {
      await session.close();
    }
  }

  // Ban driver
  async banDriver(driverId) {
    return await this.updateDriverStatus(driverId, 'BANNED');
  }

  // Pause driver for specified days
  async pauseDriver(driverId, days) {
    const session = driver.session();
    try {
      if (days <= 0) {
        throw new Error('Days must be a positive number');
      }

      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})
         SET d.status = 'PAUSED',
             d.pausedUntil = datetime() + duration({days: $days}),
             d.updatedAt = datetime()
         RETURN d`,
        { driverId, days }
      );

      if (result.records.length === 0) {
        throw new Error('Driver not found');
      }

      const driver = result.records[0].get('d').properties;
      return { ...driver, password: undefined };
    } finally {
      await session.close();
    }
  }

  // Get all trips
  async getAllTrips() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (t:Trip)
         OPTIONAL MATCH (t)<-[:BOOKED]-(u:User)
         OPTIONAL MATCH (t)<-[:ASSIGNED_TO]-(d:Driver)
         RETURN t, u, d
         ORDER BY t.requestedAt DESC`,
        {}
      );

      return result.records.map(record => {
        const trip = record.get('t').properties;
        const user = record.get('u');
        const driver = record.get('d');
        
        return {
          ...trip,
          user: user ? { ...user.properties, password: undefined } : null,
          driver: driver ? { ...driver.properties, password: undefined } : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Get admin statistics
  async getAdminStats() {
    const session = driver.session();
    try {
      // Basic counts
      const basicStatsResult = await session.run(
        `MATCH (d:Driver)
         OPTIONAL MATCH (t:Trip)
         OPTIONAL MATCH (c:Complaint)
         OPTIONAL MATCH (u:User)
         OPTIONAL MATCH (a:Admin)-[:COLLECTS]->(w:Wallet)
         RETURN 
           count(DISTINCT d) as totalDrivers,
           count(DISTINCT CASE WHEN d.status = 'ACTIVE' THEN d END) as activeDrivers,
           count(DISTINCT CASE WHEN d.status = 'PAUSED' THEN d END) as pausedDrivers,
           count(DISTINCT CASE WHEN d.status = 'BANNED' THEN d END) as bannedDrivers,
           count(DISTINCT t) as totalTrips,
           count(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t END) as completedTrips,
           count(DISTINCT CASE WHEN t.status = 'IN_PROGRESS' THEN t END) as inProgressTrips,
           count(DISTINCT CASE WHEN t.status = 'CANCELLED' THEN t END) as cancelledTrips,
           count(DISTINCT CASE WHEN t.status = 'PENDING' THEN t END) as pendingTrips,
           count(DISTINCT c) as totalComplaints,
           count(DISTINCT CASE WHEN c.status = 'PENDING' THEN c END) as pendingComplaints,
           count(DISTINCT CASE WHEN c.status = 'RESOLVE' THEN c END) as resolvedComplaints,
           count(DISTINCT CASE WHEN c.status = 'REJECT' THEN c END) as rejectedComplaints,
           count(DISTINCT u) as totalUsers,
           COALESCE(w.totalTvaCollected, 0.0) as totalTvaCollected`,
        {}
      );

      const stats = basicStatsResult.records[0];
      
      // Revenue calculations
      const revenueResult = await session.run(
        `MATCH (t:Trip {status: 'COMPLETED'})
         RETURN 
           sum(t.finalPrice) as totalRevenue,
           sum(t.price) as baseRevenue,
           sum(t.finalPrice - t.price) as commissionRevenue`,
        {}
      );

      const revenue = revenueResult.records[0];
      const totalRevenue = revenue.get('totalRevenue')?.toNumber() || 0;
      const baseRevenue = revenue.get('baseRevenue')?.toNumber() || 0;
      const commissionRevenue = revenue.get('commissionRevenue')?.toNumber() || 0;

      // Monthly trends (last 6 months)
      const monthlyTrendsResult = await session.run(
        `MATCH (t:Trip {status: 'COMPLETED'})
         WHERE t.completedAt >= datetime() - duration({months: 6})
         WITH 
           date({year: date(t.completedAt).year, month: date(t.completedAt).month}) as month,
           count(t) as tripsCount,
           sum(t.finalPrice) as monthlyRevenue
         RETURN month.toString() as month, tripsCount, monthlyRevenue
         ORDER BY month`,
        {}
      );

      const monthlyTrends = monthlyTrendsResult.records.map(record => ({
        month: record.get('month'),
        tripsCount: record.get('tripsCount').toNumber(),
        monthlyRevenue: Math.round(record.get('monthlyRevenue').toNumber() * 100) / 100
      }));

      // Top drivers by performance
      const topDriversResult = await session.run(
        `MATCH (d:Driver)-[:ASSIGNED_TO]->(t:Trip {status: 'COMPLETED'})
         OPTIONAL MATCH (d)<-[:AGAINST]-(c:Complaint)
         RETURN 
           d.id as driverId,
           d.name as driverName,
           count(t) as completedTrips,
           sum(t.finalPrice) as totalEarned,
           count(c) as complaintCount
         ORDER BY completedTrips DESC
         LIMIT 5`,
        {}
      );

      const topDrivers = topDriversResult.records.map(record => ({
        driverId: record.get('driverId'),
        driverName: record.get('driverName'),
        completedTrips: record.get('completedTrips').toNumber(),
        totalEarned: Math.round(record.get('totalEarned').toNumber() * 100) / 100,
        complaintCount: record.get('complaintCount').toNumber()
      }));

      // Recent activity
      const recentActivityResult = await session.run(
        `MATCH (activity)
         WHERE activity.createdAt >= datetime() - duration({days: 7})
         CALL {
           WITH activity
           MATCH (t:Trip) WHERE id(t) = id(activity)
           RETURN 'trip' as type, t.status as status, t.createdAt as createdAt, t.id as id
         }
         CALL {
           WITH activity
           MATCH (c:Complaint) WHERE id(c) = id(activity)
           RETURN 'complaint' as type, c.status as status, c.createdAt as createdAt, c.id as id
         }
         RETURN type, status, createdAt, id
         ORDER BY createdAt DESC
         LIMIT 10`,
        {}
      );

      const recentActivity = recentActivityResult.records.map(record => ({
        type: record.get('type'),
        status: record.get('status'),
        createdAt: record.get('createdAt'),
        id: record.get('id')
      }));

      return {
        // Overview stats
        overview: {
          totalDrivers: stats.get('totalDrivers').toNumber(),
          activeDrivers: stats.get('activeDrivers').toNumber(),
          pausedDrivers: stats.get('pausedDrivers').toNumber(),
          bannedDrivers: stats.get('bannedDrivers').toNumber(),
          totalUsers: stats.get('totalUsers').toNumber(),
          totalTrips: stats.get('totalTrips').toNumber()
        },
        
        // Trip stats
        trips: {
          total: stats.get('totalTrips').toNumber(),
          completed: stats.get('completedTrips').toNumber(),
          inProgress: stats.get('inProgressTrips').toNumber(),
          cancelled: stats.get('cancelledTrips').toNumber(),
          pending: stats.get('pendingTrips').toNumber(),
          completionRate: stats.get('totalTrips').toNumber() > 0 
            ? Math.round((stats.get('completedTrips').toNumber() / stats.get('totalTrips').toNumber()) * 100)
            : 0
        },
        
        // Complaint stats
        complaints: {
          total: stats.get('totalComplaints').toNumber(),
          pending: stats.get('pendingComplaints').toNumber(),
          resolved: stats.get('resolvedComplaints').toNumber(),
          rejected: stats.get('rejectedComplaints').toNumber(),
          resolutionRate: stats.get('totalComplaints').toNumber() > 0
            ? Math.round((stats.get('resolvedComplaints').toNumber() / stats.get('totalComplaints').toNumber()) * 100)
            : 0
        },
        
        // Financial stats
        financial: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          baseRevenue: Math.round(baseRevenue * 100) / 100,
          commissionRevenue: Math.round(commissionRevenue * 100) / 100,
          totalTvaCollected: Math.round(stats.get('totalTvaCollected').toNumber() * 100) / 100
        },
        
        // Analytics
        monthlyTrends,
        topDrivers,
        recentActivity
      };
    } finally {
      await session.close();
    }
  }

  // Get driver by ID
  async getDriverById(driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})
         OPTIONAL MATCH (d)-[:OWNS]->(w:Wallet)
         OPTIONAL MATCH (d)<-[:AGAINST]-(c:Complaint)
         OPTIONAL MATCH (d)-[:ASSIGNED_TO]->(t:Trip)
         RETURN d, w, collect(DISTINCT c) as complaints, collect(DISTINCT t) as trips`,
        { driverId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const driver = record.get('d').properties;
      const wallet = record.get('w');
      const complaints = record.get('complaints');
      const trips = record.get('trips');

      return {
        ...driver,
        password: undefined,
        wallet: wallet ? wallet.properties : null,
        complaints: complaints.map(c => c.properties),
        trips: trips.map(t => t.properties),
        complaintCount: complaints.length,
        tripCount: trips.length
      };
    } finally {
      await session.close();
    }
  }

  // Get driver wallet
  async getDriverWallet(driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})-[:OWNS]->(w:Wallet)
         RETURN w`,
        { driverId }
      );

      if (result.records.length === 0) {
        throw new Error('Driver wallet not found');
      }

      return result.records[0].get('w').properties;
    } finally {
      await session.close();
    }
  }

  // Get admin statistics
  async getAdminStats() {
    const session = driver.session();
    try {
      // Get all statistics in one query
      const result = await session.run(`
        MATCH (u:User)
        OPTIONAL MATCH (d:Driver)
        OPTIONAL MATCH (t:Trip)
        OPTIONAL MATCH (d:Driver)-[:HAS_TRIP]->(t:Trip)
        OPTIONAL MATCH (c:Complaint)
        OPTIONAL MATCH (c:Complaint {status: 'PENDING'})
        OPTIONAL MATCH (d:Driver {status: 'ACTIVE'})
        RETURN 
          count(DISTINCT u) as totalUsers,
          count(DISTINCT d) as totalDrivers,
          count(DISTINCT t) as totalTrips,
          count(DISTINCT d) as activeDrivers,
          count(DISTINCT c) as pendingComplaints,
          COALESCE(SUM(t.price), 0) as totalRevenue
      `);

      if (result.records.length === 0) {
        return {
          totalUsers: 0,
          totalDrivers: 0,
          totalTrips: 0,
          totalRevenue: 0,
          activeDrivers: 0,
          pendingComplaints: 0,
        };
      }

      const record = result.records[0];
      return {
        totalUsers: record.get('totalUsers')?.toNumber() || 0,
        totalDrivers: record.get('totalDrivers')?.toNumber() || 0,
        totalTrips: record.get('totalTrips')?.toNumber() || 0,
        totalRevenue: record.get('totalRevenue')?.toNumber() || 0,
        activeDrivers: record.get('activeDrivers')?.toNumber() || 0,
        pendingComplaints: record.get('pendingComplaints')?.toNumber() || 0,
      };
    } finally {
      await session.close();
    }
  }

  // Get admin wallet
  async getAdminWallet() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (a:Admin)-[:COLLECTS]->(w:Wallet)
         RETURN w`,
        {}
      );

      if (result.records.length === 0) {
        throw new Error('Admin wallet not found');
      }

      return result.records[0].get('w').properties;
    } finally {
      await session.close();
    }
  }
}

export default new AdminService();
