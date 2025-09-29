const PaymentOption = require('../models/paymentOption');
const { Driver } = require('../models/userModels');

async function getPaymentOptions() {
  return PaymentOption.find({}).select({ name: 1, logo: 1 }).sort({ name: 1 }).lean();
}

async function createPaymentOption({ name, logo }) {
  if (!name || String(name).trim().length === 0) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }
  const exists = await PaymentOption.findOne({ name: String(name).trim() }).lean();
  if (exists) {
    const err = new Error('Payment option already exists');
    err.status = 409;
    throw err;
  }
  const row = await PaymentOption.create({ name: String(name).trim(), logo });
  return { id: String(row._id), name: row.name, logo: row.logo };
}

async function setDriverPaymentPreference(driverId, paymentOptionId, options = {}) {
  const opt = await PaymentOption.findById(paymentOptionId).lean();
  if (!opt) {
    const err = new Error('Payment option not found');
    err.status = 404;
    throw err;
  }

  // Try update by internal id
  let updated = await Driver.findByIdAndUpdate(String(driverId), { $set: { paymentPreference: opt._id } }, { new: true })
    .populate({ path: 'paymentPreference', select: { name: 1, logo: 1 } });

  // Fallback: by externalId if internal id did not match
  if (!updated) {
    const existingByExternal = await Driver.findOne({ externalId: String(driverId) }).select({ _id: 1 }).lean();
    if (existingByExternal && existingByExternal._id) {
      updated = await Driver.findByIdAndUpdate(String(existingByExternal._id), { $set: { paymentPreference: opt._id } }, { new: true })
        .populate({ path: 'paymentPreference', select: { name: 1, logo: 1 } });
    }
  }

  // Final fallback: upsert from external user-service and retry
  if (!updated) {
    try {
      const { getDriverById } = require('../integrations/userServiceClient');
      const authHeader = options && options.headers ? options.headers.Authorization : undefined;
      const ext = await getDriverById(String(driverId), { headers: authHeader ? { Authorization: authHeader } : {} });
      if (ext && ext.id) {
        // Create or update the local driver record using external details
        const payload = {
          _id: String(ext.id),
          externalId: String(ext.id),
          name: ext.name,
          phone: ext.phone,
          email: ext.email,
          vehicleType: ext.vehicleType,
          lastKnownLocation: ext.lastKnownLocation,
          rating: Number.isFinite(ext.rating) ? ext.rating : 5.0
        };
        await Driver.updateOne({ _id: String(ext.id) }, { $set: payload }, { upsert: true });
        updated = await Driver.findByIdAndUpdate(String(ext.id), { $set: { paymentPreference: opt._id } }, { new: true })
          .populate({ path: 'paymentPreference', select: { name: 1, logo: 1 } });
      }
    } catch (_) { /* ignore, will throw not found below */ }
  }

  if (!updated) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  return updated;
}

module.exports = { getPaymentOptions, setDriverPaymentPreference, createPaymentOption };

