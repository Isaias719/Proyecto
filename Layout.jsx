import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Bell, ChevronDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { RoleProvider, useRole } from "@/lib/RoleContext";
import { ROLES } from "@/lib/inventory";

function Topbar({ onMenu }) {
  const { effectiveRole, setOverride, user } = useRole();
  const [open, setOpen] = useState(false);
  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <button className="lg:hidden p-2 text-[#1E293B]" onClick={onMenu}>
        <Menu className="w-6 h-6" />
      </button>
      <div className="hidden lg:block">
        <h2 className="text-[15px] font-semibold text-[#1E293B]">Panel de control</h2>
        <p className="text-xs text-[#64748B]">Sistema de gestión de inventarios</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell className="w-5 h-5 text-[#64748B]" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#0A3D7C] rounded-full" />
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC]"
          >
            <div className="w-7 h-7 rounded-full bg-[#0A3D7C] text-white text-xs font-semibold flex items-center justify-center">
              {(user?.full_name || user?.email || "AD").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[#1E293B] hidden sm:block">
              {user?.full_name || "Administrador"}
            </span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 z-30">
              <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-[#64748B]">Simular rol</p>
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => {
                    setOverride(key);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-sm ${
                    effectiveRole === key ? "bg-[#E6F0FA] text-[#0A3D7C] font-medium" : "text-[#1E293B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <RoleProvider>
      <div className="flex h-screen bg-[#F8FAFC]">
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}