# Passenger Socket Examples

## Connect
```json
{
  "auth": {
    "token": "<PASSENGER_JWT>",
    "passenger": {
      "id": 1,
      "name": "John Doe",
      "phone": "+251912345678",
      "otpRegistered": true
    }
  }
}
```

## booking_request (Passenger -> Server)
Request (emit):
```json
{
  "vehicleType": "mini",
  "pickup": { "latitude": 9.0308, "longitude": 38.738, "address": "Bole Airport" },
  "dropoff": { "latitude": 9.0251, "longitude": 38.7461, "address": "Meskel Square" }
}
```
Response (to emitter):
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def" }
```

## booking:join_room (Passenger -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def" }
```
Response (to emitter):
```json
{ "bookingId": "67f0c1f2abc1234567890def" }
```

## booking:status_request (Passenger -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def" }
```
Response (to emitter `booking:status`):
```json
{
  "id": "67f0c1f2abc1234567890def",
  "bookingId": "67f0c1f2abc1234567890def",
  "status": "requested",
  "driverId": null,
  "passengerId": "1",
  "vehicleType": "mini",
  "pickup": { "latitude": 9.0308, "longitude": 38.738, "address": "Bole Airport" },
  "dropoff": { "latitude": 9.0251, "longitude": 38.7461, "address": "Meskel Square" }
}
```

## booking_accept (Server -> Passenger room)
Broadcast (received on `booking:<bookingId>` and `passenger:<passengerId>`):
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

## booking:ETA_update (Server -> Passenger room)
Broadcast (received on `booking:<bookingId>`):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "etaMinutes": 6, "message": "Traffic", "driverId": "64a9c0e3b12dfe3456789abc", "timestamp": "2025-01-01T10:15:30.000Z" }
```

## trip_started (Server -> Passenger room)
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "startedAt": "2025-01-01T10:20:00.000Z", "startLocation": { "latitude": 9.031, "longitude": 38.739 } }
```

## trip_ongoing (Server -> Passenger room)
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "location": { "latitude": 9.032, "longitude": 38.739, "timestamp": "2025-01-01T10:25:00.000Z" } }
```

## trip_completed (Server -> Passenger room)
```json
{ "id": "67f0c1f2abc1234567890def", "bookingId": "67f0c1f2abc1234567890def", "amount": 25.5, "distance": 5.2, "waitingTime": 2, "completedAt": "2025-01-01T10:45:00.000Z", "driverEarnings": 21.675, "commission": 3.825 }
```

## booking_cancel (Passenger -> Server)
Request (emit):
```json
{ "bookingId": "67f0c1f2abc1234567890def", "reason": "Changed my mind" }
```
Room broadcast (received on `booking:<bookingId>`):
```json
{ "status": "canceled", "canceledBy": "passenger", "canceledReason": "Changed my mind" }
```