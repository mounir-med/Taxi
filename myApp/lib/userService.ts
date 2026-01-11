import { apiRequest } from '@/lib/api';

export interface Trip {
  id: string;
  departure: string;
  arrival: string;
  price: number;
  vehicleType: string;
  availableSeats: number;
  departureTime: string;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rating?: number;
    vehicleInfo?: string;
  };
  status?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating?: number;
  vehicleInfo?: string;
  status: string;
}

export interface Complaint {
  id: string;
  message: string;
  status: 'PENDING' | 'RESOLVE' | 'REJECT' | 'ESCALATE';
  createdAt: string;
  driver?: Driver;
  trip?: Trip;
}

export interface TripFilters {
  minPrice?: number;
  maxPrice?: number;
  vehicleType?: string;
  minRating?: number;
  maxDistance?: number;
  departureAfter?: string;
  departureBefore?: string;
  availableSeats?: number;
}

export class UserService {
  static async getAvailableTrips(token: string, filters?: TripFilters): Promise<Trip[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const path = params.toString() 
      ? `/api/user/trips/available?${params.toString()}`
      : '/api/user/trips/available';
      
    return apiRequest<Trip[]>(path, { token });
  }

  static async acceptTrip(tripId: string, token: string): Promise<Trip> {
    return apiRequest<Trip>('/api/user/trips/accept', {
      method: 'POST',
      body: { tripId },
      token,
    });
  }

  static async getMyTrips(token: string): Promise<Trip[]> {
    return apiRequest<Trip[]>('/api/user/trips', { token });
  }

  static async getTripDetails(tripId: string, token: string): Promise<Trip> {
    return apiRequest<Trip>(`/api/user/trips/${tripId}`, { token });
  }

  static async getAvailableDrivers(token: string): Promise<Driver[]> {
    return apiRequest<Driver[]>('/api/user/drivers/available', { token });
  }

  static async createComplaint(
    driverId: string, 
    tripId: string, 
    message: string, 
    token: string
  ): Promise<Complaint> {
    return apiRequest<Complaint>('/api/user/complaints', {
      method: 'POST',
      body: { driverId, tripId, message },
      token,
    });
  }

  static async getMyComplaints(token: string): Promise<Complaint[]> {
    return apiRequest<Complaint[]>('/api/user/complaints', { token });
  }
}
