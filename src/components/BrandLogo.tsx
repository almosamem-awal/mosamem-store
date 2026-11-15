import React, { useEffect, useState } from 'react';

interface BrandLogoProps {
  variant?: 'monogram' | 'lockup-dark' | 'lockup-light';
  logoUrl?: string;
  className?: string;
}

export const BrandMonogramSvg: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="cyberRibbon" x1="8" y1="54" x2="56" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#047857" />
        <stop offset="55%" stopColor="#059669" />
        <stop offset="100%" stopColor="#00FF87" />
      </linearGradient>
    </defs>
    {/* Aerodynamic dynamic ribbon forming Arabic 'م' surging 45 degrees into arrow '1' */}
    <path
      d="M12 48 C12 36, 20 30, 28 30 C35 30, 38 35, 34 40 C30 45, 22 41, 24 33 C26 24, 38 18, 49 11"
      stroke="url(#cyberRibbon)"
      strokeWidth="6.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 12 L52 9 L49 25"
      stroke="#059669"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M42 29 L42 42 C42 46, 36 48, 32 45"
      stroke="#047857"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

export const BrandMark: React.FC<{ logoUrl?: string; className?: string }> = ({
  logoUrl,
  className = 'w-9 h-9',
}) => {
  const [imgError, setImgError] = useState(false);
  const customLogo = logoUrl?.trim() || '';
  const src = customLogo || '/assets/brand/almosamem-mark.png';

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  if (!imgError) {
    return (
      <img
        src={src}
        alt="شعار المصمم الأول"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={
          customLogo
            ? `${className} rounded-lg object-contain bg-white border border-slate-100 p-0.5`
            : `${className} object-contain select-none`
        }
      />
    );
  }

  return <BrandMonogramSvg className={className} />;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'monogram',
  logoUrl,
  className = '',
}) => {
  if (variant === 'monogram') {
    return <BrandMark logoUrl={logoUrl} className={className || 'w-8 h-8'} />;
  }

  const isDark = variant === 'lockup-dark';
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BrandMark logoUrl={logoUrl} className="w-11 h-11 shrink-0" />
      <div className="flex flex-col leading-tight">
        <span
          className={`font-display text-xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-[#1E293B]'
          }`}
        >
          المصمم الأول
        </span>
        <span
          className={`text-[11px] font-mono tracking-[0.16em] uppercase ${
            isDark ? 'text-[#00FF87]' : 'text-[#059669]'
          }`}
          style={!isDark ? { color: 'var(--color-primary)' } : undefined}
        >
          AL-MOSAMEM AL-AWWAL - RIYADH
        </span>
      </div>
    </div>
  );
};
