import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { ChargingSession } from "../types/ChargingSession";
import {
  getDayDifference,
  getSessionDate,
  MONTHS,
} from "../utils/date";

interface SessionCardProps {
  session: ChargingSession;
  previousSession?: ChargingSession;
  onOpen: (session: ChargingSession) => void;
  onDelete: (sessionId: number) => void;
}

const REVEAL_DISTANCE = 88;
const REVEAL_THRESHOLD = 34;
const QUICK_DELETE_THRESHOLD = 165;
const MAX_SWIPE_DISTANCE = 220;

function SessionCard({
  session,
  previousSession,
  onOpen,
  onDelete,
}: SessionCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerStart = useRef({ x: 0, y: 0 });
  const gestureDirection = useRef<"pending" | "horizontal" | "vertical">(
    "pending",
  );
  const didSwipe = useRef(false);

  const distance = previousSession
    ? Math.max(0, session.odometer - previousSession.odometer)
    : 0;

  const dayDifference = previousSession
    ? getDayDifference(session, previousSession)
    : 0;

  const consumption =
    distance > 0 ? (session.energy / distance) * 100 : 0;

  const dailyAverage =
    dayDifference > 0 ? Math.round(distance / dayDifference) : 0;

  const sessionDate = getSessionDate(session);

  const startPercent = Math.min(
    100,
    Math.max(0, session.startBattery),
  );
  const endPercent = Math.min(
    100,
    Math.max(0, session.endBattery),
  );
  const chargeRangeStart = Math.min(startPercent, endPercent);
  const chargeRangeWidth = Math.abs(endPercent - startPercent);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(session);
    }
  }

  function handlePointerDown(
    event: PointerEvent<HTMLElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
    };
    gestureDirection.current = "pending";
    didSwipe.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(
    event: PointerEvent<HTMLElement>,
  ) {
    if (!isDragging) return;

    const deltaX =
      event.clientX - pointerStart.current.x + (
        swipeOffset === -REVEAL_DISTANCE ? -REVEAL_DISTANCE : 0
      );
    const deltaY = event.clientY - pointerStart.current.y;

    if (gestureDirection.current === "pending") {
      if (Math.abs(deltaX) < 7 && Math.abs(deltaY) < 7) {
        return;
      }

      gestureDirection.current =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? "horizontal"
          : "vertical";
    }

    if (gestureDirection.current === "vertical") {
      return;
    }

    didSwipe.current = Math.abs(deltaX) > 8;

    const nextOffset = Math.max(
      -MAX_SWIPE_DISTANCE,
      Math.min(0, deltaX),
    );

    setSwipeOffset(nextOffset);
  }

  function finishSwipe() {
    if (!isDragging) return;

    setIsDragging(false);

    if (
      gestureDirection.current === "horizontal" &&
      swipeOffset <= -QUICK_DELETE_THRESHOLD
    ) {
      /*
       * Uzun sola çekme: kullanıcı bilerek hızlı silme hareketi
       * yaptığı için onay sormadan silinir.
       */
      onDelete(session.id);
      return;
    }

    if (
      gestureDirection.current === "horizontal" &&
      swipeOffset <= -REVEAL_THRESHOLD
    ) {
      /*
       * Kısa sola çekme: kırmızı çöp kutusu açık kalır.
       */
      setSwipeOffset(-REVEAL_DISTANCE);
      return;
    }

    setSwipeOffset(0);
  }

  function handleOpen() {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }

    if (swipeOffset !== 0) {
      setSwipeOffset(0);
      return;
    }

    onOpen(session);
  }

  function handleDeleteButton() {
    onDelete(session.id);
  }

  return (
    <div
      className={`swipe-session-shell ${
        swipeOffset <= -QUICK_DELETE_THRESHOLD
          ? "delete-ready"
          : swipeOffset < 0
            ? "delete-revealed"
            : ""
      }`}
    >
      <button
        type="button"
        className="swipe-delete-backdrop"
        onClick={handleDeleteButton}
        aria-label={`${session.date} tarihli şarj kaydını sil`}
      >
        <span aria-hidden="true">🗑</span>
        <strong>Sil</strong>
      </button>

      <article
        className={`compact-session-card swipe-session-card ${
          isDragging ? "is-dragging" : ""
        }`}
        role="button"
        tabIndex={0}
        aria-label={`${session.date} tarihli şarj detaylarını aç`}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <span className="session-accent" aria-hidden="true" />

        <div className="session-date-block">
          <strong>
            {String(sessionDate.getDate()).padStart(2, "0")}
          </strong>
          <span>{MONTHS[sessionDate.getMonth()]}</span>
          <small>{sessionDate.getFullYear()}</small>
        </div>

        <div className="session-main">
          <div className="session-percentage-row">
            <strong>{session.startBattery}%</strong>

            <div
              className="session-range-progress"
              role="img"
              aria-label={`Şarj aralığı yüzde ${startPercent} ile yüzde ${endPercent}`}
            >
              <div className="session-range-track">
                <div
                  className="session-range-active"
                  style={{
                    left: `${chargeRangeStart}%`,
                    width: `${chargeRangeWidth}%`,
                  }}
                />
                <span
                  className="session-range-marker session-range-marker-start"
                  style={{ left: `${startPercent}%` }}
                  aria-hidden="true"
                />
                <span
                  className="session-range-marker session-range-marker-end"
                  style={{ left: `${endPercent}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>

            <strong>{session.endBattery}%</strong>
          </div>

          <div className="session-energy">
            <span>⚡</span>
            <strong>{session.energy} kWh</strong>
          </div>
        </div>

        <div className="session-analysis">
          <span>🚘 {distance.toLocaleString("tr-TR")} km</span>
          <span>
            ⚡{" "}
            {consumption.toLocaleString("tr-TR", {
              maximumFractionDigits: 1,
            })}{" "}
            kWh/100 km
          </span>
          <span>▣ {dayDifference} gün</span>
          <span>
            ◴ {dailyAverage.toLocaleString("tr-TR")} km/gün
          </span>
        </div>

        <span className="session-open-button" aria-hidden="true">
          ›
        </span>
      </article>
    </div>
  );
}

export default SessionCard;
