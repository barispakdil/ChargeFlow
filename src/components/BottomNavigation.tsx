import type { ActiveTab } from "../types/navigation";

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

const NAVIGATION_ITEMS: {
  id: ActiveTab;
  icon: string;
  label: string;
}[] = [
  { id: "home", icon: "⌂", label: "Ana Sayfa" },
  { id: "statistics", icon: "⌁", label: "İstatistikler" },
  { id: "analysis", icon: "◫", label: "Analiz" },
  { id: "more", icon: "•••", label: "Diğer" },
];

function BottomNavigation({
  activeTab,
  onChange,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-navigation" aria-label="Ana navigasyon">
      {NAVIGATION_ITEMS.map((item) => (
        <button
          className={`bottom-navigation-item ${
            activeTab === item.id ? "active" : ""
          }`}
          type="button"
          onClick={() => onChange(item.id)}
          key={item.id}
        >
          <span className="bottom-navigation-icon">{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export default BottomNavigation;
