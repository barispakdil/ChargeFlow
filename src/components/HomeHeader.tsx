import ChargeFlowLogo from "./ChargeFlowLogo";

interface HomeHeaderProps {
  showAddButton: boolean;
  onAdd: () => void;
}

function HomeHeader({
  showAddButton,
  onAdd,
}: HomeHeaderProps) {
  return (
    <header className="home-header">
      <ChargeFlowLogo />

      {showAddButton && (
        <button
          className="icon-add-button"
          type="button"
          aria-label="Yeni şarj ekle"
          onClick={onAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
    </header>
  );
}

export default HomeHeader;
