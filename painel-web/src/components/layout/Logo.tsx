interface LogoProps {
  tamanho?: number
}

/** Símbolo do UBSTrack: um pino de localização com a linha de pulso da saúde. Igual nos dois apps. */
export function Logo({ tamanho = 40 }: LogoProps) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="UBSTrack"
    >
      <defs>
        <linearGradient id="ubs-marca" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b6cf5" />
          <stop offset="1" stopColor="#0f9d8c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#ubs-marca)" />
      <path
        d="M20 8.5c-4.7 0-8.5 3.6-8.5 8.2 0 5.6 6.2 11.2 7.6 12.4.5.4 1.2.4 1.8 0 1.4-1.2 7.6-6.8 7.6-12.4 0-4.6-3.8-8.2-8.5-8.2Z"
        fill="#fff"
        fillOpacity="0.2"
      />
      <path
        d="M13 17.5h4l1.8-4.2 2.9 8.2 1.9-4h3.4"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
