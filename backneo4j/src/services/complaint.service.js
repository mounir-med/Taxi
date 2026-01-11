import driver from '../config/neo4j.js';

class ComplaintService {
  // File a complaint
  async fileComplaint(userId, complaintData) {
    const session = driver.session();
    try {
      const { driverId, tripId, message } = complaintData;

      // Verify trip exists and belongs to user
      const tripResult = await session.run(
        `MATCH (u:User {id: $userId})-[:ACCEPTS]->(t:Trip {id: $tripId})
         RETURN t`,
        { userId, tripId }
      );

      if (tripResult.records.length === 0) {
        throw new Error('Trip not found or does not belong to user');
      }

      // Verify driver exists and is assigned to trip
      const driverResult = await session.run(
        `MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
         RETURN d`,
        { driverId, tripId }
      );

      if (driverResult.records.length === 0) {
        throw new Error('Driver not found or not assigned to this trip');
      }

      // Create complaint
      const result = await session.run(
        `MATCH (u:User {id: $userId}), (d:Driver {id: $driverId}), (t:Trip {id: $tripId})
         CREATE (c:Complaint {
           id: randomUUID(),
           message: $message,
           status: 'PENDING',
           createdAt: datetime(),
           updatedAt: datetime()
         })
         CREATE (u)-[:FILED]->(c)
         CREATE (c)-[:AGAINST]->(d)
         CREATE (c)-[:ABOUT]->(t)
         RETURN c`,
        { userId, driverId, tripId, message }
      );

      const complaint = result.records[0].get('c').properties;

      // Check if driver should be automatically penalized
      await this.checkDriverPenalty(driverId);

      return complaint;
    } finally {
      await session.close();
    }
  }

  // Check driver penalty based on complaints
  async checkDriverPenalty(driverId) {
    const session = driver.session();
    try {
      // Count total complaints against driver
      const complaintCountResult = await session.run(
        `MATCH (d:Driver {id: $driverId})<-[:AGAINST]-(c:Complaint)
         RETURN count(c) as complaintCount`,
        { driverId }
      );

      const complaintCount = complaintCountResult.records[0].get('complaintCount').toNumber();
      let newStatus = null;
      let pauseUntil = null;

      // Apply penalty rules
      if (complaintCount >= 7) {
        newStatus = 'BANNED';
      } else if (complaintCount >= 3) {
        newStatus = 'PAUSED';
        // Pause for 3 days
        pauseUntil = new Date();
        pauseUntil.setDate(pauseUntil.getDate() + 3);
      }

      if (newStatus) {
        await session.run(
          `MATCH (d:Driver {id: $driverId})
           SET d.status = $status,
               d.updatedAt = datetime()`,
          { driverId, status: newStatus }
        );

        return { newStatus, pauseUntil };
      }

      return null;
    } finally {
      await session.close();
    }
  }

  // Get user complaints
  async getUserComplaints(userId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:FILED]->(c:Complaint)
         OPTIONAL MATCH (c)-[:AGAINST]->(d:Driver)
         OPTIONAL MATCH (c)-[:ABOUT]->(t:Trip)
         RETURN c, d, t`,
        { userId }
      );

      return result.records.map(record => {
        const complaint = record.get('c').properties;
        const driver = record.get('d');
        const trip = record.get('t');
        
        return {
          ...complaint,
          driver: driver ? { ...driver.properties, password: undefined } : null,
          trip: trip ? trip.properties : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Get driver complaints
  async getDriverComplaints(driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})<-[:AGAINST]-(c:Complaint)
         OPTIONAL MATCH (c)<-[:FILED]-(u:User)
         OPTIONAL MATCH (c)-[:ABOUT]->(t:Trip)
         RETURN c, u, t`,
        { driverId }
      );

      return result.records.map(record => {
        const complaint = record.get('c').properties;
        const user = record.get('u');
        const trip = record.get('t');
        
        return {
          ...complaint,
          user: user ? { ...user.properties, password: undefined } : null,
          trip: trip ? trip.properties : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Get all complaints (admin)
  async getAllComplaints() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Complaint)
         OPTIONAL MATCH (c)<-[:FILED]-(u:User)
         OPTIONAL MATCH (c)-[:AGAINST]->(d:Driver)
         OPTIONAL MATCH (c)-[:ABOUT]->(t:Trip)
         RETURN c, u, d, t
         ORDER BY c.createdAt DESC`,
        {}
      );

      return result.records.map(record => {
        const complaint = record.get('c').properties;
        const user = record.get('u');
        const driver = record.get('d');
        const trip = record.get('t');
        
        return {
          ...complaint,
          user: user ? { ...user.properties, password: undefined } : null,
          driver: driver ? { ...driver.properties, password: undefined } : null,
          trip: trip ? trip.properties : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Process complaint (admin)
  async processComplaint(complaintId, action) {
    const session = driver.session();
    try {
      const validActions = ['RESOLVE', 'REJECT', 'ESCALATE'];
      if (!validActions.includes(action)) {
        throw new Error('Invalid action. Must be: RESOLVE, REJECT, or ESCALATE');
      }

      const result = await session.run(
        `MATCH (c:Complaint {id: $complaintId})
         SET c.status = $action,
             c.updatedAt = datetime()
         RETURN c`,
        { complaintId, action }
      );

      if (result.records.length === 0) {
        throw new Error('Complaint not found');
      }

      return result.records[0].get('c').properties;
    } finally {
      await session.close();
    }
  }

  // Get complaint statistics
  async getComplaintStats() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Complaint)
         OPTIONAL MATCH (c)-[:AGAINST]->(d:Driver)
         RETURN 
           count(c) as totalComplaints,
           count(CASE WHEN c.status = 'PENDING' THEN 1 END) as pendingComplaints,
           count(CASE WHEN c.status = 'RESOLVE' THEN 1 END) as resolvedComplaints,
           count(CASE WHEN c.status = 'REJECT' THEN 1 END) as rejectedComplaints,
           count(DISTINCT d) as driversWithComplaints`,
        {}
      );

      const stats = result.records[0];
      return {
        totalComplaints: stats.get('totalComplaints').toNumber(),
        pendingComplaints: stats.get('pendingComplaints').toNumber(),
        resolvedComplaints: stats.get('resolvedComplaints').toNumber(),
        rejectedComplaints: stats.get('rejectedComplaints').toNumber(),
        driversWithComplaints: stats.get('driversWithComplaints').toNumber()
      };
    } finally {
      await session.close();
    }
  }
}

export default new ComplaintService();
