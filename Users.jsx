const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";
import { Users as UsersIcon, UserPlus, ShieldCheck, ShieldAlert, Mail } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { useRole } from "@/lib/RoleContext";
import { ROLES } from "@/lib/inventory";
import { formatDate } from "@/lib/inventory";

export default function Users() {
  const { toast } = useToast();
  const { effectiveRole } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("almacenista");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await db.entities.User.list("-created_date", 100));
    } catch (e) {
      toast({ title: "No se pudieron cargar usuarios", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (effectiveRole !== "admin") {
    return (
      <div className="p-6">
        <PageHeader title="Usuarios" subtitle="Gestión de usuarios" icon={UsersIcon} />
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-[#1E293B] font-medium">Acceso restringido</p>
          <p className="text-sm text-[#64748B] mt-1">Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  const invite = async () => {
    if (!email.trim()) return toast({ title: "Ingresa un correo", variant: "destructive" });
    try {
      await db.users.inviteUser(email.trim(), role);
      toast({ title: "Invitación enviada", description: `Se invitó a ${email} como ${ROLES[role]?.label}` });
      setOpen(false);
      setEmail("");
      load();
    } catch (e) {
      toast({ title: "Error al invitar", description: e.message, variant: "destructive" });
    }
  };

  const changeRole = async (u, newRole) => {
    try {
      await db.entities.User.update(u.id, { role: newRole });
      toast({ title: "Rol actualizado", description: `${u.full_name || u.email}: ${ROLES[newRole]?.label}` });
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleState = async (u) => {
    try {
      await db.entities.User.update(u.id, { estado: !u.estado });
      toast({ title: u.estado ? "Usuario desactivado" : "Usuario activado" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const columns = [
    { key: "full_name", label: "Nombre", sortable: true, render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#0A3D7C] text-white text-xs font-semibold flex items-center justify-center">{(r.full_name || r.email || "?").slice(0, 2).toUpperCase()}</div>
        <span className="font-medium text-[#1E293B]">{r.full_name || "—"}</span>
      </div>
    ) },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Rol", render: (r) => (
      <Select value={r.role} onValueChange={(v) => changeRole(r, v)}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ROLES).map(([k, ro]) => <SelectItem key={k} value={k}>{ro.label}</SelectItem>)}
        </SelectContent>
      </Select>
    ) },
    { key: "estado", label: "Estado", render: (r) => (
      <button onClick={() => toggleState(r)} className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.estado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
        {r.estado ? "Activo" : "Inactivo"}
      </button>
    ) },
    { key: "created_date", label: "Registrado", sortable: true, render: (r) => formatDate(r.created_date) },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Usuarios" subtitle={`${users.length} usuarios`} icon={UsersIcon}
        action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"><UserPlus className="w-4 h-4" /> Invitar usuario</button>} />
      {loading ? <p className="text-[#64748B]">Cargando usuarios...</p> : <DataTable columns={columns} data={users} searchKeys={["full_name", "email", "role"]} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invitar usuario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Correo electrónico *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="usuario@empresa.com" /></div>
            <div><Label>Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([k, ro]) => <SelectItem key={k} value={k}>{ro.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-[#64748B] flex items-start gap-1.5"><Mail className="w-3.5 h-3.5 mt-0.5" /> Se enviará una invitación por correo al usuario para que se registre.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={invite} className="bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white">Enviar invitación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}