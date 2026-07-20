export type TireType = "summer" | "winter" | "allSeason";
export type ChargingType = "AC" | "DC";

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

  temperature?: number;
  tireType?: TireType;
  chargingType?: ChargingType;
  averageSpeed?: number;
  notes?: string;
}