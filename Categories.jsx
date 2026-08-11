const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";

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

export default function Categories() {
  const { toast } = useToast();
  const { effectiveRole } = useRole();
  const editable = canEdit(effectiveRole);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", estado: true });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await db.entities.Category.list("-created_date", 200));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ nombre: "", descripcion: "", estado: true }); setEditingId(null); setOpen(true); };
  const openEdit = (c) => { setForm({ nombre: c.nombre, descripcion: c.descripcion, estado: c.estado }); setEditingId(c.id); setOpen(true); };

  const submit = async () => {
    if (!form.nombre.trim()) return toast({ title: "El nombre es obligatorio", variant: "destructive" });
    try {
      if (editingId) {
        await db.entities.Category.update(editingId, form);
        toast({ title: "Categoría actualizada" });
      } else {
        await db.entities.Category.create(form);
        toast({ title: "Categoría creada" });
      }
      setOpen(false);
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const remove = async (c) => {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    await db.entities.Category.delete(c.id);
    toast({ title: "Categoría eliminada" });
    load();
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, render: (r) => <span className="font-medium text-[#1E293B]">{r.nombre}</span> },
    { key: "descripcion", label: "Descripción", render: (r) => r.descripcion || "—" },
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
      <PageHeader title="Categorías" subtitle={`${items.length} categorías`} icon={Tags}
        action={editable && <button onClick={openNew} className="inline-flex items-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"><Plus className="w-4 h-4" /> Nueva categoría</button>} />
      {loading ? <p className="text-[#64748B]">Cargando...</p> : <DataTable columns={columns} data={items} searchKeys={["nombre"]} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar categoría" : "Nueva categoría"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1" /></div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-1" rows={2} /></div>
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