import type { ChargingSession } from "../types/ChargingSession";

export const sampleChargingSessions: ChargingSession[] = [
  {
    id: 1,
    date: "2026-07-16",
    time: "21:40",
    startBattery: 18,
    endBattery: 81,
    energy: 46.2,
    odometer: 24380,
    pricePerKwh: 8.5,
    cost: 392.7,
    location: "Ev",
  },
  {
    id: 2,
    date: "2026-07-12",
    time: "19:15",
    startBattery: 22,
    endBattery: 90,
    energy: 53.7,
    odometer: 24028,
    pricePerKwh: 8.5,
    cost: 456.45,
    location: "Ev",
  },
];