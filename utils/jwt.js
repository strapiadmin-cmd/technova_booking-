const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateUserInfoToken(user, type, roles = [], permissions = []) {
  const payload = {
    id: user.id || user._id || user._doc?._id,
    type,
    roles,
    permissions,
    // Include common vehicle fields for drivers
    ...(type === 'driver' ? {
      carPlate: user.carPlate || user.carplate || user.licensePlate || user.plate || user.plateNumber,
      carName: user.carName || user.carModel,
      carModel: user.carModel || user.carName,
      carColor: user.carColor,
      vehicleType: user.vehicleType,
    } : {})
  };
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function socketAuth(socket, next) {
  try {
    const raw = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!raw) return next();
    const decoded = jwt.verify(raw, process.env.JWT_SECRET || 'secret');
    // Prefer nested user/driver fields if present, then fall back to top-level claims
    const top = decoded || {};
    const userObj = (decoded && decoded.user) || {};
    const driverObj = (decoded && decoded.driver) || {};
    // Allow passing explicit passenger in handshake.auth or payload to enrich token data
    const handshakePassenger = socket.handshake.auth?.passenger || socket.handshake.query?.passenger;
    let passengerObj = {};
    try {
      if (typeof handshakePassenger === 'string') passengerObj = JSON.parse(handshakePassenger);
      else if (handshakePassenger && typeof handshakePassenger === 'object') passengerObj = handshakePassenger;
    } catch (_) {}
    const src = { ...userObj, ...driverObj, ...top, ...passengerObj };
    const name = src.name || src.fullName || src.displayName;
    const phone = src.phone || src.phoneNumber || src.mobile;
    const email = src.email;
    const vehicleType = src.vehicleType;
    const carName = src.carName || src.carModel || src.vehicleName || src.carname || driverObj.carName || driverObj.carModel;
    const carModel = src.carModel || src.carName || src.vehicleName || src.carname || driverObj.carModel || driverObj.carName;
    // Normalize car plate from a wide set of possible claim keys
    const carPlate = (
      src.carPlate || src.carplate || src.car_plate ||
      src.carPlateNumber || src.car_plate_number ||
      src.plate || src.plateNumber || src.plate_number || src.plateNo || src.plate_no ||
      src.licensePlate || src.license_plate || src.licensePlateNumber ||
      driverObj.carPlate || driverObj.carplate || driverObj.licensePlate || driverObj.plate || driverObj.plateNumber
    );
    // Include otpRegistered and any provided passenger metadata so features can rely on it
    socket.user = {
      id: src.id ? String(src.id) : (decoded.id ? String(decoded.id) : undefined),
      type: src.type || decoded.type,
      name,
      phone,
      email,
      otpRegistered: src.otpRegistered === true || src.otp_registered === true || src.otp === true ? true : (typeof src.otpRegistered === 'boolean' ? src.otpRegistered : undefined),
      vehicleType,
      carName,
      carModel,
      carPlate,
      // Preserve raw token carPlate (exact key) to allow consumers to prefer it over normalized variants
      carPlateOriginal: typeof top.carPlate !== 'undefined' ? top.carPlate : undefined,
      carColor
    };
    socket.authToken = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
    return next();
  } catch (e) {
    return next();
  }
}

module.exports = { generateUserInfoToken, socketAuth };

