import Joi from 'joi';

// User registration validation
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().min(10).max(20).pattern(/^[+]?[0-9\s\-()]+$/).required()
});

// Driver registration validation
export const driverRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().min(10).max(20).pattern(/^[+]?[0-9\s\-()]+$/).required(),
  licenseNumber: Joi.string().min(5).max(20).required(),
  vehicleInfo: Joi.string().min(5).max(100).required()
});

// Admin registration validation
export const adminRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required()
});

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Trip booking validation
export const bookTripSchema = Joi.object({
  pickupAddress: Joi.string().min(5).max(200).required(),
  pickupLatitude: Joi.number().min(-90).max(90).required(),
  pickupLongitude: Joi.number().min(-180).max(180).required(),
  destinationAddress: Joi.string().min(5).max(200).required(),
  destinationLatitude: Joi.number().min(-90).max(90).required(),
  destinationLongitude: Joi.number().min(-180).max(180).required(),
  requestedAt: Joi.date().optional()
});

// Complaint validation
export const complaintSchema = Joi.object({
  driverId: Joi.string().uuid().required(),
  tripId: Joi.string().uuid().required(),
  message: Joi.string().min(10).max(500).required()
});

// Create driver validation (admin)
export const createDriverSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().min(10).max(20).pattern(/^[+]?[0-9\s\-()]+$/).required(),
  licenseNumber: Joi.string().min(5).max(20).required(),
  vehicleInfo: Joi.string().min(5).max(100).required(),
  status: Joi.string().valid('ACTIVE', 'PAUSED', 'BANNED').optional()
});

// Driver status update validation
export const driverStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'PAUSED', 'BANNED').required()
});

// Driver pause validation
export const driverPauseSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).required()
});

// Complaint processing validation
export const processComplaintSchema = Joi.object({
  action: Joi.string().valid('RESOLVE', 'REJECT', 'ESCALATE').required()
});

// Location update validation
export const locationUpdateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

// Trip action validation (start/complete)
export const tripActionSchema = Joi.object({
  tripId: Joi.string().uuid().required()
});

// UUID parameter validation
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  driverId: Joi.string().uuid().required(),
  tripId: Joi.string().uuid().required(),
  complaintId: Joi.string().uuid().required()
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Parameter validation middleware factory
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};
