import { TrendingUp, TrendingDown, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const ICONS = {
  product: Package,
  value: TrendingUp,
  low: AlertTriangle,
  moves: ArrowDownToLine,
  in: ArrowDownToLine,
  out: ArrowUpFromLine,
};

export default function StatCard({ title, value, subtitle, icon = "product", tone = "default" }) {
  const Icon = ICONS[icon] || Package;
  const tones = {
    default: "bg-[#F8FAFC] border-[#E2E8F0]",
    blue: "bg-[#E6F0FA] border-[#E2E8F0]",
    warn: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };
  return (
    <div className={`rounded-xl border p-5 ${tones[tone] || tones.default}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#64748B]">{title}</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0A3D7C]" />
        </div>
      </div>
    </div>
  );
}