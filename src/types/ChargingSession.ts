export interface ChargingSession {
  id: number;
  date: string;
  time: string;
  startBattery: number;
  endBattery: number;
  energy: number;
  odometer: number;
  pricePerKwh: number;
  cost: number;
  location: string;
}