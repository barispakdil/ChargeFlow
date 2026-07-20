interface ChargeFlowLogoProps {
  compact?: boolean;
}

function ChargeFlowLogo({
  compact = false,
}: ChargeFlowLogoProps) {
  return (
    <div
      className={`chargeflow-logo ${
        compact ? "chargeflow-logo-compact" : ""
      }`}
      aria-label="ChargeFlow"
    >
      <svg
        className="chargeflow-logo-mark"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="chargeflow-ring-gradient"
            x1="7"
            y1="7"
            x2="40"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#35D9FF" />
            <stop offset="1" stopColor="#0877FF" />
          </linearGradient>

          <linearGradient
            id="chargeflow-bolt-gradient"
            x1="22"
            y1="10"
            x2="31"
            y2="39"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#B9FF5A" />
            <stop offset="1" stopColor="#46F2C2" />
          </linearGradient>

          <filter
            id="chargeflow-logo-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="chargeflow-logo-ring"
          d="M38.5 15.2A17 17 0 1 0 39.7 31"
          fill="none"
          stroke="url(#chargeflow-ring-gradient)"
          strokeWidth="6.2"
          strokeLinecap="round"
        />

        <path
          className="chargeflow-logo-flow"
          d="M9 25.5C12.2 18 18 14 25.4 14"
          fill="none"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          className="chargeflow-logo-bolt"
          d="M27.2 8.5 18.6 25h7.1l-4.4 14.5L35 20.2h-7.7l-.1-11.7Z"
          fill="url(#chargeflow-bolt-gradient)"
          filter="url(#chargeflow-logo-glow)"
        />
      </svg>

      <span className="chargeflow-wordmark">
        Charge<span>Flow</span>
      </span>
    </div>
  );
}

export default ChargeFlowLogo;
