import driver from '../config/neo4j.js';
import { hashPassword } from '../middleware/auth.js';

class MigrationService {
  async migrateFromTransportToTaxi() {
    const session = driver.session();
    
    try {
      console.log('🚀 Starting migration from Transport schema to Taxi schema...');
      
      // Step 1: Check existing data
      await this.checkExistingData(session);
      
      // Step 2: Migrate Passagers to Users
      await this.migratePassagersToUsers(session);
      
      // Step 3: Convert Stations to potential Trip locations
      await this.backupStations(session);
      
      // Step 4: Create admin user if not exists
      await this.createDefaultAdmin(session);
      
      // Step 5: Create constraints and indexes for new schema
      await this.createConstraints(session);
      
      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async checkExistingData(session) {
    console.log('📊 Checking existing data...');
    
    const passagersResult = await session.run('MATCH (p:Passager) RETURN count(p) as count');
    const passagersCount = passagersResult.records[0].get('count').toNumber();
    
    const stationsResult = await session.run('MATCH (s:Station) RETURN count(s) as count');
    const stationsCount = stationsResult.records[0].get('count').toNumber();
    
    const lignesResult = await session.run('MATCH (l:Ligne) RETURN count(l) as count');
    const lignesCount = lignesResult.records[0].get('count').toNumber();
    
    console.log(`📋 Found ${passagersCount} Passagers, ${stationsCount} Stations, ${lignesCount} Lignes`);
    
    // Check if new schema already exists
    const usersResult = await session.run('MATCH (u:User) RETURN count(u) as count');
    const usersCount = usersResult.records[0].get('count').toNumber();
    
    if (usersCount > 0) {
      throw new Error(`Migration cannot proceed: ${usersCount} Users already exist. Please clear the database first.`);
    }
    
    return { passagersCount, stationsCount, lignesCount };
  }

  async migratePassagersToUsers(session) {
    console.log('👥 Migrating Passagers to Users...');
    
    const result = await session.run(`
      MATCH (p:Passager)
      CREATE (u:User {
        id: randomUUID(),
        email: COALESCE(p.email, p.name + '@taxiluxe.com'),
        password: $defaultPassword,
        name: p.name,
        phone: COALESCE(p.phone, '0000000000'),
        role: 'USER',
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN u, p
    `, { defaultPassword: await hashPassword('password123') });
    
    console.log(`✅ Migrated ${result.records.length} Passagers to Users`);
    
    // Store mapping for reference
    await session.run(`
      MATCH (p:Passager), (u:User)
      WHERE u.name = p.name
      CREATE (p)-[:MIGRATED_TO]->(u)
    `);
  }

  async backupStations(session) {
    console.log('🗂️ Backing up Stations for future reference...');
    
    const result = await session.run(`
      MATCH (s:Station)
      OPTIONAL MATCH (s)-[:CONNECTED_TO]->(connected:Station)
      RETURN s, collect(connected.name) as connectedStations
    `);
    
    console.log(`📍 Backed up ${result.records.length} Stations with connections`);
    
    // Create backup nodes
    for (const record of result.records) {
      const station = record.get('s').properties;
      const connectedStations = record.get('connectedStations');
      
      await session.run(`
        CREATE (backup:StationBackup {
          originalId: $id,
          name: $name,
          code: $code,
          connectedStations: $connectedStations,
          backupDate: datetime()
        })
      `, {
        id: station.id,
        name: station.name,
        code: station.code,
        connectedStations: connectedStations
      });
    }
  }

  async createDefaultAdmin(session) {
    console.log('👨‍💼 Creating default admin user...');
    
    const existingAdmin = await session.run('MATCH (a:Admin) RETURN count(a) as count');
    const adminCount = existingAdmin.records[0].get('count').toNumber();
    
    if (adminCount === 0) {
      const adminPassword = await hashPassword('admin123');
      
      await session.run(`
        CREATE (a:Admin {
          id: randomUUID(),
          email: 'admin@taxiluxe.com',
          password: $password,
          name: 'System Administrator',
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
      `, { password: adminPassword });
      
      console.log('✅ Default admin created: admin@taxiluxe.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  }

  async createConstraints(session) {
    console.log('🔧 Creating constraints and indexes...');
    
    const constraints = [
      // User constraints
      'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      
      // Driver constraints  
      'CREATE CONSTRAINT driver_email_unique IF NOT EXISTS FOR (d:Driver) REQUIRE d.email IS UNIQUE',
      'CREATE CONSTRAINT driver_id_unique IF NOT EXISTS FOR (d:Driver) REQUIRE d.id IS UNIQUE',
      'CREATE CONSTRAINT driver_license_unique IF NOT EXISTS FOR (d:Driver) REQUIRE d.licenseNumber IS UNIQUE',
      
      // Admin constraints
      'CREATE CONSTRAINT admin_email_unique IF NOT EXISTS FOR (a:Admin) REQUIRE a.email IS UNIQUE',
      'CREATE CONSTRAINT admin_id_unique IF NOT EXISTS FOR (a:Admin) REQUIRE a.id IS UNIQUE',
      
      // Trip constraints
      'CREATE CONSTRAINT trip_id_unique IF NOT EXISTS FOR (t:Trip) REQUIRE t.id IS UNIQUE',
      
      // Complaint constraints
      'CREATE CONSTRAINT complaint_id_unique IF NOT EXISTS FOR (c:Complaint) REQUIRE c.id IS UNIQUE',
      
      // Wallet constraints
      'CREATE CONSTRAINT wallet_id_unique IF NOT EXISTS FOR (w:Wallet) REQUIRE w.id IS UNIQUE'
    ];
    
    const indexes = [
      'CREATE INDEX user_name_index IF NOT EXISTS FOR (u:User) ON (u.name)',
      'CREATE INDEX driver_name_index IF NOT EXISTS FOR (d:Driver) ON (d.name)',
      'CREATE INDEX driver_status_index IF NOT EXISTS FOR (d:Driver) ON (d.status)',
      'CREATE INDEX trip_status_index IF NOT EXISTS FOR (t:Trip) ON (t.status)',
      'CREATE INDEX trip_requested_at_index IF NOT EXISTS FOR (t:Trip) ON (t.requestedAt)',
      'CREATE INDEX complaint_status_index IF NOT EXISTS FOR (c:Complaint) ON (c.status)',
      'CREATE INDEX complaint_created_at_index IF NOT EXISTS FOR (c:Complaint) ON (c.createdAt)'
    ];
    
    for (const constraint of constraints) {
      try {
        await session.run(constraint);
      } catch (error) {
        console.warn(`⚠️ Constraint creation warning: ${error.message}`);
      }
    }
    
    for (const index of indexes) {
      try {
        await session.run(index);
      } catch (error) {
        console.warn(`⚠️ Index creation warning: ${error.message}`);
      }
    }
    
    console.log('✅ Constraints and indexes created');
  }

  async rollbackMigration() {
    const session = driver.session();
    
    try {
      console.log('🔄 Rolling back migration...');
      
      // Remove new schema nodes
      await session.run('MATCH (u:User) DETACH DELETE u');
      await session.run('MATCH (d:Driver) DETACH DELETE d');
      await session.run('MATCH (a:Admin) DETACH DELETE a');
      await session.run('MATCH (t:Trip) DETACH DELETE t');
      await session.run('MATCH (c:Complaint) DETACH DELETE c');
      await session.run('MATCH (w:Wallet) DETACH DELETE w');
      
      console.log('✅ Migration rollback completed');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getMigrationStatus() {
    const session = driver.session();
    
    try {
      const stats = await session.run(`
        MATCH (n) 
        RETURN labels(n) as label, count(n) as count
        ORDER BY label
      `);
      
      console.log('📊 Current database status:');
      stats.records.forEach(record => {
        const label = record.get('label')[0] || 'Unknown';
        const count = record.get('count').toNumber();
        console.log(`  ${label}: ${count}`);
      });
      
    } finally {
      await session.close();
    }
  }
}

// CLI interface
async function main() {
  const migration = new MigrationService();
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await migration.migrateFromTransportToTaxi();
      break;
    case 'rollback':
      await migration.rollbackMigration();
      break;
    case 'status':
      await migration.getMigrationStatus();
      break;
    default:
      console.log(`
🚕 Taxi Luxe Migration Tool

Usage:
  node migrate.js migrate     # Migrate from Transport to Taxi schema
  node migrate.js rollback   # Rollback migration (removes Taxi schema)
  node migrate.js status     # Show current database status

Examples:
  npm run migrate
  npm run migrate:rollback
  npm run migrate:status
      `);
  }
  
  await driver.close();
}

// Export for programmatic use
export default new MigrationService();

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
