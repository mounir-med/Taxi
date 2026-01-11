import { apiRequest } from '@/lib/api';

export type DriverStatus = 'ACTIVE' | 'PAUSED' | 'BANNED';

export type AdminDriver = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  vehicleInfo?: string;
  status?: DriverStatus | string;
  complaintCount?: number;
  wallet?: {
    balance?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type AdminTrip = {
  id: string;
  status?: string;
  price?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  driver?: any;
  user?: any;
  [key: string]: unknown;
};

export type AdminComplaint = {
  id: string;
  message?: string;
  status?: string;
  createdAt?: unknown;
  user?: any;
  driver?: any;
  trip?: any;
  [key: string]: unknown;
};

export type ComplaintProcessAction = 'RESOLVE' | 'REJECT' | 'ESCALATE';

export type AdminWallet = {
  balance?: number;
  totalTvaCollected?: number;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export class AdminService {
  static async getStats(token: string): Promise<any> {
    return apiRequest<any>('/api/admin/stats', { token });
  }

  static async getStatistics(token: string): Promise<any> {
    return apiRequest<any>('/api/admin/statistics', { token });
  }

  static async getDrivers(token: string): Promise<AdminDriver[]> {
    return apiRequest<AdminDriver[]>('/api/admin/drivers', { token });
  }

  static async getDriverById(driverId: string, token: string): Promise<AdminDriver> {
    return apiRequest<AdminDriver>(`/api/admin/drivers/${driverId}`, { token });
  }

  static async createDriver(
    input: {
      email: string;
      password: string;
      name: string;
      phone: string;
      licenseNumber: string;
      vehicleInfo: string;
      status?: DriverStatus;
    },
    token: string
  ): Promise<any> {
    return apiRequest<any>('/api/admin/drivers', {
      method: 'POST',
      token,
      body: {
        ...input,
        status: input.status ?? 'ACTIVE',
      },
    });
  }

  static async updateDriverStatus(driverId: string, status: DriverStatus, token: string): Promise<any> {
    return apiRequest<any>(`/api/admin/drivers/${driverId}/status`, {
      method: 'PUT',
      token,
      body: { status },
    });
  }

  static async banDriver(driverId: string, token: string): Promise<any> {
    return apiRequest<any>(`/api/admin/drivers/${driverId}/ban`, {
      method: 'POST',
      token,
    });
  }

  static async pauseDriver(driverId: string, days: number, token: string): Promise<any> {
    return apiRequest<any>(`/api/admin/drivers/${driverId}/pause`, {
      method: 'POST',
      token,
      body: { days },
    });
  }

  static async getTrips(token: string): Promise<AdminTrip[]> {
    return apiRequest<AdminTrip[]>('/api/admin/trips', { token });
  }

  static async getComplaints(token: string): Promise<AdminComplaint[]> {
    return apiRequest<AdminComplaint[]>('/api/admin/complaints', { token });
  }

  static async processComplaint(complaintId: string, action: ComplaintProcessAction, token: string): Promise<any> {
    return apiRequest<any>(`/api/admin/complaints/${complaintId}/process`, {
      method: 'PUT',
      token,
      body: { action },
    });
  }

  static async getComplaintStats(token: string): Promise<any> {
    return apiRequest<any>('/api/admin/complaints/stats', { token });
  }

  static async getWallet(token: string): Promise<AdminWallet> {
    return apiRequest<AdminWallet>('/api/admin/wallet', { token });
  }
}
