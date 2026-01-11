import tripService from '../services/trip.service.js';
import complaintService from '../services/complaint.service.js';
import adminService from '../services/admin.service.js';
import { driverAuth } from '../middleware/auth.js';

import neo4jDriver from '../config/neo4j.js';

class DriverController {
  // Create a trip proposal
  async createTrip(req, res) {
    try {
      const {
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        destinationAddress,
        destinationLatitude,
        destinationLongitude,
        proposedPrice,
        departureTime,
        estimatedDuration,
        availableSeats = 4,
        vehicleType,
        expiresAt
      } = req.body;

      // Validation
      if (!pickupAddress || !pickupLatitude || !pickupLongitude ||
          !destinationAddress || !destinationLatitude || !destinationLongitude ||
          !proposedPrice || !departureTime || !estimatedDuration || !vehicleType || !expiresAt) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      const session = neo4jDriver.session();
      try {
        // Calculate distance
        const pLat = Number(pickupLatitude);
        const pLng = Number(pickupLongitude);
        const dLat = Number(destinationLatitude);
        const dLng = Number(destinationLongitude);

        const distance = tripService.calculateDistance(pLat, pLng, dLat, dLng);

        // Create trip proposal
        const result = await session.run(`
          MATCH (d:Driver {id: $driverId})
          CREATE (t:Trip {
            id: randomUUID(),
            status: 'AVAILABLE',
            pickupAddress: $pickupAddress,
            pickupLatitude: $pickupLatitude,
            pickupLongitude: $pickupLongitude,
            destinationAddress: $destinationAddress,
            destinationLatitude: $destinationLatitude,
            destinationLongitude: $destinationLongitude,
            distance: $distance,
            proposedPrice: $proposedPrice,
            departureTime: datetime($departureTime),
            estimatedDuration: $estimatedDuration,
            availableSeats: $availableSeats,
            vehicleType: $vehicleType,
            expiresAt: datetime($expiresAt),
            createdAt: datetime()
          })
          CREATE (d)-[:PROPOSES]->(t)
          RETURN t
        `, {
          driverId: req.user.id,
          pickupAddress,
          pickupLatitude: pLat,
          pickupLongitude: pLng,
          destinationAddress,
          destinationLatitude: dLat,
          destinationLongitude: dLng,
          distance,
          proposedPrice,
          departureTime: new Date(departureTime).toISOString(),
          estimatedDuration,
          availableSeats,
          vehicleType,
          expiresAt: new Date(expiresAt).toISOString()
        });

        const trip = result.records[0].get('t').properties;
        res.status(201).json(trip);
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Cancel a trip proposal
  async cancelTrip(req, res) {
    try {
      const { tripId } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
          WHERE t.status = 'AVAILABLE'
          SET t.status = 'CANCELLED'
          RETURN t
        `, { driverId: req.user.id, tripId });

        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Trip not found or cannot be cancelled' });
        }

        const trip = result.records[0].get('t').properties;
        res.json(trip);
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Calculate distance helper
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  // Start a trip (after user accepted)
  async startTrip(req, res) {
    try {
      const { tripId } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
          WHERE t.status = 'ACCEPTED'
          SET t.status = 'STARTED',
              t.startedAt = datetime()
          RETURN t
        `, { driverId: req.user.id, tripId });

        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Trip not found or not accepted' });
        }

        const trip = result.records[0].get('t').properties;
        res.json(trip);
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Complete a trip and process payment
  async completeTrip(req, res) {
    try {
      const { tripId } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        // Get trip details
        const tripResult = await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
          WHERE t.status = 'STARTED'
          RETURN t
        `, { driverId: req.user.id, tripId });

        if (tripResult.records.length === 0) {
          return res.status(404).json({ error: 'Trip not found or not started' });
        }

        const trip = tripResult.records[0].get('t').properties;
        const finalPrice = trip.proposedPrice;
        const tvaAmount = Math.round(finalPrice * 0.08 * 100) / 100; // 8% TVA
        const driverNetAmount = finalPrice - tvaAmount;

        // Update trip status and amounts
        await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
          SET t.status = 'COMPLETED',
              t.completedAt = datetime(),
              t.finalPrice = $finalPrice,
              t.tvaAmount = $tvaAmount,
              t.driverNetAmount = $driverNetAmount
        `, { driverId: req.user.id, tripId, finalPrice, tvaAmount, driverNetAmount });

        // Update driver wallet
        await session.run(`
          MATCH (d:Driver {id: $driverId})-[:OWNS]->(w:Wallet)
          SET w.balance = w.balance + $driverNetAmount,
              w.totalEarned = w.totalEarned + $driverNetAmount,
              w.updatedAt = datetime()
        `, { driverId: req.user.id, driverNetAmount });

        // Update admin wallet (TVA collection)
        await session.run(`
          MATCH (a:Admin)-[:COLLECTS]->(w:Wallet)
          SET w.balance = w.balance + $tvaAmount,
              w.totalTvaCollected = w.totalTvaCollected + $tvaAmount,
              w.updatedAt = datetime()
        `, { tvaAmount });

        res.json({
          ...trip,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          finalPrice,
          tvaAmount,
          driverNetAmount
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get driver's proposed trips
  async getMyTrips(req, res) {
    try {
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip)
          OPTIONAL MATCH (t)<-[:ACCEPTS]-(u:User)
          RETURN t, u
          ORDER BY t.createdAt DESC
        `, { driverId: req.user.id });

        const trips = result.records.map(record => {
          const trip = record.get('t').properties;
          const user = record.get('u');
          return {
            ...trip,
            user: user ? { ...user.properties, password: undefined } : null
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

  // Get driver's complaints
  async getMyComplaints(req, res) {
    try {
      const complaints = await complaintService.getDriverComplaints(req.user.id);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get driver's wallet
  async getMyWallet(req, res) {
    try {
      const wallet = await adminService.getDriverWallet(req.user.id);
      res.json(wallet);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Update driver location
  async updateLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      // This would typically update the driver's current location
      // For now, we'll just return success
      res.json({ 
        message: 'Location updated successfully',
        latitude, 
        longitude 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get trip by ID (driver's own trips only)
  async getTripById(req, res) {
    try {
      const { tripId } = req.params;
      
      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
          MATCH (d:Driver {id: $driverId})-[:PROPOSES]->(t:Trip {id: $tripId})
          OPTIONAL MATCH (t)<-[:ACCEPTS]-(u:User)
          RETURN t, u
        `, { driverId: req.user.id, tripId });

        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Trip not found' });
        }

        const record = result.records[0];
        const trip = record.get('t').properties;
        const user = record.get('u');

        res.json({
          ...trip,
          user: user ? { ...user.properties, password: undefined } : null
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DriverController();
