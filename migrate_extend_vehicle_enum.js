require('dotenv').config();
const { sequelize } = require('./config/database');

async function extendVehicleEnum() {
  try {
    console.log('Starting ENUM extension for drivers.vehicle_type...');

    const query = `ALTER TABLE drivers MODIFY COLUMN vehicle_type ENUM('mini','sedan','van','suv','mpv','motorbike','bajaj') NULL;`;
    await sequelize.query(query);
    console.log('Extended drivers.vehicle_type enum to include motorbike and bajaj');
    process.exit(0);
  } catch (error) {
    console.error('Failed to extend drivers.vehicle_type enum:', error.message);
    process.exit(1);
  }
}

extendVehicleEnum();

