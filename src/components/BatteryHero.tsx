import type { ChargingSession } from "../types/ChargingSession";
import { formatSessionDate } from "../utils/date";

interface BatteryHeroProps {
  session?: ChargingSession;
}

function BatteryHero({ session }: BatteryHeroProps) {
  if (!session) {
    return null;
  }

  return (
    <section className="battery-hero">
      <div className="battery-visual">
        <div className="battery-body">
          <div
            className="battery-level"
            style={{
              width: `${session.endBattery}%`,
            }}
          />
          <div className="battery-glow" />
        </div>

        <div className="battery-tip" />
      </div>

      <div className="battery-copy">
        <strong>{session.endBattery}%</strong>
        <span>Son Şarj Bitiş</span>
        <small>
          {formatSessionDate(session)} {session.time}
        </small>
      </div>
    </section>
  );
}

export default BatteryHero;
