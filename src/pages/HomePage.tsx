import { useEffect, useMemo, useState } from "react";
import AddChargeSheet from "../components/AddChargeSheet";
import BottomNavigation from "../components/BottomNavigation";
import BackupView from "../components/BackupView";
import HomeHeader from "../components/HomeHeader";
import MonthGroup from "../components/MonthGroup";
import SessionDetailSheet from "../components/SessionDetailSheet";
import StatisticsView from "../components/StatisticsView";
import TabPlaceholder from "../components/TabPlaceholder";
import { useChargingSessions } from "../hooks/useChargingSessions";
import type { ChargingSession } from "../types/ChargingSession";
import type { ActiveTab } from "../types/navigation";
import type { ThemeSettings } from "../types/ThemeSettings";
import type { VehicleProfile } from "../types/VehicleProfile";
import type { ChargeFlowBackup } from "../utils/backup";
import { mergeSessionCollections } from "../utils/backup";
import {
  createVehicleProfile,
  deleteVehicleSessions,
  initializeGarage,
  loadVehicleSessions,
  saveActiveVehicleId,
  saveVehicleSessions,
  saveVehicles,
} from "../utils/garage";
import { applyThemeSettings, loadThemeSettings, saveThemeSettings } from "../utils/themeSettings";

function HomePage() {
  const garage = useMemo(() => initializeGarage(), []);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>(garage.vehicles);
  const [activeVehicleId, setActiveVehicleId] = useState(garage.activeVehicleId);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());

  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? vehicles[0];

  useEffect(() => {
    saveVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveActiveVehicleId(activeVehicleId);
    setSelectedSession(null);
    setIsAddSheetOpen(false);
  }, [activeVehicleId]);

  useEffect(() => {
    applyThemeSettings(themeSettings);
    saveThemeSettings(themeSettings);
    if (themeSettings.mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const syncSystemTheme = () => applyThemeSettings(themeSettings);
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [themeSettings]);

  const {
    sortedSessions,
    latestSession,
    groupedMonths,
    statisticsSummary,
    addChargingSession,
    updateChargingSession,
    deleteChargingSession,
  } = useChargingSessions(activeVehicleId);

  function changeActiveVehicle(vehicleId: string) {
    if (!vehicles.some((vehicle) => vehicle.id === vehicleId)) return;
    setActiveVehicleId(vehicleId);
    setActiveTab("home");
  }

  function addVehicle(name: string, model: string, batteryCapacityKwh: number) {
    const vehicle = createVehicleProfile(name, model, batteryCapacityKwh);
    saveVehicleSessions(vehicle.id, []);
    setVehicles((current) => [...current, vehicle]);
    setActiveVehicleId(vehicle.id);
  }

  function updateVehicle(updatedVehicle: VehicleProfile) {
    setVehicles((current) => current.map((vehicle) =>
      vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
    ));
  }

  function deleteVehicle(vehicleId: string) {
    if (vehicles.length <= 1) return;
    const remaining = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
    deleteVehicleSessions(vehicleId);
    setVehicles(remaining);
    if (activeVehicleId === vehicleId) setActiveVehicleId(remaining[0].id);
  }

  function restoreBackup(backup: ChargeFlowBackup, mode: "merge" | "replace") {
    if (mode === "replace") {
      vehicles.forEach((vehicle) => deleteVehicleSessions(vehicle.id));
      backup.vehicles.forEach((entry) => saveVehicleSessions(entry.vehicle.id, entry.sessions));
      const restoredVehicles = backup.vehicles.map((entry) => entry.vehicle);
      saveVehicles(restoredVehicles);
      saveActiveVehicleId(backup.activeVehicleId);
      setVehicles(restoredVehicles);
      setActiveVehicleId(backup.activeVehicleId);
      window.setTimeout(() => window.location.reload(), 80);
      return;
    }

    const nextVehicles = [...vehicles];
    backup.vehicles.forEach((entry) => {
      const existingIndex = nextVehicles.findIndex((vehicle) => vehicle.id === entry.vehicle.id);
      if (existingIndex >= 0) {
        nextVehicles[existingIndex] = { ...nextVehicles[existingIndex], ...entry.vehicle };
        saveVehicleSessions(
          entry.vehicle.id,
          mergeSessionCollections(loadVehicleSessions(entry.vehicle.id), entry.sessions),
        );
      } else {
        nextVehicles.push(entry.vehicle);
        saveVehicleSessions(entry.vehicle.id, entry.sessions);
      }
    });
    const nextActiveVehicleId = nextVehicles.some((vehicle) => vehicle.id === backup.activeVehicleId)
      ? backup.activeVehicleId
      : activeVehicleId;
    saveVehicles(nextVehicles);
    saveActiveVehicleId(nextActiveVehicleId);
    setVehicles(nextVehicles);
    setActiveVehicleId(nextActiveVehicleId);
    window.setTimeout(() => window.location.reload(), 80);
  }

  function handleSave(session: ChargingSession) {
    addChargingSession(session);
    setIsAddSheetOpen(false);
    setActiveTab("home");
  }

  function handleDelete(sessionId: number) {
    deleteChargingSession(sessionId);
    if (selectedSession?.id === sessionId) setSelectedSession(null);
  }

  return (
    <main className="app-shell">
      <section className="phone-page">
        {!isAddSheetOpen && !selectedSession && (
          <HomeHeader showAddButton={activeTab === "home"} onAdd={() => setIsAddSheetOpen(true)} />
        )}

        {activeTab === "home" && (
          sortedSessions.length > 0 ? (
            <section className="month-groups continuous-month-groups">
              {groupedMonths.map((month) => (
                <MonthGroup key={month.key} month={month} sortedSessions={sortedSessions} onSessionOpen={setSelectedSession} onSessionDelete={handleDelete} />
              ))}
            </section>
          ) : (
            <section className="home-empty-state" aria-label="Henüz şarj kaydı yok">
              <div className="home-empty-icon" aria-hidden="true">⚡</div>
              <h1>İlk şarjını ekle</h1>
              <p>Henüz bu araç için kayıt bulunmuyor. İlk şarj işlemini ekleyerek tüketim ve maliyet istatistiklerini oluşturmaya başla.</p>
              <button type="button" onClick={() => setIsAddSheetOpen(true)}>
                <span aria-hidden="true">+</span> İlk Şarjı Ekle
              </button>
            </section>
          )
        )}

        {activeTab === "statistics" && <StatisticsView summary={statisticsSummary} sessions={sortedSessions} />}
        {activeTab === "analysis" && <TabPlaceholder type="analysis" />}
        {activeTab === "more" && (
          <BackupView
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onActiveVehicleChange={changeActiveVehicle}
            onAddVehicle={addVehicle}
            onUpdateVehicle={updateVehicle}
            onDeleteVehicle={deleteVehicle}
            onRestoreBackup={restoreBackup}
            themeSettings={themeSettings}
            onThemeSettingsChange={setThemeSettings}
          />
        )}
      </section>

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />

      <AddChargeSheet
        isOpen={isAddSheetOpen}
        lastSession={latestSession}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={handleSave}
        vehicleSettings={{
          model: activeVehicle?.model ?? "",
          batteryCapacityKwh: activeVehicle?.batteryCapacityKwh ?? null,
        }}
      />

      <SessionDetailSheet
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onUpdate={updateChargingSession}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default HomePage;
