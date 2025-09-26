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
    const raw = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!raw) return next();
    const decoded = jwt.verify(raw, process.env.JWT_SECRET || 'secret');
    // Prefer nested user fields if present, then fall back to top-level claims
    const src = decoded && decoded.user ? { ...decoded.user, ...decoded } : decoded || {};
    const name = src.name || src.fullName || src.displayName;
    const phone = src.phone || src.phoneNumber || src.mobile;
    const email = src.email;
    const vehicleType = src.vehicleType;
    const carName = src.carName || src.carModel || src.vehicleName || src.carname;
    const carModel = src.carModel || src.carName || src.vehicleName || src.carname;
    const carPlate = src.carPlate || src.car_plate || src.carPlateNumber || src.plate || src.plateNumber;
    const carColor = src.carColor || src.color;
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
    socket.authToken = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
    return next();
  } catch (e) {
    return next();
  }
}

module.exports = { generateUserInfoToken, socketAuth };

