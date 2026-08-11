const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { useRole } from "@/lib/RoleContext";
import { canEdit } from "@/lib/inventory";

export default function Suppliers() {
  const { toast } = useToast();
  const { effectiveRole } = useRole();
  const editable = canEdit(effectiveRole);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", contacto: "", telefono: "", email: "", direccion: "", estado: true });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await db.entities.Supplier.list("-created_date", 200));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ nombre: "", contacto: "", telefono: "", email: "", direccion: "", estado: true }); setEditingId(null); setOpen(true); };
  const openEdit = (s) => { setForm({ nombre: s.nombre, contacto: s.contacto, telefono: s.telefono, email: s.email, direccion: s.direccion, estado: s.estado }); setEditingId(s.id); setOpen(true); };

  const submit = async () => {
    if (!form.nombre.trim()) return toast({ title: "El nombre es obligatorio", variant: "destructive" });
    try {
      if (editingId) { await db.entities.Supplier.update(editingId, form); toast({ title: "Proveedor actualizado" }); }
      else { await db.entities.Supplier.create(form); toast({ title: "Proveedor creado" }); }
      setOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const remove = async (s) => {
    if (!confirm(`¿Eliminar el proveedor "${s.nombre}"?`)) return;
    await db.entities.Supplier.delete(s.id);
    toast({ title: "Proveedor eliminado" }); load();
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, render: (r) => <span className="font-medium text-[#1E293B]">{r.nombre}</span> },
    { key: "contacto", label: "Contacto", render: (r) => r.contacto || "—" },
    { key: "telefono", label: "Teléfono", render: (r) => r.telefono || "—" },
    { key: "email", label: "Email", render: (r) => r.email || "—" },
    { key: "estado", label: "Estado", render: (r) => <span className={`text-xs px-2 py-0.5 rounded-full ${r.estado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.estado ? "Activo" : "Inactivo"}</span> },
    { key: "acciones", label: "", render: (r) => editable ? (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-[#E6F0FA] text-[#0A3D7C]"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => remove(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Proveedores" subtitle={`${items.length} proveedores`} icon={Truck}
        action={editable && <button onClick={openNew} className="inline-flex items-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"><Plus className="w-4 h-4" /> Nuevo proveedor</button>} />
      {loading ? <p className="text-[#64748B]">Cargando...</p> : <DataTable columns={columns} data={items} searchKeys={["nombre", "contacto", "email"]} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1" /></div>
            <div><Label>Contacto</Label><Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="mt-1" /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Dirección</Label><Textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="mt-1" rows={2} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.estado} onCheckedChange={(v) => setForm({ ...form, estado: v })} /><Label className="text-sm">Activo</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} className="bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}