# Driver Socket Examples

## Connect
```json
{
  "auth": {
    "token": "<DRIVER_JWT>",
    "driver": { "id": "64a9c0e3b12dfe3456789abc", "name": "Abebe Kebede", "phone": "+251900000000" }
  }
}
```

## booking:nearby (Server -> Driver)
Initial snapshot after connect:
```json
{
  "init": true,
  "driverId": "64a9c0e3b12dfe3456789abc",
  "bookings": [
    {
      "id": "67f0c1f2abc1234567890def",
      "status": "requested",
      "pickup": { "latitude": 9.0308, "longitude": 38.738, "address": "Bole Airport" },
      "dropoff": { "latitude": 9.0251, "longitude": 38.7461, "address": "Meskel Square" },
      "fareEstimated": 120,
      "distanceKm": 1.4,
      "passenger": { "id": "1", "name": "John Doe", "phone": "+251912345678" },
      "createdAt": "2025-01-01T10:10:00.000Z"
    }
  ],
  "currentBookings": [],
  "user": { "id": "64a9c0e3b12dfe3456789abc", "type": "driver" }
}
```

## booking_accept (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def" }
```
Room broadcasts (received on `booking:<bookingId>`):
```json
{ "status": "accepted", "driverId": "64a9c0e3b12dfe3456789abc", "acceptedAt": "2025-01-01T10:12:00.000Z" }
```
```json
{
  "id": "67f0c1f2abc1234567890def",
  "bookingId": "67f0c1f2abc1234567890def",
  "status": "accepted",
  "driverId": "64a9c0e3b12dfe3456789abc",
  "driver": {
    "id": "64a9c0e3b12dfe3456789abc",
    "name": "Abebe Kebede",
    "phone": "+251900000000",
    "vehicleType": "sedan",
    "carName": "Toyota Vitz",
    "carPlate": "AB-12345",
    "rating": 4.8
  },
  "user": { "id": "64a9c0e3b12dfe3456789abc", "type": "driver" }
}
```

## booking:ETA_update (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "etaMinutes": 6, "message": "Traffic" }
```
Room broadcast (received on `booking:<bookingId>`):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "etaMinutes": 6, "message": "Traffic", "driverId": "64a9c0e3b12dfe3456789abc", "timestamp": "2025-01-01T10:13:00.000Z" }
```

## driver:availability (Driver -> Server)
Request (emit):
```json
{ "available": true }
```
Driver room broadcast (received on `driver:<driverId>`):
```json
{ "driverId": "64a9c0e3b12dfe3456789abc", "available": true }
```

## booking:driver_location_update (Driver -> Server)
Request (emit):
```json
{ "latitude": 9.031, "longitude": 38.739, "bearing": 45 }
```
Broadcasts (public):
```json
{ "driverId": "64a9c0e3b12dfe3456789abc", "vehicleType": "mini", "available": true, "lastKnownLocation": { "latitude": 9.031, "longitude": 38.739, "bearing": 45 }, "updatedAt": "2025-01-01T10:14:00.000Z" }
```

## trip_started (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "startLocation": { "latitude": 9.031, "longitude": 38.739 } }
```
Room broadcast:
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "startedAt": "2025-01-01T10:20:00.000Z", "startLocation": { "latitude": 9.031, "longitude": 38.739 } }
```

## trip_ongoing (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "location": { "latitude": 9.032, "longitude": 38.739 } }
```
Room broadcast:
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "location": { "latitude": 9.032, "longitude": 38.739, "timestamp": "2025-01-01T10:25:00.000Z" } }
```

## trip_completed (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "endLocation": { "latitude": 9.036, "longitude": 38.743 }, "surgeMultiplier": 1, "discount": 0 }
```
Room broadcast:
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "amount": 25.5, "distance": 5.2, "waitingTime": 2, "completedAt": "2025-01-01T10:45:00.000Z", "driverEarnings": 21.675, "commission": 3.825 }
```

## booking_cancel (Driver -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "reason": "Passenger no-show" }
```
Room broadcast:
```json
{ "status": "canceled", "canceledBy": "driver", "canceledReason": "Passenger no-show" }
```