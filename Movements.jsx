const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import MovementFormDialog from "@/components/MovementFormDialog";
import { useRole } from "@/lib/RoleContext";
import { canEdit, recordMovement, formatDate } from "@/lib/inventory";

export default function Movements() {
  const { toast } = useToast();
  const { effectiveRole, user } = useRole();
  const editable = canEdit(effectiveRole);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, p] = await Promise.all([
      db.entities.InventoryMovement.list("-created_date", 500),
      db.entities.Product.list("-created_date", 500),
    ]);
    setMovements(m);
    setProducts(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async ({ product, tipo, cantidad, motivo }) => {
    try {
      await recordMovement({ product, tipo, cantidad, motivo, user });
      toast({ title: "Movimiento registrado", description: `Stock actualizado: ${product.nombre}` });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "No se pudo registrar", description: e.message, variant: "destructive" });
    }
  };

  const columns = [
    { key: "created_date", label: "Fecha", sortable: true, render: (r) => formatDate(r.created_date) },
    { key: "producto_nombre", label: "Producto", sortable: true, render: (r) => <span className="font-medium text-[#1E293B]">{r.producto_nombre}</span> },
    { key: "tipo", label: "Tipo", sortable: true, render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : r.tipo === "salida" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.tipo}</span>
    ) },
    { key: "cantidad", label: "Cantidad", sortable: true, render: (r) => <span className={r.tipo === "salida" ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>{r.tipo === "salida" ? "-" : "+"}{r.cantidad}</span> },
    { key: "motivo", label: "Motivo", render: (r) => r.motivo || "—" },
    { key: "usuario_nombre", label: "Usuario", render: (r) => r.usuario_nombre || "—" },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Movimientos" subtitle={`${movements.length} movimientos registrados`} icon={ArrowLeftRight}
        action={editable && <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"><Plus className="w-4 h-4" /> Registrar movimiento</button>} />
      {loading ? <p className="text-[#64748B]">Cargando...</p> : <DataTable columns={columns} data={movements} searchKeys={["producto_nombre", "motivo", "usuario_nombre"]} />}
      <MovementFormDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} products={products} user={user} />
    </div>
  );
}