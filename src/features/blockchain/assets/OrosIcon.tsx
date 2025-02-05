import React from 'react';

const OrosIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="33"
      height="33"
      viewBox="0 0 33 33"
      aria-labelledby="orosTitle orosDesc"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="orosTitle">Oros Logo</title>
      <desc id="orosDesc">
        A stylized metallic ellipse with a partial metallic arc, representing
        Oros.
      </desc>

      <defs>
        <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: 'var(--color-metallic-1)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="30%"
            style={{
              stopColor: 'var(--color-metallic-2)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="70%"
            style={{
              stopColor: 'var(--color-metallic-1)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: 'var(--color-metallic-2)',
              stopOpacity: 1,
            }}
          />
        </linearGradient>

        <linearGradient id="metallicDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: 'var(--color-metallic-2)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="30%"
            style={{
              stopColor: 'var(--color-metallic-1)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="70%"
            style={{
              stopColor: 'var(--color-metallic-2)',
              stopOpacity: 1,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: 'var(--color-metallic-1)',
              stopOpacity: 1,
            }}
          />
        </linearGradient>

        <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: '#FFF3D4',
              stopOpacity: 0.4,
            }}
          />
          <stop
            offset="45%"
            style={{
              stopColor: '#FFE5A3',
              stopOpacity: 0.2,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: '#FFD770',
              stopOpacity: 0.1,
            }}
          />
        </linearGradient>

        <filter id="metallicFilter">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.15" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale="3"
            specularConstant="0.8"
            specularExponent="15"
            result="specular"
          >
            <fePointLight x="5" y="5" z="8" />
          </feSpecularLighting>
          <feComposite
            in="specular"
            in2="SourceAlpha"
            operator="in"
            result="specular2"
          />
          <feComposite
            in="SourceGraphic"
            in2="specular2"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
          />
        </filter>
      </defs>

      {/* Scale the transform group to fit the new viewBox */}
      <g transform="translate(16.5 16.5) rotate(-30) scale(0.066)">
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
          filter="url(#metallicFilter)"
        />
        <path
          d="M 130,-100 A 160,130 0 0,1 170,-55"
          fill="url(#metallicDark)"
          stroke="url(#goldAccent)"
          strokeWidth="2"
          filter="url(#metallicFilter)"
          style={{
            mixBlendMode: 'soft-light' as const,
          }}
        />
      </g>
    </svg>
  );
};

export default OrosIcon;
