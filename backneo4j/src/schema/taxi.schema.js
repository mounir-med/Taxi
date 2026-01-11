import { Neo4jGraphQL } from "@neo4j/graphql";
import { gql } from "graphql-tag";
import driver from "../config/neo4j.js";

const typeDefs = gql`
  enum UserRole {
    ADMIN
    USER
    DRIVER
  }

  enum DriverStatus {
    ACTIVE
    PAUSED
    BANNED
  }

  enum TripStatus {
    AVAILABLE
    ACCEPTED
    STARTED
    COMPLETED
    CANCELLED
    EXPIRED
  }

  type User @node {
    id: ID! @id
    email: String! @unique
    password: String!
    name: String!
    phone: String!
    role: UserRole! @default(value: "USER")
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    
    # Relationships
    acceptedTrips: [Trip!]! @relationship(type: "ACCEPTS", direction: OUT)
    complaints: [Complaint!]! @relationship(type: "FILED", direction: OUT)
  }

  type Driver @node {
    id: ID! @id
    email: String! @unique
    password: String!
    name: String!
    phone: String!
    role: UserRole! @default(value: "DRIVER")
    status: DriverStatus! @default(value: "ACTIVE")
    licenseNumber: String! @unique
    vehicleInfo: String!
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    
    # Relationships
    proposedTrips: [Trip!]! @relationship(type: "PROPOSES", direction: OUT)
    complaints: [Complaint!]! @relationship(type: "AGAINST", direction: IN)
    wallet: Wallet @relationship(type: "OWNS", direction: OUT)
  }

  type Admin @node {
    id: ID! @id
    email: String! @unique
    password: String!
    name: String!
    role: UserRole! @default(value: "ADMIN")
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    
    # Relationships
    adminWallet: Wallet @relationship(type: "COLLECTS", direction: OUT)
  }

  type Trip @node {
    id: ID! @id
    status: TripStatus! @default(value: "AVAILABLE")
    pickupAddress: String!
    pickupLatitude: Float!
    pickupLongitude: Float!
    destinationAddress: String!
    destinationLatitude: Float!
    destinationLongitude: Float!
    distance: Float! # in km
    proposedPrice: Float! # Price set by driver
    finalPrice: Float # calculated after completion
    tvaAmount: Float # 8% of finalPrice
    driverNetAmount: Float # finalPrice - tvaAmount
    departureTime: DateTime! # When driver plans to depart
    estimatedDuration: Int! # Estimated duration in minutes
    availableSeats: Int! @default(value: 4)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    acceptedAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    expiresAt: DateTime! # When the trip offer expires
    
    # Criteria for filtering
    vehicleType: String! # e.g., "sedan", "suv", "luxury"
    driverRating: Float # Average driver rating
    
    # Relationships
    driver: Driver! @relationship(type: "PROPOSES", direction: IN)
    user: User @relationship(type: "ACCEPTS", direction: IN)
    complaints: [Complaint!]! @relationship(type: "ABOUT", direction: IN)
  }

  type Complaint @node {
    id: ID! @id
    message: String!
    status: String! @default(value: "PENDING")
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    
    # Relationships
    user: User! @relationship(type: "FILED", direction: IN)
    driver: Driver! @relationship(type: "AGAINST", direction: OUT)
    trip: Trip! @relationship(type: "ABOUT", direction: OUT)
  }

  type Wallet @node {
    id: ID! @id
    balance: Float! @default(value: 0.0)
    totalEarned: Float! @default(value: 0.0)
    totalTvaCollected: Float! @default(value: 0.0)
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    
    # Relationships
    driver: Driver @relationship(type: "OWNS", direction: IN)
    admin: Admin @relationship(type: "COLLECTS", direction: IN)
  }

  # Authentication types
  type AuthPayload {
    token: String!
    user: User!
  }

  type DriverAuthPayload {
    token: String!
    driver: Driver!
  }

  type AdminAuthPayload {
    token: String!
    admin: Admin!
  }

  # Input types
  input UserRegisterInput {
    email: String!
    password: String!
    name: String!
    phone: String!
  }

  input DriverRegisterInput {
    email: String!
    password: String!
    name: String!
    phone: String!
    licenseNumber: String!
    vehicleInfo: String!
  }

  input AdminRegisterInput {
    email: String!
    password: String!
    name: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateTripInput {
    pickupAddress: String!
    pickupLatitude: Float!
    pickupLongitude: Float!
    destinationAddress: String!
    destinationLatitude: Float!
    destinationLongitude: Float!
    proposedPrice: Float!
    departureTime: DateTime!
    estimatedDuration: Int!
    availableSeats: Int = 4
    vehicleType: String!
    expiresAt: DateTime!
  }

  input TripFilterInput {
    minPrice: Float
    maxPrice: Float
    vehicleType: String
    minRating: Float
    maxDistance: Float
    departureAfter: DateTime
    departureBefore: DateTime
    availableSeats: Int
  }

  input ComplaintInput {
    driverId: ID!
    tripId: ID!
    message: String!
  }

  input CreateDriverInput {
    email: String!
    password: String!
    name: String!
    phone: String!
    licenseNumber: String!
    vehicleInfo: String!
    status: DriverStatus
  }

  # Queries
  type Query {
    # User queries
    me: User
    myTrips: [Trip!]!
    myComplaints: [Complaint!]!
    availableTrips(filter: TripFilterInput): [Trip!]!
    
    # Driver queries
    driverMe: Driver
    driverTrips: [Trip!]!
    driverComplaints: [Complaint!]!
    driverWallet: Wallet
    
    # Admin queries
    adminMe: Admin
    allDrivers: [Driver!]!
    allTrips: [Trip!]!
    allComplaints: [Complaint!]!
    adminStats: AdminStats!
    
    # General queries
    availableDrivers: [Driver!]!
    tripById(id: ID!): Trip
  }

  # Mutations
  type Mutation {
    # Authentication mutations
    userRegister(input: UserRegisterInput!): AuthPayload!
    driverRegister(input: DriverRegisterInput!): DriverAuthPayload!
    adminRegister(input: AdminRegisterInput!): AdminAuthPayload!
    login(input: LoginInput!): AuthPayload!
    driverLogin(input: LoginInput!): DriverAuthPayload!
    adminLogin(input: LoginInput!): AdminAuthPayload!
    
    # Driver mutations
    createTrip(input: CreateTripInput!): Trip!
    startTrip(tripId: ID!): Trip!
    completeTrip(tripId: ID!): Trip!
    updateLocation(latitude: Float!, longitude: Float!): Driver!
    cancelTrip(tripId: ID!): Trip!
    
    # User mutations
    acceptTrip(tripId: ID!): Trip!
    fileComplaint(input: ComplaintInput!): Complaint!
    
    # Admin mutations
    createDriver(input: CreateDriverInput!): Driver!
    updateDriverStatus(driverId: ID!, status: DriverStatus!): Driver!
    processComplaint(complaintId: ID!, action: String!): Complaint!
    banDriver(driverId: ID!): Driver!
    pauseDriver(driverId: ID!, days: Int!): Driver!
  }
`;

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  driver,
  features: {
    authorization: {
      key: process.env.JWT_SECRET || "your-secret-key",
    },
  },
});

export default neoSchema;
