const { Pricing } = require('../models/pricing');
const { Booking } = require('../models/bookingModels');
const geolib = require('geolib');
const { crudController } = require('./basic.crud');
const { broadcast } = require('../sockets/utils');

const base = crudController(Pricing);

async function updateAndBroadcast(req, res) {
  try {
    const item = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    // Include bookingId if present in request body (for clients tracking pricing per booking)
    const payload = { ...item.toObject?.() ? item.toObject() : item, ...(req.body && req.body.bookingId ? { bookingId: String(req.body.bookingId) } : {}) };
    broadcast('pricing:update', payload);
    return res.json(item);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

module.exports = { ...base, updateAndBroadcast };

// New: Recalculate pricing for a booking and broadcast update with bookingId
module.exports.recalculateByBooking = async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Compute distance between pickup and dropoff
    const distanceKm = geolib.getDistance(
      { latitude: booking.pickup.latitude, longitude: booking.pickup.longitude },
      { latitude: booking.dropoff.latitude, longitude: booking.dropoff.longitude }
    ) / 1000;

    // Load active pricing for the booking's vehicleType
    const p = await Pricing.findOne({ vehicleType: booking.vehicleType, isActive: true }).sort({ updatedAt: -1 });
    if (!p) return res.status(404).json({ message: 'Active pricing not found for vehicleType' });

    const fareBreakdown = {
      base: p.baseFare,
      distanceCost: distanceKm * p.perKm,
      timeCost: 0,
      waitingCost: 0,
      surgeMultiplier: p.surgeMultiplier,
    };
    const fareEstimated = (fareBreakdown.base + fareBreakdown.distanceCost + fareBreakdown.timeCost + fareBreakdown.waitingCost) * fareBreakdown.surgeMultiplier;

    booking.distanceKm = distanceKm;
    booking.fareEstimated = fareEstimated;
    booking.fareBreakdown = fareBreakdown;
    await booking.save();

    const payload = { 
      bookingId: String(booking._id),
      vehicleType: booking.vehicleType,
      distanceKm,
      fareEstimated,
      fareBreakdown
    };
    broadcast('pricing:update', payload);
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

