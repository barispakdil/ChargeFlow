interface TabPlaceholderProps {
  type: "analysis" | "more";
}

function TabPlaceholder({ type }: TabPlaceholderProps) {
  const isAnalysis = type === "analysis";

  return (
    <section className="tab-placeholder">
      <span className="tab-placeholder-icon">
        {isAnalysis ? "◫" : "•••"}
      </span>
      <strong>{isAnalysis ? "Analiz" : "Diğer"}</strong>
      <small>
        {isAnalysis
          ? "Sıcaklık, lastik, hız ve AC/DC karşılaştırmaları burada yer alacak."
          : "Harita, araç, ayarlar, yedekleme ve dışa aktarma burada yer alacak."}
      </small>
    </section>
  );
}

export default TabPlaceholder;
