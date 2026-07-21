import { useEffect, useState } from "react";
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
import type { VehicleSettings } from "../types/VehicleSettings";
import type { ThemeSettings } from "../types/ThemeSettings";
import { loadVehicleSettings, saveVehicleSettings } from "../utils/vehicleSettings";
import { applyThemeSettings, loadThemeSettings, saveThemeSettings } from "../utils/themeSettings";

function HomePage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ChargingSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [vehicleSettings, setVehicleSettings] = useState<VehicleSettings>(() =>
    loadVehicleSettings(),
  );
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() =>
    loadThemeSettings(),
  );

  useEffect(() => {
    saveVehicleSettings(vehicleSettings);
  }, [vehicleSettings]);

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
    importChargingSessions,
  } = useChargingSessions();

  function handleSave(session: ChargingSession) {
    addChargingSession(session);
    setIsAddSheetOpen(false);
    setActiveTab("home");
  }

  function handleUpdate(session: ChargingSession) {
    updateChargingSession(session);
    setSelectedSession(session);
  }

  function handleDelete(sessionId: number) {
    deleteChargingSession(sessionId);

    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="phone-page">
        {!isAddSheetOpen && !selectedSession && (
          <HomeHeader
            showAddButton={activeTab === "home"}
            onAdd={() => setIsAddSheetOpen(true)}
          />
        )}

        {activeTab === "home" && (
          <>
            <section className="month-groups continuous-month-groups">
              {groupedMonths.map((month) => (
                <MonthGroup
                  key={month.key}
                  month={month}
                  sortedSessions={sortedSessions}
                  onSessionOpen={setSelectedSession}
                  onSessionDelete={handleDelete}
                />
              ))}
            </section>
          </>
        )}

        {activeTab === "statistics" && (
          <StatisticsView
            summary={statisticsSummary}
            sessions={sortedSessions}
          />
        )}

        {activeTab === "analysis" && (
          <TabPlaceholder type="analysis" />
        )}

        {activeTab === "more" && (
          <BackupView
            sessions={sortedSessions}
            onImport={importChargingSessions}
            vehicleSettings={vehicleSettings}
            onVehicleSettingsChange={setVehicleSettings}
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
        vehicleSettings={vehicleSettings}
      />

      <SessionDetailSheet
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default HomePage;
