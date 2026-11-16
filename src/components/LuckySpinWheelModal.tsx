import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Clock, ShoppingCart, Sparkles, Check } from 'lucide-react';
import type { Coupon } from '../types/store';
import { describeCouponConditionAr, formatFlashCountdown } from '../utils/commerce';
import { DEFAULT_TEMU_JUMIA_SLICES, SpinWheelVisual, type WheelSliceSpec } from './SpinWheelVisual';

interface LuckySpinWheelModalProps {
  isOpen: boolean;
  coupons: Coupon[];
  targetCouponId?: string;
  onClose: () => void;
  onApplyCouponCode: (code: string) => void;
  onAppliedAndProceed?: () => void;
}

const SLICE_PALETTE = ['#059669', '#FACC15', '#FF6B00', '#FFFFFF', '#059669', '#FACC15'];

export const LuckySpinWheelModal: React.FC<LuckySpinWheelModalProps> = ({
  isOpen,
  coupons,
  targetCouponId,
  onClose,
  onApplyCouponCode,
  onAppliedAndProceed,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonCoupon, setWonCoupon] = useState<Coupon | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [urgencySeconds, setUrgencySeconds] = useState(15 * 60);

  useEffect(() => {
    if (!wonCoupon) return;
    setUrgencySeconds(15 * 60);
    const timer = window.setInterval(() => {
      setUrgencySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [wonCoupon]);

  if (!isOpen) return null;

  const wheelCoupons = coupons.filter((c) => c.active && c.isWheelReward).slice(0, 6);
  const segments: Coupon[] =
    wheelCoupons.length >= 2
      ? wheelCoupons
      : [
          {
            id: 'fallback-spin50',
            code: 'SPIN50',
            discountType: 'fixed',
            value: 50,
            usageLimit: 100,
            usedCount: 0,
            expiresAt: '2027-12-31',
            active: true,
            isWheelReward: true,
            wheelLabel: '50 ر.س',
            wheelColor: '#059669',
          },
          {
            id: 'fallback-alm30',
            code: 'ALM30',
            discountType: 'percent',
            value: 30,
            usageLimit: 100,
            usedCount: 0,
            expiresAt: '2027-12-31',
            active: true,
            isWheelReward: true,
            wheelLabel: 'خصم 30%',
            wheelColor: '#FACC15',
          },
          {
            id: 'fallback-free',
            code: 'FREERUH',
            discountType: 'free_shipping',
            value: 25,
            usageLimit: 100,
            usedCount: 0,
            expiresAt: '2027-12-31',
            active: true,
            isWheelReward: true,
            wheelLabel: 'شحن مجاني',
            wheelColor: '#FF6B00',
          },
          {
            id: 'fallback-spin100',
            code: 'SPIN100',
            discountType: 'fixed',
            value: 100,
            usageLimit: 100,
            usedCount: 0,
            expiresAt: '2027-12-31',
            active: true,
            isWheelReward: true,
            wheelLabel: '100 ر.س',
            wheelColor: '#FFFFFF',
          },
        ];

  const visualSlices: WheelSliceSpec[] = segments.map((seg, idx) => ({
    id: seg.id,
    label: seg.wheelLabel || DEFAULT_TEMU_JUMIA_SLICES[idx % DEFAULT_TEMU_JUMIA_SLICES.length].label,
    color: seg.wheelColor || SLICE_PALETTE[idx % SLICE_PALETTE.length],
  }));

  const sliceAngle = 360 / segments.length;

  const triggerMassiveConfetti = () => {
    try {
      void confetti({
        particleCount: 130,
        spread: 95,
        origin: { y: 0.52 },
        colors: ['#059669', '#00FF87', '#FF6B00', '#FACC15', '#FFFFFF'],
      });
      window.setTimeout(() => {
        void confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.6 },
          colors: ['#059669', '#FACC15', '#FF6B00'],
        });
        void confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#00FF87', '#FACC15', '#FF6B00'],
        });
      }, 220);
    } catch {
      // ignore if headless canvas unavailable
    }
  };

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWonCoupon(null);
    setAppliedNotice(false);

    const riggedIdx =
      targetCouponId && targetCouponId.trim()
        ? segments.findIndex((seg) => seg.id === targetCouponId || seg.code === targetCouponId)
        : -1;
    const chosenIndex = riggedIdx >= 0 ? riggedIdx : Math.floor(Math.random() * segments.length);
    const chosen = segments[chosenIndex];
    const targetSliceCenter = chosenIndex * sliceAngle + sliceAngle / 2;
    const extraSpins = 360 * 6;
    const newRotation =
      rotation + extraSpins + (360 - (rotation % 360)) + (360 - targetSliceCenter);

    setRotation(newRotation);

    window.setTimeout(() => {
      setSpinning(false);
      setWonCoupon(chosen);
      triggerMassiveConfetti();
    }, 4200);
  };

  const handleInstantApply = async () => {
    if (!wonCoupon) return;
    try {
      await navigator.clipboard.writeText(wonCoupon.code);
    } catch {
      // clipboard fallback
    }
    onApplyCouponCode(wonCoupon.code);
    setAppliedNotice(true);
    window.setTimeout(() => {
      onAppliedAndProceed?.();
      onClose();
    }, 650);
  };

  const urgencyTime = formatFlashCountdown(urgencySeconds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عجلة الحظ الاحترافية"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !spinning) onClose();
      }}
    >
      <div className="bg-white text-[#1E293B] rounded-3xl border border-amber-300/70 w-full max-w-lg overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.5)]">
        {/* Bold Top Ribbon Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between gap-3"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary, #059669) 0%, #047857 55%, #0F172A 100%)',
          }}
        >
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FACC15] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الكل كسبان 100% — عروض المصمم الأول</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
              أدر عجلة الحظ واربح خصماً فورياً 🎡
            </h2>
          </div>
          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            aria-label="إغلاق عجلة الحظ"
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col items-center space-y-5 bg-gradient-to-b from-amber-50/50 via-white to-white">
          {/* Temu/Jumia Metallic Rim Wheel */}
          <div className="py-2">
            <SpinWheelVisual
              slices={visualSlices}
              rotation={rotation}
              spinning={spinning}
              disabled={spinning}
              size="modal"
              onCenterClick={handleSpin}
            />
          </div>

          {wonCoupon ? (
            <div
              data-testid="wheel-win-banner"
              className="w-full p-5 rounded-2xl bg-gradient-to-b from-emerald-50 via-white to-amber-50/70 border-2 border-amber-400 text-center space-y-3.5 shadow-lg"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00] text-white text-xs font-extrabold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مبارك لك الفوز 🎉</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-[#1E293B]">
                  ربحت {wonCoupon.wheelLabel || wonCoupon.code}!
                </h3>
                {wonCoupon.prizeMessageAr && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed bg-white/80 rounded-xl px-3 py-2 border border-amber-200">
                    {wonCoupon.prizeMessageAr}
                  </p>
                )}
                {wonCoupon.conditionType && wonCoupon.conditionType !== 'none' && (
                  <div className="text-[11px] font-semibold text-slate-600">
                    الشرط: {describeCouponConditionAr(wonCoupon)}
                  </div>
                )}
              </div>

              {/* Urgency Countdown */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-extrabold text-[#DC2626] tabular-nums">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  ينتهي الخصم خلال {urgencyTime.minutes}:{urgencyTime.seconds} دقيقة!
                </span>
              </div>

              {/* Coupon Code Pill Box */}
              <div className="flex items-center justify-center gap-3 bg-white border-2 border-dashed border-[#059669] rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-[#64748B]">كود الخصم:</span>
                <span
                  data-testid="won-coupon-code"
                  className="font-mono text-lg font-black tracking-wider text-[#059669]"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {wonCoupon.code}
                </span>
              </div>

              {/* 1-Click Action Button */}
              <button
                type="button"
                onClick={handleInstantApply}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-white font-extrabold text-sm sm:text-base shadow-lg hover:brightness-110 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: 'var(--color-primary-contrast, #FFFFFF)',
                }}
              >
                {appliedNotice ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>تم تطبيق الكود {wonCoupon.code} في سلتك!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>تطبيق الخصم في السلة فوراً 🛒</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={spinning}
              onClick={handleSpin}
              className="w-full py-4 px-6 rounded-xl text-white font-display font-black text-base shadow-lg hover:brightness-110 disabled:opacity-65 transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--color-secondary, #FF6B00)',
                color: 'var(--color-secondary-contrast, #FFFFFF)',
              }}
            >
              {spinning ? 'العجلة تدور... حظاً موفقاً! ✨' : 'العب واكسب الآن 🎡'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
