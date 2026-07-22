export interface VehicleProfile {
  id: string;
  name: string;
  model: string;
  batteryCapacityKwh: number | null;
  preferredChargeEndPercent: number;
  createdAt: string;
}
