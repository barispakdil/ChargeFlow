import type { ChargingSession } from "../types/ChargingSession";
import type { VehicleProfile } from "../types/VehicleProfile";

export const BACKUP_FORMAT = "chargeflow-backup";
export const BACKUP_VERSION = 2;
export const LAST_BACKUP_DATE_KEY = "chargeflow-last-backup-date";

export interface VehicleBackupEntry {
  vehicle: VehicleProfile;
  sessions: ChargingSession[];
}

export interface ChargeFlowBackup {
  app: "ChargeFlow";
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  activeVehicleId: string;
  vehicles: VehicleBackupEntry[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isChargingSession(value: unknown): value is ChargingSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ChargingSession>;
  return (
    isFiniteNumber(session.id) &&
    typeof session.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(session.date) &&
    typeof session.time === "string" &&
    /^\d{2}:\d{2}$/.test(session.time) &&
    isFiniteNumber(session.startBattery) &&
    isFiniteNumber(session.endBattery) &&
    isFiniteNumber(session.energy) &&
    isFiniteNumber(session.odometer) &&
    isFiniteNumber(session.pricePerKwh) &&
    isFiniteNumber(session.cost) &&
    typeof session.location === "string"
  );
}

function isVehicleProfile(value: unknown): value is VehicleProfile {
  if (!value || typeof value !== "object") return false;
  const vehicle = value as Partial<VehicleProfile>;
  return (
    typeof vehicle.id === "string" &&
    vehicle.id.length > 0 &&
    typeof vehicle.name === "string" &&
    typeof vehicle.model === "string" &&
    (vehicle.batteryCapacityKwh === null || isFiniteNumber(vehicle.batteryCapacityKwh)) &&
    (vehicle.preferredChargeEndPercent === undefined || isFiniteNumber(vehicle.preferredChargeEndPercent)) &&
    typeof vehicle.createdAt === "string"
  );
}

export function createBackup(
  vehicles: VehicleProfile[],
  activeVehicleId: string,
  getSessions: (vehicleId: string) => ChargingSession[],
): ChargeFlowBackup {
  return {
    app: "ChargeFlow",
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    activeVehicleId,
    vehicles: vehicles.map((vehicle) => ({
      vehicle,
      sessions: getSessions(vehicle.id),
    })),
  };
}

export function parseBackup(rawText: string): ChargeFlowBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Seçilen dosya geçerli bir JSON dosyası değil.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Yedek dosyasının yapısı geçersiz.");
  }

  const backup = parsed as Record<string, unknown>;
  if (backup.app !== "ChargeFlow" || backup.format !== BACKUP_FORMAT) {
    throw new Error("Bu dosya ChargeFlow tarafından oluşturulmuş bir yedek değil.");
  }

  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    throw new Error("Bu yedek daha yeni bir ChargeFlow sürümüyle oluşturulmuş.");
  }

  // v1 yedeklerini tek araçlı v2 biçimine dönüştür.
  if (backup.version === 1) {
    const sessions = backup.sessions;
    if (!Array.isArray(sessions) || !sessions.every(isChargingSession)) {
      throw new Error("Yedekteki şarj kayıtlarından biri veya birkaçı geçersiz.");
    }
    const id = `imported-${Date.now()}`;
    return {
      app: "ChargeFlow",
      format: BACKUP_FORMAT,
      version: 2,
      createdAt: typeof backup.createdAt === "string" ? backup.createdAt : new Date().toISOString(),
      activeVehicleId: id,
      vehicles: [{
        vehicle: {
          id,
          name: "İçe aktarılan araç",
          model: "",
          batteryCapacityKwh: null,
          preferredChargeEndPercent: 80,
          createdAt: new Date().toISOString(),
        },
        sessions,
      }],
    };
  }

  if (!Array.isArray(backup.vehicles)) {
    throw new Error("Yedekte araç bilgileri bulunamadı.");
  }

  const entries = backup.vehicles as unknown[];
  if (!entries.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const value = entry as { vehicle?: unknown; sessions?: unknown };
    return isVehicleProfile(value.vehicle) &&
      Array.isArray(value.sessions) && value.sessions.every(isChargingSession);
  })) {
    throw new Error("Yedekteki araç veya şarj kayıtlarından biri geçersiz.");
  }

  const vehicles = (entries as VehicleBackupEntry[]).map((entry) => ({
    ...entry,
    vehicle: {
      ...entry.vehicle,
      preferredChargeEndPercent:
        Number.isFinite(entry.vehicle.preferredChargeEndPercent) && entry.vehicle.preferredChargeEndPercent >= 1 && entry.vehicle.preferredChargeEndPercent <= 100
          ? entry.vehicle.preferredChargeEndPercent
          : 80,
    },
  }));
  const activeVehicleId =
    typeof backup.activeVehicleId === "string" &&
    vehicles.some((entry) => entry.vehicle.id === backup.activeVehicleId)
      ? backup.activeVehicleId
      : vehicles[0]?.vehicle.id;

  if (!activeVehicleId) throw new Error("Yedekte kullanılabilir araç bulunamadı.");

  return {
    app: "ChargeFlow",
    format: BACKUP_FORMAT,
    version: 2,
    createdAt: typeof backup.createdAt === "string" ? backup.createdAt : new Date().toISOString(),
    activeVehicleId,
    vehicles,
  };
}

export function buildBackupFileName(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `ChargeFlow_Backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}

export function mergeSessionCollections(
  currentSessions: ChargingSession[],
  importedSessions: ChargingSession[],
) {
  const map = new Map<string, ChargingSession>();
  [...currentSessions, ...importedSessions].forEach((session) => {
    const key = `${session.date}-${session.time}-${session.odometer}`;
    map.set(key, session);
  });
  return Array.from(map.values());
}
