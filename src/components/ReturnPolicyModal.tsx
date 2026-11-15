import React, { useState } from 'react';
import { X, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import type { MarketingSeoSettings, ReturnPolicySettings } from '../types/store';
import { sendStoreManagerNotification } from '../lib/api';

interface ReturnPolicyModalProps {
  isOpen: boolean;
  policy: ReturnPolicySettings;
  seoSettings: MarketingSeoSettings;
  onClose: () => void;
}

export const ReturnPolicyModal: React.FC<ReturnPolicyModalProps> = ({
  isOpen,
  policy,
  seoSettings,
  onClose,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !customerEmail.trim() || !reason.trim()) return;
    setSending(true);
    await sendStoreManagerNotification({
      type: 'refund_request',
      subject: `طلب استرجاع / استبدال — ${orderNumber}`,
      message: `رقم الطلب: ${orderNumber}\nبريد العميل: ${customerEmail}\nالسبب: ${reason}`,
      orderNumber,
      customerEmail,
      seoSettings,
    });
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="سياسة الاسترجاع والاستبدال"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-start justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden shadow-2xl">
        <div className="bg-[#0B0F19] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#00FF87]" />
            <div>
              <h2 className="font-display text-lg font-bold">{policy.titleAr}</h2>
              <p className="text-xs text-slate-400 font-mono">آخر تحديث: {policy.updatedAt}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق سياسة الاسترجاع"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {policy.contentAr}
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="font-display text-base font-bold text-[#0B0F19]">
              رفع طلب استرجاع أو استبدال فوري
            </h3>

            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <span>
                  تم استلام طلب الاسترجاع للطلب <strong className="font-mono">{orderNumber}</strong> وسيتم التواصل معك من فريق الرياض خلال ساعات.
                </span>
              </div>
            ) : (
              <form onSubmit={handleRefundSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ref-ord" className="block text-xs font-semibold text-slate-700 mb-1">
                      رقم الطلب
                    </label>
                    <input
                      id="ref-ord"
                      type="text"
                      required
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="AM-10421"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="ref-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="ref-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ref-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                    سبب الاسترجاع أو الاستبدال
                  </label>
                  <textarea
                    id="ref-reason"
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="اذكر تفاصيل المنتج والملاحظة..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white text-xs font-bold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'جاري الإرسال...' : 'إرسال طلب الاسترجاع للإدارة'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
