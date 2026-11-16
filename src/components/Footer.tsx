import React from 'react';
import { ShieldCheck, Sparkles, Truck, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  logoUrl?: string;
  onOpenPolicy: () => void;
  onOpenWheel: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  logoUrl,
  onOpenPolicy,
  onOpenWheel,
}) => {
  return (
    <footer className="bg-[#0B0F19] text-white mt-6 border-t border-slate-800/80">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-right">
            <BrandLogo variant="lockup-dark" logoUrl={logoUrl} />
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              متجر المصمم الأول — وجهتكم الفاخرة في الرياض لإكسسوارات الجوال، الألعاب التعليمية الذكية STEM، والهدايا التنفيذية.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
            <button
              type="button"
              onClick={onOpenPolicy}
              className="inline-flex items-center gap-1.5 hover:text-[#00FF87] font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FF87]" />
              <span>سياسة الاسترجاع والضمان</span>
            </button>

            <button
              type="button"
              onClick={onOpenWheel}
              className="inline-flex items-center gap-1.5 hover:text-[#00FF87] font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>عجلة الحظ والجوائز</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#00FF87]" />
              <span>توصيل فوري داخل الرياض</span>
            </span>

            <span className="font-mono text-[#00FF87] font-semibold">
              almosamem.com.sa · الرياض
            </span>
          </div>
        </div>

        {/* Bottom Copyright & Safeer Marketing Attribution */}
        <div className="pt-5 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} متجر المصمم الأول (Al-Mosamem Al-Awwal). جميع الحقوق محفوظة.
          </div>

          <a
            href="https://safeer-marketing.great-site.net"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-[#00FF87] transition-colors group"
          >
            <span>الموقع من تصميم شركة سفير للتسويق</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#FF6B00] transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
};
