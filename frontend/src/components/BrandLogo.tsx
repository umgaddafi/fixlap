import React from 'react';

interface BrandLogoProps {
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  imgSize?: number;
}

export default function BrandLogo({
  dark = false,
  size = 'md',
  showTagline = true,
  className = '',
  imgSize,
}: BrandLogoProps) {
  const actualImgSize = imgSize || (size === 'sm' ? 28 : size === 'lg' ? 44 : 38);
  const fontSize = size === 'sm' ? 15 : size === 'lg' ? 22 : 18;
  const taglineSize = size === 'sm' ? 7 : size === 'lg' ? 9.5 : 8;

  return (
    <div
      className={`brand-lockup brand-size-${size} ${dark ? 'brand-dark' : ''} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
    >
      <img
        className="brand-logo-img"
        src="/images/kendat-fixlap-emblem.png"
        alt="Kendat FixLap Logo"
        style={{
          width: actualImgSize,
          height: actualImgSize,
          borderRadius: Math.round(actualImgSize * 0.26),
          objectFit: 'contain',
        }}
      />
      <span
        className="brand-lockup-text"
        style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}
      >
        <span
          className="brand-name-row"
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
            fontSize,
            fontWeight: 900,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          <span className="brand-part-kendat" style={{ color: dark ? '#ffffff' : '#0f3560' }}>
            KENDAT
          </span>
          <span className="brand-part-fixlap" style={{ color: '#e96319' }}>
            FIXLAP
          </span>
        </span>
        {showTagline && (
          <span
            className="brand-tagline-row"
            style={{
              display: 'block',
              fontSize: taglineSize,
              fontWeight: 800,
              color: dark ? '#94a3b8' : '#696b6c',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginTop: 2,
              lineHeight: 1,
            }}
          >
            DEVICE REPAIRS
          </span>
        )}
      </span>
    </div>
  );
}
