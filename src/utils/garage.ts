import type { ChargingSession } from "../types/ChargingSession";
import type { VehicleProfile } from "../types/VehicleProfile";
import { CHARGING_SESSIONS_STORAGE_KEY } from "./storage";
import { VEHICLE_SETTINGS_STORAGE_KEY } from "./vehicleSettings";

export const VEHICLES_STORAGE_KEY = "chargeflow-vehicles-v2";
export const ACTIVE_VEHICLE_STORAGE_KEY = "chargeflow-active-vehicle-v2";
const VEHICLE_SESSIONS_PREFIX = "chargeflow-vehicle-sessions-v2:";
const DEMO_DATA_CLEANUP_KEY = "chargeflow-demo-data-cleaned-v1";

function createId() {
  return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProfile(value: Partial<VehicleProfile>): VehicleProfile | null {
  if (typeof value.id !== "string" || !value.id) return null;
  const capacity = Number(value.batteryCapacityKwh);
  return {
    id: value.id,
    name:
      typeof value.name === "string" && value.name.trim()
        ? value.name.trim()
        : typeof value.model === "string" && value.model.trim()
          ? value.model.trim()
          : "Aracım",
    model: typeof value.model === "string" ? value.model : "",
    batteryCapacityKwh:
      Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

export function vehicleSessionsKey(vehicleId: string) {
  return `${VEHICLE_SESSIONS_PREFIX}${vehicleId}`;
}


function removeLegacyDemoData(vehicles: VehicleProfile[]) {
  if (localStorage.getItem(DEMO_DATA_CLEANUP_KEY) === "true") return;

  vehicles.forEach((vehicle) => {
    const sessions = loadVehicleSessions(vehicle.id);
    const isLegacyDemoSet =
      sessions.length >= 30 &&
      sessions.every((session) => session.notes === "Örnek test kaydı");

    if (isLegacyDemoSet) saveVehicleSessions(vehicle.id, []);
  });

  localStorage.setItem(DEMO_DATA_CLEANUP_KEY, "true");
}

export function initializeGarage(): {
  vehicles: VehicleProfile[];
  activeVehicleId: string;
} {
  const savedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);
  if (savedVehicles) {
    try {
      const parsed = JSON.parse(savedVehicles) as Partial<VehicleProfile>[];
      const vehicles = parsed.map(normalizeProfile).filter(Boolean) as VehicleProfile[];
      if (vehicles.length) {
        const savedActive = localStorage.getItem(ACTIVE_VEHICLE_STORAGE_KEY);
        const activeVehicleId = vehicles.some((vehicle) => vehicle.id === savedActive)
          ? (savedActive as string)
          : vehicles[0].id;
        localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, activeVehicleId);
        removeLegacyDemoData(vehicles);
        return { vehicles, activeVehicleId };
      }
    } catch {
      // Eski veriden yeni garaj oluşturmaya devam et.
    }
  }

  let model = "";
  let batteryCapacityKwh: number | null = null;
  try {
    const oldVehicle = JSON.parse(
      localStorage.getItem(VEHICLE_SETTINGS_STORAGE_KEY) || "{}",
    ) as { model?: unknown; batteryCapacityKwh?: unknown };
    model = typeof oldVehicle.model === "string" ? oldVehicle.model : "";
    const capacity = Number(oldVehicle.batteryCapacityKwh);
    batteryCapacityKwh = Number.isFinite(capacity) && capacity > 0 ? capacity : null;
  } catch {
    // Varsayılan profil kullanılacak.
  }

  const firstVehicle: VehicleProfile = {
    id: createId(),
    name: model.trim() || "Aracım",
    model,
    batteryCapacityKwh,
    createdAt: new Date().toISOString(),
  };

  let sessions: ChargingSession[] = [];
  const oldSessions = localStorage.getItem(CHARGING_SESSIONS_STORAGE_KEY);
  if (oldSessions) {
    try {
      const parsed = JSON.parse(oldSessions) as ChargingSession[];
      if (Array.isArray(parsed)) sessions = parsed;
    } catch {
      // Bozuk eski kayıtlar yok sayılır.
    }
  }

  saveVehicles([firstVehicle]);
  saveActiveVehicleId(firstVehicle.id);
  saveVehicleSessions(firstVehicle.id, sessions);
  return { vehicles: [firstVehicle], activeVehicleId: firstVehicle.id };
}

export function createVehicleProfile(
  name: string,
  model: string,
  batteryCapacityKwh: number | null,
): VehicleProfile {
  return {
    id: createId(),
    name: name.trim() || model.trim() || "Yeni araç",
    model: model.trim(),
    batteryCapacityKwh,
    createdAt: new Date().toISOString(),
  };
}

export function saveVehicles(vehicles: VehicleProfile[]) {
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
}

export function saveActiveVehicleId(vehicleId: string) {
  localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, vehicleId);
}

export function loadVehicleSessions(vehicleId: string): ChargingSession[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(vehicleSessionsKey(vehicleId)) || "[]");
    return Array.isArray(parsed) ? (parsed as ChargingSession[]) : [];
  } catch {
    return [];
  }
}

export function saveVehicleSessions(vehicleId: string, sessions: ChargingSession[]) {
  localStorage.setItem(vehicleSessionsKey(vehicleId), JSON.stringify(sessions));
}

export function deleteVehicleSessions(vehicleId: string) {
  localStorage.removeItem(vehicleSessionsKey(vehicleId));
}
