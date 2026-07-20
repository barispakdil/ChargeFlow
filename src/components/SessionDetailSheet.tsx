import { useEffect, useMemo, useState } from "react";
import type {
  ChargingSession,
  ChargingType,
} from "../types/ChargingSession";

type EditableKey = Exclude<keyof ChargingSession, "id">;
type FieldKind = "text" | "number" | "date" | "time" | "select" | "textarea";
type FieldSection = "GENERAL" | "CHARGE" | "COST" | "VEHICLE" | "EXTRA";

interface FieldDefinition {
  key: EditableKey;
  label: string;
  icon: string;
  kind: FieldKind;
  section: FieldSection;
  unit?: string;
  step?: string;
  min?: string;
  max?: string;
  options?: string[];
}

const SECTION_LABELS: Record<FieldSection, string> = {
  GENERAL: "GENEL",
  CHARGE: "ŞARJ",
  COST: "MALİYET",
  VEHICLE: "ARAÇ",
  EXTRA: "EK BİLGİLER",
};

const SECTION_ORDER: FieldSection[] = [
  "GENERAL",
  "CHARGE",
  "COST",
  "VEHICLE",
  "EXTRA",
];

const FIELDS: FieldDefinition[] = [
  { key: "date", label: "Tarih", icon: "▣", kind: "date", section: "GENERAL" },
  { key: "time", label: "Saat", icon: "◴", kind: "time", section: "GENERAL" },
  { key: "startBattery", label: "Başlangıç", icon: "↘", kind: "number", section: "CHARGE", unit: "%", min: "0", max: "100" },
  { key: "endBattery", label: "Bitiş", icon: "↗", kind: "number", section: "CHARGE", unit: "%", min: "0", max: "100" },
  { key: "energy", label: "Eklenen enerji", icon: "⚡", kind: "number", section: "CHARGE", unit: "kWh", min: "0", step: "0.01" },
  { key: "chargingType", label: "Şarj tipi", icon: "ϟ", kind: "select", section: "CHARGE", options: ["", "AC", "DC"] },
  { key: "pricePerKwh", label: "kWh fiyatı", icon: "₺", kind: "number", section: "COST", unit: "TL/kWh", min: "0", step: "0.01" },
  { key: "cost", label: "Toplam tutar", icon: "₺", kind: "number", section: "COST", unit: "TL", min: "0", step: "0.01" },
  { key: "odometer", label: "Kilometre", icon: "🚘", kind: "number", section: "VEHICLE", unit: "km", min: "0", step: "1" },
  { key: "location", label: "Konum", icon: "⌖", kind: "text", section: "VEHICLE" },
  { key: "temperature", label: "Hava sıcaklığı", icon: "°", kind: "number", section: "EXTRA", unit: "°C", step: "0.1" },
  { key: "tireType", label: "Lastik türü", icon: "◉", kind: "text", section: "EXTRA" },
  { key: "averageSpeed", label: "Ortalama hız", icon: "⌁", kind: "number", section: "EXTRA", unit: "km/sa", min: "0", step: "0.1" },
  { key: "notes", label: "Notlar", icon: "≡", kind: "textarea", section: "EXTRA" },
];

interface SessionDetailSheetProps {
  session: ChargingSession | null;
  onClose: () => void;
  onUpdate: (session: ChargingSession) => void;
  onDelete: (sessionId: number) => void;
}

function displayValue(session: ChargingSession, field: FieldDefinition) {
  const value = session[field.key];
  if (value === undefined || value === "") return "Eklenmedi";
  if (field.key === "date") {
    return new Intl.DateTimeFormat("tr-TR").format(new Date(`${String(value)}T12:00:00`));
  }
  if (typeof value === "number") {
    return `${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}${field.unit ? ` ${field.unit}` : ""}`;
  }
  return String(value);
}

