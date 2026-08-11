import { Button } from "@/components/ui/button";

export default function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#E6F0FA] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#0A3D7C]" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748B]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}