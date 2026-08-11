const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Pencil, Trash2, Eye } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import ProductFormDialog from "@/components/ProductFormDialog";
import { useRole } from "@/lib/RoleContext";
import { formatCurrency, canEdit, syncAlert } from "@/lib/inventory";

export default function Products() {
  const { toast } = useToast();
  const { effectiveRole, user } = useRole();
  const editable = canEdit(effectiveRole);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c, s] = await Promise.all([
      db.entities.Product.list("-created_date", 500),
      db.entities.Category.list("-created_date", 200),
      db.entities.Supplier.list("-created_date", 200),
    ]);
    setProducts(p);
    setCategories(c);
    setSuppliers(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e) => toast({ title: "Error al cargar", description: e.message, variant: "destructive" }));
  }, [load, toast]);

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
    try {
      await db.entities.Product.delete(p.id);
      toast({ title: "Producto eliminado" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editing?.id) {
        await db.entities.Product.update(editing.id, data);
        await syncAlert(editing.id, data.nombre, data.stock_actual, data.stock_minimo);
        toast({ title: "Producto actualizado" });
      } else {
        const created = await db.entities.Product.create(data);
        await syncAlert(created.id, data.nombre, data.stock_actual, data.stock_minimo);
        toast({ title: "Producto creado" });
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const columns = [
    { key: "sku", label: "SKU", sortable: true, render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "nombre", label: "Producto", sortable: true, render: (r) => (
      <Link to={`/productos/${r.id}`} className="font-medium text-[#0A3D7C] hover:underline">{r.nombre}</Link>
    ) },
    { key: "categoria_nombre", label: "Categoría", render: (r) => r.categoria_nombre || "—" },
    { key: "proveedor_nombre", label: "Proveedor", render: (r) => r.proveedor_nombre || "—" },
    { key: "stock_actual", label: "Stock", sortable: true, render: (r) => (
      <span className={Number(r.stock_minimo) > 0 && Number(r.stock_actual) <= Number(r.stock_minimo) ? "text-red-600 font-semibold" : ""}>
        {r.stock_actual} {r.unidad_medida}
      </span>
    ) },
    { key: "precio_venta", label: "Precio venta", sortable: true, render: (r) => formatCurrency(r.precio_venta) },
    { key: "estado", label: "Estado", render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.estado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
        {r.estado ? "Activo" : "Inactivo"}
      </span>
    ) },
    {
      key: "acciones",
      label: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link to={`/productos/${r.id}`} className="p-1.5 rounded-lg hover:bg-[#E6F0FA] text-[#0A3D7C]"><Eye className="w-4 h-4" /></Link>
          {editable && (
            <>
              <button onClick={() => { setEditing(r); setDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-[#E6F0FA] text-[#0A3D7C]"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Productos"
        subtitle={`${products.length} productos registrados`}
        icon={Package}
        action={
          editable && (
            <button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex items-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Nuevo producto
            </button>
          )
        }
      />
      {loading ? (
        <p className="text-[#64748B]">Cargando productos...</p>
      ) : (
        <DataTable columns={columns} data={products} searchKeys={["sku", "nombre", "categoria_nombre", "proveedor_nombre"]} />
      )}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initial={editing}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}