const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateUserInfoToken(user, type, roles = [], permissions = []) {
  const payload = {
    id: user.id || user._id || user._doc?._id,
    type,
    roles,
    permissions
  };
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function socketAuth(socket, next) {
  try {
    let raw = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || socket.handshake.headers?.authorization;
    if (!raw) return next();
    const token = String(raw)
      .replace(/^\s+|\s+$/g, '')
      .replace(/^(Bearer|JWT|Token)\s+/i, '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // Prefer nested user/driver fields if present, then fall back to top-level claims
    const top = decoded || {};
    const userObj = (decoded && decoded.user) || {};
    const driverObj = (decoded && decoded.driver) || {};
    const src = { ...userObj, ...driverObj, ...top };
    const name = src.name || src.fullName || src.displayName;
    const phone = src.phone || src.phoneNumber || src.mobile;
    const email = src.email;
    const vehicleType = src.vehicleType;
    const carName = src.carName || src.carModel || src.vehicleName || src.carname || driverObj.carName || driverObj.carModel;
    const carModel = src.carModel || src.carName || src.vehicleName || src.carname || driverObj.carModel || driverObj.carName;
    const carPlate = src.carPlate || src.car_plate || src.carPlateNumber || src.plate || src.plateNumber || driverObj.carPlate;
    const carColor = src.carColor || src.color || driverObj.carColor;
    socket.user = {
      id: src.id ? String(src.id) : (decoded.id ? String(decoded.id) : undefined),
      type: src.type || decoded.type,
      name,
      phone,
      email,
      vehicleType,
      carName,
      carModel,
      carPlate,
      carColor
    };
    socket.authToken = `Bearer ${token}`;
    return next();
  } catch (e) {
    return next();
  }
}

module.exports = { generateUserInfoToken, socketAuth };

