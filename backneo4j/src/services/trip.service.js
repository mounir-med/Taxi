import driver from '../config/neo4j.js';

class TripService {
  // Calculate distance between two points using Haversine formula
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

  // Calculate price (1 km = 3 DH)
  calculatePrice(distance) {
    return Math.round(distance * 3 * 100) / 100; // Round to 2 decimal places
  }

  // Book a trip
  async bookTrip(userId, tripData) {
    const session = driver.session();
    try {
      const {
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        destinationAddress,
        destinationLatitude,
        destinationLongitude,
        requestedAt
      } = tripData;

      // Calculate distance and price
      const distance = this.calculateDistance(
        pickupLatitude, pickupLongitude,
        destinationLatitude, destinationLongitude
      );
      const estimatedPrice = this.calculatePrice(distance);

      // Find available driver
      const driverResult = await session.run(
        `MATCH (d:Driver {status: 'ACTIVE'})
         WHERE NOT EXISTS {
           MATCH (d)-[:ASSIGNED_TO]->(t:Trip)
           WHERE t.status IN ['ASSIGNED', 'STARTED']
         }
         RETURN d
         ORDER BY rand()
         LIMIT 1`,
        {}
      );

      let assignedDriver = null;
      if (driverResult.records.length > 0) {
        assignedDriver = driverResult.records[0].get('d').properties;
      }

      // Create trip
      const result = await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (t:Trip {
           id: randomUUID(),
           status: $driverId ? 'ASSIGNED' : 'PENDING',
           pickupAddress: $pickupAddress,
           pickupLatitude: $pickupLatitude,
           pickupLongitude: $pickupLongitude,
           destinationAddress: $destinationAddress,
           destinationLatitude: $destinationLatitude,
           destinationLongitude: $destinationLongitude,
           distance: $distance,
           estimatedPrice: $estimatedPrice,
           requestedAt: coalesce($requestedAt, datetime())
         })
         CREATE (u)-[:BOOKED]->(t)
         ${assignedDriver ? `
         WITH t
         MATCH (d:Driver {id: $driverId})
         CREATE (d)-[:ASSIGNED_TO]->(t)
         ` : ''}
         RETURN t${assignedDriver ? ', d' : ''}`,
        {
          userId,
          driverId: assignedDriver?.id,
          pickupAddress,
          pickupLatitude,
          pickupLongitude,
          destinationAddress,
          destinationLatitude,
          destinationLongitude,
          distance,
          estimatedPrice,
          requestedAt: requestedAt ? new Date(requestedAt) : null
        }
      );

      const trip = result.records[0].get('t').properties;
      const response = { trip };

      if (assignedDriver) {
        response.driver = { ...assignedDriver, password: undefined };
      }

      return response;
    } finally {
      await session.close();
    }
  }

  // Start a trip
  async startTrip(tripId, driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})-[:ASSIGNED_TO]->(t:Trip {id: $tripId})
         SET t.status = 'STARTED',
             t.startedAt = datetime()
         RETURN t`,
        { driverId, tripId }
      );

      if (result.records.length === 0) {
        throw new Error('Trip not found or not assigned to this driver');
      }

      return result.records[0].get('t').properties;
    } finally {
      await session.close();
    }
  }

  // Complete a trip
  async completeTrip(tripId, driverId) {
    const session = driver.session();
    try {
      // Get trip details
      const tripResult = await session.run(
        `MATCH (d:Driver {id: $driverId})-[:ASSIGNED_TO]->(t:Trip {id: $tripId})
         RETURN t`,
        { driverId, tripId }
      );

      if (tripResult.records.length === 0) {
        throw new Error('Trip not found or not assigned to this driver');
      }

      const trip = tripResult.records[0].get('t').properties;
      const finalPrice = trip.estimatedPrice;
      const tvaAmount = Math.round(finalPrice * 0.08 * 100) / 100; // 8% TVA
      const driverNetAmount = finalPrice - tvaAmount;

      // Update trip status and amounts
      await session.run(
        `MATCH (d:Driver {id: $driverId})-[:ASSIGNED_TO]->(t:Trip {id: $tripId})
         SET t.status = 'COMPLETED',
             t.completedAt = datetime(),
             t.finalPrice = $finalPrice,
             t.tvaAmount = $tvaAmount,
             t.driverNetAmount = $driverNetAmount`,
        { driverId, tripId, finalPrice, tvaAmount, driverNetAmount }
      );

      // Update driver wallet
      await session.run(
        `MATCH (d:Driver {id: $driverId})-[:OWNS]->(w:Wallet)
         SET w.balance = w.balance + $driverNetAmount,
             w.totalEarned = w.totalEarned + $driverNetAmount,
             w.updatedAt = datetime()`,
        { driverId, driverNetAmount }
      );

      // Update admin wallet (TVA collection)
      await session.run(
        `MATCH (a:Admin)-[:COLLECTS]->(w:Wallet)
         SET w.balance = w.balance + $tvaAmount,
             w.totalTvaCollected = w.totalTvaCollected + $tvaAmount,
             w.updatedAt = datetime()`,
        { tvaAmount }
      );

      return {
        ...trip,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        finalPrice,
        tvaAmount,
        driverNetAmount
      };
    } finally {
      await session.close();
    }
  }

  // Get user trips
  async getUserTrips(userId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:BOOKED]->(t:Trip)
         OPTIONAL MATCH (t)<-[:ASSIGNED_TO]-(d:Driver)
         RETURN t, d`,
        { userId }
      );

      return result.records.map(record => {
        const trip = record.get('t').properties;
        const driver = record.get('d');
        return {
          ...trip,
          driver: driver ? { ...driver.properties, password: undefined } : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Get driver trips
  async getDriverTrips(driverId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {id: $driverId})-[:ASSIGNED_TO]->(t:Trip)
         OPTIONAL MATCH (t)<-[:BOOKED]-(u:User)
         RETURN t, u`,
        { driverId }
      );

      return result.records.map(record => {
        const trip = record.get('t').properties;
        const user = record.get('u');
        return {
          ...trip,
          user: user ? { ...user.properties, password: undefined } : null
        };
      });
    } finally {
      await session.close();
    }
  }

  // Get available drivers
  async getAvailableDrivers() {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (d:Driver {status: 'ACTIVE'})
         WHERE NOT EXISTS {
           MATCH (d)-[:ASSIGNED_TO]->(t:Trip)
           WHERE t.status IN ['ASSIGNED', 'STARTED']
         }
         RETURN d`,
        {}
      );

      return result.records.map(record => {
        const driver = record.get('d').properties;
        return { ...driver, password: undefined };
      });
    } finally {
      await session.close();
    }
  }

  // Get trip by ID
  async getTripById(tripId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (t:Trip {id: $tripId})
         OPTIONAL MATCH (t)<-[:BOOKED]-(u:User)
         OPTIONAL MATCH (t)<-[:ASSIGNED_TO]-(d:Driver)
         RETURN t, u, d`,
        { tripId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const trip = record.get('t').properties;
      const user = record.get('u');
      const driver = record.get('d');

      return {
        ...trip,
        user: user ? { ...user.properties, password: undefined } : null,
        driver: driver ? { ...driver.properties, password: undefined } : null
      };
    } finally {
      await session.close();
    }
  }
}

export default new TripService();
