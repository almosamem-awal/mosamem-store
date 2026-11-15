import React from 'react';
import { getContrastTextColor } from '../utils/theme';

export interface WheelSliceSpec {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_TEMU_JUMIA_SLICES: WheelSliceSpec[] = [
  { id: 's1', label: '50 ر.س', color: '#059669' },
  { id: 's2', label: 'خصم 30%', color: '#FACC15' },
  { id: 's3', label: 'شحن مجاني', color: '#FF6B00' },
  { id: 's4', label: '100 ر.س', color: '#FFFFFF' },
  { id: 's5', label: 'خصم 15%', color: '#059669' },
  { id: 's6', label: 'هدية خاصة', color: '#FACC15' },
];

interface SpinWheelVisualProps {
  slices: WheelSliceSpec[];
  rotation?: number;
  spinning?: boolean;
  size?: 'hero' | 'modal';
  onCenterClick?: () => void;
  disabled?: boolean;
}

const RIM_BULBS = Array.from({ length: 16 }, (_, i) => i * (360 / 16));

export const SpinWheelVisual: React.FC<SpinWheelVisualProps> = ({
  slices,
  rotation = 0,
  spinning = false,
  size = 'modal',
  onCenterClick,
  disabled = false,
}) => {
  const activeSlices = slices.length >= 2 ? slices : DEFAULT_TEMU_JUMIA_SLICES;
  const sliceAngle = 360 / activeSlices.length;

  const conicStops = activeSlices
    .map((slice, idx) => {
      const start = (idx * 100) / activeSlices.length;
      const end = ((idx + 1) * 100) / activeSlices.length;
      return `${slice.color} ${start}% ${end}%`;
    })
    .join(', ');

  const outerDim =
    size === 'hero'
      ? 'w-64 h-64 sm:w-72 sm:h-72'
      : 'w-72 h-72 sm:w-80 sm:h-80';
  const centerBtnDim =
    size === 'hero' ? 'w-20 h-20 text-xs' : 'w-24 h-24 text-sm';

  return (
    <div className={`relative ${outerDim} flex items-center justify-center select-none`}>
      {/* Luxury Diamond / Ruby Top Pointer Needle */}
      <div
        aria-hidden="true"
        className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#B45309] p-1 flex items-center justify-center border-2 border-white shadow-md">
          <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-[#00FF87] to-[#059669] border border-white/90 rounded-[2px]" />
        </div>
        <div className="w-0 h-0 -mt-1.5 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[24px] border-t-[#B45309]" />
      </div>

      {/* Golden Metallic Outer Bezel Ring with Decorative Glowing Bulbs */}
      <div className="w-full h-full rounded-full p-3.5 sm:p-4 bg-gradient-to-br from-[#FDE047] via-[#D97706] to-[#78350F] shadow-[0_18px_50px_rgba(0,0,0,0.45)] relative flex items-center justify-center ring-4 ring-amber-200/60">
        {RIM_BULBS.map((deg, idx) => (
          <div
            key={deg}
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <span
              className={`block mx-auto mt-1 sm:mt-1.5 w-2.5 h-2.5 rounded-full animate-wheel-bulb ${
                idx % 2 === 0
                  ? 'bg-white shadow-[0_0_8px_#FFFFFF]'
                  : 'bg-[#00FF87] shadow-[0_0_8px_#00FF87]'
              }`}
              style={{ animationDelay: `${(idx % 2) * 0.55}s` }}
            />
          </div>
        ))}

        {/* Rotating Inner Prize Disc */}
        <div
          className="w-full h-full rounded-full border-4 border-[#FEF08A] relative overflow-hidden shadow-inner"
          style={{
            background: `conic-gradient(${conicStops})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 4.2s cubic-bezier(0.15, 0.9, 0.25, 1)'
              : 'transform 0.6s ease-out',
          }}
        >
          {/* Crisp metallic divider spokes */}
          {activeSlices.map((_, idx) => (
            <div
              key={`spoke-${idx}`}
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 pointer-events-none"
              style={{ transform: `rotate(${idx * sliceAngle}deg)` }}
            >
              <div className="w-full h-1/2 bg-white/55" />
            </div>
          ))}

          {/* HUGE BOLD TYPOGRAPHY per slice */}
          {activeSlices.map((slice, idx) => {
            const angle = idx * sliceAngle + sliceAngle / 2;
            const fg = getContrastTextColor(slice.color);
            const isLightSlice = fg === '#0F172A';
            const isBottomHalf = angle > 90 && angle < 270;

            return (
              <div
                key={slice.id}
                className="absolute inset-0 flex flex-col items-center justify-start pt-4 sm:pt-5 pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span
                  className={`font-display font-black leading-[1.35] text-center px-1 ${
                    size === 'hero'
                      ? 'text-[12px] sm:text-[13px] max-w-[74px]'
                      : 'text-[13px] sm:text-[15px] max-w-[88px]'
                  }`}
                  style={{
                    color: fg,
                    transform: isBottomHalf ? 'rotate(180deg)' : undefined,
                    textShadow: isLightSlice
                      ? '0 1px 0 rgba(255,255,255,0.65)'
                      : '0 2px 6px rgba(0,0,0,0.65)',
                  }}
                >
                  {slice.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Large Pulsing Center Action Button: العب واكسب 🎡 */}
        {onCenterClick ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onCenterClick}
            aria-label="العب واكسب"
            className={`absolute ${centerBtnDim} rounded-full bg-gradient-to-b from-white via-amber-50 to-amber-100 border-4 border-[#F59E0B] shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center z-20 transition-transform hover:scale-110 active:scale-95 disabled:opacity-75 cursor-pointer`}
          >
            <span className="font-display font-black text-[#1E293B] leading-tight">
              {spinning ? 'تدور...' : 'العب'}
            </span>
            <span
              className="font-display font-extrabold text-[11px] leading-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              {spinning ? '⚡' : 'واكسب 🎡'}
            </span>
          </button>
        ) : (
          <div
            className={`absolute ${centerBtnDim} rounded-full bg-gradient-to-b from-white via-amber-50 to-amber-100 border-4 border-[#F59E0B] shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center z-20`}
          >
            <span className="font-display font-black text-[#1E293B] leading-tight">العب</span>
            <span
              className="font-display font-extrabold text-[11px] leading-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              واكسب 🎡
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
