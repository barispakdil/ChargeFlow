import type { ChargingSession } from "../types/ChargingSession";

export interface IntervalConsumption {
  distance: number;
  consumedEnergy: number;
  consumption: number;
}

/**
 * Calculates energy used between two charging records.
 *
 * The interval starts immediately after `previousSession` and ends immediately
 * before `currentSession`. Therefore the battery energy used is based on the
 * previous charge's ending SOC and the current charge's starting SOC.
 *
 * When the vehicle battery capacity is available, it is the preferred source.
 * Otherwise the current charge session's measured energy and SOC increase are
 * used to estimate an effective battery capacity.
 */
export function calculateIntervalConsumption(
  currentSession: ChargingSession,
  previousSession: ChargingSession | undefined,
  batteryCapacityKwh: number | null | undefined,
): IntervalConsumption {
  if (!previousSession) return { distance: 0, consumedEnergy: 0, consumption: 0 };

  const distance = currentSession.odometer - previousSession.odometer;
  if (!Number.isFinite(distance) || distance <= 0) {
    return { distance: Math.max(0, distance || 0), consumedEnergy: 0, consumption: 0 };
  }

  const capacity = Number(batteryCapacityKwh);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { distance, consumedEnergy: 0, consumption: 0 };
  }

  const previousEnd = Math.min(100, Math.max(0, previousSession.endBattery));
  const currentEnd = Math.min(100, Math.max(0, currentSession.endBattery));
  const addedEnergy = Number(currentSession.energy);

  if (!Number.isFinite(addedEnergy) || addedEnergy <= 0) {
    return { distance, consumedEnergy: 0, consumption: 0 };
  }

  // Başlangıç SOC'sini kullanıcı girişinden almak yerine, şarj sonunda ölçülen
  // SOC ve eklenen enerji üzerinden enerji dengesi kurulur:
  // tüketilen enerji = eklenen enerji + önceki bitiş enerjisi - mevcut bitiş enerjisi.
  // Böylece yanlış girilmiş başlangıç yüzdesi tüketim hesabını bozmaz.
  const batteryEnergyBeforeDrive = capacity * (previousEnd / 100);
  const batteryEnergyAfterCharge = capacity * (currentEnd / 100);
  const consumedEnergy = addedEnergy + batteryEnergyBeforeDrive - batteryEnergyAfterCharge;

  if (!Number.isFinite(consumedEnergy) || consumedEnergy <= 0) {
    return { distance, consumedEnergy: 0, consumption: 0 };
  }

  return {
    distance,
    consumedEnergy,
    consumption: (consumedEnergy / distance) * 100,
  };
}
