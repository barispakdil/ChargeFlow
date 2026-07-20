import { useState } from "react";
import AddChargeSheet from "../components/AddChargeSheet";
import BottomNavigation from "../components/BottomNavigation";
import HomeHeader from "../components/HomeHeader";
import MonthGroup from "../components/MonthGroup";
import SessionDetailSheet from "../components/SessionDetailSheet";
import StatisticsView from "../components/StatisticsView";
import TabPlaceholder from "../components/TabPlaceholder";
import { useChargingSessions } from "../hooks/useChargingSessions";
import type { ChargingSession } from "../types/ChargingSession";
import type { ActiveTab } from "../types/navigation";

function HomePage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ChargingSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  const {
    sortedSessions,
    latestSession,
    groupedMonths,
    statisticsSummary,
    addChargingSession,
    updateChargingSession,
    deleteChargingSession,
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
            months={groupedMonths}
          />
        )}

        {activeTab === "analysis" && (
          <TabPlaceholder type="analysis" />
        )}

        {activeTab === "more" && <TabPlaceholder type="more" />}
      </section>

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />

      <AddChargeSheet
        isOpen={isAddSheetOpen}
        lastSession={latestSession}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={handleSave}
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
