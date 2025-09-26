const logger = require('../utils/logger');

// Shared registry to deduplicate booking:new dispatches to the same driver per booking
// Key format: `${bookingId}:${driverId}`
const dispatchedBookingToDriver = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DISPATCH_TTL_MS = Number.parseInt(process.env.DISPATCH_TTL_MS || `${DEFAULT_TTL_MS}`, 10);

function makeKey(bookingId, driverId) {
  return `${String(bookingId)}:${String(driverId)}`;
}

function markDispatched(bookingId, driverId) {
  try { logger.info('[dispatchRegistry] mark', { bookingId: String(bookingId), driverId: String(driverId) }); } catch (_) {}
  dispatchedBookingToDriver.set(makeKey(bookingId, driverId), Date.now());
}

function wasDispatched(bookingId, driverId) {
  const key = makeKey(bookingId, driverId);
  const ts = dispatchedBookingToDriver.get(key);
  if (!ts) return false;
  if (Date.now() - ts > DISPATCH_TTL_MS) {
    dispatchedBookingToDriver.delete(key);
    return false;
  }
  return true;
}

function cleanupDispatches() {
  const now = Date.now();
  for (const [key, ts] of dispatchedBookingToDriver.entries()) {
    if (now - ts > DISPATCH_TTL_MS) dispatchedBookingToDriver.delete(key);
  }
}

setInterval(cleanupDispatches, DISPATCH_TTL_MS).unref();

module.exports = { markDispatched, wasDispatched };

