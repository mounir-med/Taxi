import tripService from '../services/trip.service.js';
import complaintService from '../services/complaint.service.js';
import { userAuth } from '../middleware/auth.js';
import neo4jDriver from '../config/neo4j.js';

class UserController {
  // Get available trips with filtering
  async getAvailableTrips(req, res) {
    try {
      const {
        minPrice,
        maxPrice,
        vehicleType,
        minRating,
        maxDistance,
        departureAfter,
        departureBefore,
        availableSeats
      } = req.query;

      const session = neo4jDriver.session();
      try {
        let query = `
          MATCH (d:Driver {status: 'ACTIVE'})-[:PROPOSES]->(t:Trip)
          WHERE t.status = 'AVAILABLE' 
            AND t.expiresAt > datetime()
        `;
        
        const params = {};

        // Add filters
        if (minPrice) {
          query += ` AND t.proposedPrice >= $minPrice`;
          params.minPrice = parseFloat(minPrice);
        }
        
        if (maxPrice) {
          query += ` AND t.proposedPrice <= $maxPrice`;
          params.maxPrice = parseFloat(maxPrice);
        }
        
        if (vehicleType) {
          query += ` AND t.vehicleType = $vehicleType`;
          params.vehicleType = vehicleType;
        }
        
        if (minRating) {
          query += ` AND COALESCE(d.driverRating, 0) >= $minRating`;
          params.minRating = parseFloat(minRating);
        }
        
        if (maxDistance) {
          query += ` AND t.distance <= $maxDistance`;
          params.maxDistance = parseFloat(maxDistance);
        }
        
        if (departureAfter) {
          query += ` AND t.departureTime >= datetime($departureAfter)`;
          params.departureAfter = departureAfter;
        }
        
        if (departureBefore) {
          query += ` AND t.departureTime <= datetime($departureBefore)`;
          params.departureBefore = departureBefore;
        }
        
        if (availableSeats) {
          query += ` AND t.availableSeats >= $availableSeats`;
          params.availableSeats = parseInt(availableSeats);
        }

        query += `
          RETURN t, d
          ORDER BY t.departureTime ASC
          LIMIT 50
        `;

        const result = await session.run(query, params);

        const trips = result.records.map(record => {
          const trip = record.get('t').properties;
          const driver = record.get('d').properties;
          return {
            ...trip,
            driver: { ...driver, password: undefined }
          };
        });

        res.json(trips);
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Accept a trip
  async acceptTrip(req, res) {
    try {
      const { tripId } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        // Check if trip is available and not expired
        const availabilityResult = await session.run(`
          MATCH (t:Trip {id: $tripId})
          WHERE t.status = 'AVAILABLE' AND t.expiresAt > datetime()
          RETURN t
        `, { tripId });

        if (availabilityResult.records.length === 0) {
          return res.status(404).json({ error: 'Trip not available or expired' });
        }

        // Accept the trip
        const result = await session.run(`
          MATCH (u:User {id: $userId}), (t:Trip {id: $tripId})
          WHERE t.status = 'AVAILABLE'
          SET t.status = 'ACCEPTED',
              t.acceptedAt = datetime()
          CREATE (u)-[:ACCEPTS]->(t)
          RETURN t, u
        `, { userId: req.user.id, tripId });

        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Failed to accept trip' });
        }

        const trip = result.records[0].get('t').properties;
        const user = result.records[0].get('u').properties;

        res.json({
          ...trip,
          user: { ...user, password: undefined }
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // File a complaint
  async fileComplaint(req, res) {
    try {
      const { driverId, tripId, message } = req.body;

      if (!driverId || !tripId || !message) {
        return res.status(400).json({ 
          error: 'All complaint fields are required: driverId, tripId, message' 
        });
      }

      const result = await complaintService.fileComplaint(req.user.id, {
        driverId,
        tripId,
        message
      });

      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's accepted trips
  async getMyTrips(req, res) {
    try {
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (u:User {id: $userId})-[:ACCEPTS]->(t:Trip)
          OPTIONAL MATCH (t)<-[:PROPOSES]-(d:Driver)
          RETURN t, d
          ORDER BY t.acceptedAt DESC
        `, { userId: req.user.id });

        const trips = result.records.map(record => {
          const trip = record.get('t').properties;
          const driver = record.get('d');
          return {
            ...trip,
            driver: driver ? { ...driver.properties, password: undefined } : null
          };
        });

        res.json(trips);
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's complaints
  async getMyComplaints(req, res) {
    try {
      const complaints = await complaintService.getUserComplaints(req.user.id);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get available drivers
  async getAvailableDrivers(req, res) {
    try {
      const drivers = await tripService.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get trip by ID (user's own accepted trips only)
  async getTripById(req, res) {
    try {
      const { tripId } = req.params;
      
      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (u:User {id: $userId})-[:ACCEPTS]->(t:Trip {id: $tripId})
          OPTIONAL MATCH (t)<-[:PROPOSES]-(d:Driver)
          RETURN t, d
        `, { userId: req.user.id, tripId });

        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Trip not found or access denied' });
        }

        const record = result.records[0];
        const trip = record.get('t').properties;
        const driver = record.get('d');

        res.json({
          ...trip,
          driver: driver ? { ...driver.properties, password: undefined } : null
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();
