import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Tags, Truck, ArrowLeftRight, FileText, Users, Boxes } from "lucide-react";
import { useRole } from "@/lib/RoleContext";
import { ROLES, can } from "@/lib/inventory";

const NAV = [
  { key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { key: "productos", label: "Productos", to: "/productos", icon: Package },
  { key: "categorias", label: "Categorías", to: "/categorias", icon: Tags },
  { key: "proveedores", label: "Proveedores", to: "/proveedores", icon: Truck },
  { key: "movimientos", label: "Movimientos", to: "/movimientos", icon: ArrowLeftRight },
  { key: "reportes", label: "Reportes", to: "/reportes", icon: FileText },
  { key: "usuarios", label: "Usuarios", to: "/usuarios", icon: Users },
];

export default function Sidebar({ onNavigate }) {
  const { effectiveRole } = useRole();
  return (
    <aside className="w-64 shrink-0 bg-[#0A3D7C] text-[#E6F0FA] flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#E6F0FA] flex items-center justify-center">
          <Boxes className="w-5 h-5 text-[#0A3D7C]" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-white text-[15px]">Inventario</p>
          <p className="text-[11px] text-[#E6F0FA]/70">Gestión empresarial</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.filter((item) => can(effectiveRole, item.key)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E6F0FA] text-[#0A3D7C]"
                    : "text-[#E6F0FA] hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[11px] text-[#E6F0FA]/70">Rol activo</p>
        <p className="text-sm font-semibold text-white">{ROLES[effectiveRole]?.label}</p>
      </div>
    </aside>
  );
}