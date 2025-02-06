export const OrosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 400"
    width="33"
    height="33"
    aria-labelledby="orosTitle orosDesc"
    role="img"
    className="w-10 h-10 flex-shrink-0"
  >
    <title id="orosTitle">Oros Logo (No Filters)</title>
    <desc id="orosDesc">
      A simplified version of the Oros logo without filter effects, for
      performance-critical situations.
    </desc>

    <defs>
      <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#C8C8C8', stopOpacity: 1 }} />
        <stop offset="30%" style={{ stopColor: '#B8B8B8', stopOpacity: 1 }} />
        <stop offset="70%" style={{ stopColor: '#A8A8A8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#989898', stopOpacity: 1 }} />
      </linearGradient>

      <linearGradient id="metallicDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#A0A0A0', stopOpacity: 1 }} />
        <stop offset="30%" style={{ stopColor: '#929292', stopOpacity: 1 }} />
        <stop offset="70%" style={{ stopColor: '#868686', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#7A7A7A', stopOpacity: 1 }} />
      </linearGradient>

      <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFF3D4', stopOpacity: 0.4 }} />
        <stop offset="45%" style={{ stopColor: '#FFE5A3', stopOpacity: 0.2 }} />
        <stop
          offset="100%"
          style={{ stopColor: '#FFD770', stopOpacity: 0.1 }}
        />
      </linearGradient>
    </defs>

    <g transform="translate(200, 200) rotate(-30) scale(0.8)">
      <ellipse
        cx="0"
        cy="0"
        rx="150"
        ry="120"
        fill="none"
        stroke="url(#metallic)"
        strokeWidth="40"
        strokeLinecap="round"
        transform="rotate(15)"
      />

      <path
        d="M 130,-100 A 160,130 0 0,1 170,-55"
        fill="url(#metallicDark)"
        stroke="url(#goldAccent)"
        strokeWidth="2"
        style={{ mixBlendMode: 'soft-light' }}
      />
    </g>
  </svg>
);
