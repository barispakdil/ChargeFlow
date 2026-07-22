import type { VehicleSettings } from "../types/VehicleSettings";

export const VEHICLE_SETTINGS_STORAGE_KEY = "chargeflow-vehicle-settings";

export const DEFAULT_VEHICLE_SETTINGS: VehicleSettings = {
  model: "",
  batteryCapacityKwh: null,
  preferredChargeEndPercent: 80,
};

export function loadVehicleSettings(): VehicleSettings {
  const saved = localStorage.getItem(VEHICLE_SETTINGS_STORAGE_KEY);
  if (!saved) return DEFAULT_VEHICLE_SETTINGS;

  try {
    const parsed = JSON.parse(saved) as Partial<VehicleSettings>;
    const capacity = Number(parsed.batteryCapacityKwh);

    return {
      model: typeof parsed.model === "string" ? parsed.model : "",
      batteryCapacityKwh:
        Number.isFinite(capacity) && capacity > 0 ? capacity : null,
      preferredChargeEndPercent:
        Number.isFinite(Number(parsed.preferredChargeEndPercent)) && Number(parsed.preferredChargeEndPercent) >= 1 && Number(parsed.preferredChargeEndPercent) <= 100
          ? Number(parsed.preferredChargeEndPercent)
          : 80,
    };
  } catch {
    return DEFAULT_VEHICLE_SETTINGS;
  }
}

export function saveVehicleSettings(settings: VehicleSettings) {
  localStorage.setItem(
    VEHICLE_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}