function SessionDetailSheet({ session, onClose, onUpdate, onDelete }: SessionDetailSheetProps) {
  const [draft, setDraft] = useState<ChargingSession | null>(session);
  const [editingKey, setEditingKey] = useState<EditableKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setDraft(session);
    setEditingKey(null);
    setError("");
    setIsDeleteConfirmOpen(false);
  }, [session]);

  const headerDate = useMemo(() => {
    if (!draft) return "";
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${draft.date}T12:00:00`));
  }, [draft]);

  if (!draft) return null;

  function startEditing(field: FieldDefinition) {
    setEditingKey(field.key);
    setEditValue(String(draft?.[field.key] ?? ""));
    setError("");
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditValue("");
    setError("");
  }

  function saveField(field: FieldDefinition) {
    if (!draft) return;
    let nextValue: ChargingSession[EditableKey];

    if (field.kind === "number") {
      if (editValue.trim() === "") {
        if (["temperature", "averageSpeed"].includes(field.key)) nextValue = undefined;
        else { setError("Bu alan boş bırakılamaz."); return; }
      } else {
        const parsed = Number(editValue.replace(",", "."));
        if (!Number.isFinite(parsed)) { setError("Geçerli bir sayı girin."); return; }
        nextValue = parsed;
      }
    } else if (field.key === "chargingType") {
      nextValue = (editValue || undefined) as ChargingType | undefined;
    } else {
      const trimmedValue = editValue.trim();
      if (["date", "time", "location"].includes(field.key) && !trimmedValue) {
        setError("Bu alan boş bırakılamaz."); return;
      }
      nextValue = trimmedValue || undefined;
    }

    const nextDraft = { ...draft, [field.key]: nextValue } as ChargingSession;
    if (nextDraft.startBattery < 0 || nextDraft.startBattery > 100 || nextDraft.endBattery < 0 || nextDraft.endBattery > 100) {
      setError("Batarya yüzdesi 0 ile 100 arasında olmalıdır."); return;
    }
    if (nextDraft.endBattery <= nextDraft.startBattery) {
      setError("Bitiş yüzdesi başlangıç yüzdesinden yüksek olmalıdır."); return;
    }
    if (nextDraft.energy <= 0) { setError("Eklenen enerji 0'dan büyük olmalıdır."); return; }
    if (nextDraft.odometer < 0 || nextDraft.pricePerKwh < 0 || nextDraft.cost < 0) {
      setError("Kilometre, fiyat ve tutar negatif olamaz."); return;
    }
    if (field.key === "energy" || field.key === "pricePerKwh") {
      nextDraft.cost = Number((nextDraft.energy * nextDraft.pricePerKwh).toFixed(2));
    }

    setDraft(nextDraft);
    onUpdate(nextDraft);
    cancelEditing();
  }

  function handleDelete() {
    if (!draft) return;
    onDelete(draft.id);
    onClose();
  }

  function renderField(field: FieldDefinition) {
    if (!draft) return null;

    const isEditing = editingKey === field.key;
    return (
      <div className={`detail-field ${isEditing ? "is-editing" : ""}`} key={field.key}>
        {isEditing ? (
          <div className="detail-field-editor">
            <div className="detail-editor-label">
              <span className="detail-field-icon">{field.icon}</span>
              <div><small>DÜZENLENİYOR</small><strong>{field.label}</strong></div>
            </div>

            {field.kind === "select" ? (
              <select autoFocus value={editValue} onChange={(event) => setEditValue(event.target.value)}>
                {field.options?.map((option) => <option value={option} key={option || "empty"}>{option || "Belirtilmedi"}</option>)}
              </select>
            ) : field.kind === "textarea" ? (
              <textarea autoFocus rows={4} value={editValue} onChange={(event) => setEditValue(event.target.value)} />
            ) : (
              <div className="detail-input-with-unit">
                <input
                  autoFocus
                  type={field.kind}
                  value={editValue}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(event) => setEditValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveField(field);
                    if (event.key === "Escape") cancelEditing();
                  }}
                />
                {field.unit && <span>{field.unit}</span>}
              </div>
            )}

            {error && <div className="detail-edit-error">{error}</div>}
            <div className="detail-editor-actions">
              <button type="button" onClick={cancelEditing}>İptal</button>
              <button className="detail-editor-save" type="button" onClick={() => saveField(field)}>Değişikliği Kaydet</button>
            </div>
          </div>
        ) : (
          <button className="detail-field-button" type="button" onClick={() => startEditing(field)}>
            <span className="detail-field-icon">{field.icon}</span>
            <span className="detail-field-copy"><small>{field.label}</small><strong>{displayValue(draft, field)}</strong></span>
            <span className="detail-field-chevron">›</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sheet-backdrop detail-backdrop" onMouseDown={onClose}>
      <section className="charge-sheet session-detail-sheet premium-detail-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="detail-topbar">
          <div><p className="eyebrow">ŞARJ DETAYI</p><h2>{headerDate}</h2><small>{draft.time} · {draft.location}</small></div>
          <button className="sheet-close-button" type="button" onClick={onClose} aria-label="Detayı kapat">×</button>
        </div>

        <section className="detail-hero-card">
          <div className="detail-battery-flow">
            <strong>{draft.startBattery}%</strong><span>⚡</span><div><i style={{ width: `${Math.max(6, draft.endBattery - draft.startBattery)}%` }} /></div><span>⚡</span><strong>{draft.endBattery}%</strong>
          </div>
          <div className="detail-hero-stats">
            <div><span>EKLENEN ENERJİ</span><strong>{draft.energy.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}<small> kWh</small></strong></div>
            <div><span>TOPLAM TUTAR</span><strong>{draft.cost.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}<small> TL</small></strong></div>
          </div>
        </section>

        <div className="detail-sections">
          {SECTION_ORDER.map((section) => (
            <section className="detail-section" key={section}>
              <h3>{SECTION_LABELS[section]}</h3>
              <div className="detail-field-list">{FIELDS.filter((field) => field.section === section).map(renderField)}</div>
            </section>
          ))}
        </div>

        <div className="detail-danger-zone">
          {!isDeleteConfirmOpen ? (
            <button className="delete-session-button" type="button" onClick={() => setIsDeleteConfirmOpen(true)}>🗑 Kaydı Sil</button>
          ) : (
            <div className="delete-confirmation">
              <strong>Bu şarj kaydı silinsin mi?</strong><small>Bu işlem geri alınamaz.</small>
              <div><button type="button" onClick={() => setIsDeleteConfirmOpen(false)}>İptal</button><button className="confirm-delete-button" type="button" onClick={handleDelete}>Kalıcı Olarak Sil</button></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SessionDetailSheet;
