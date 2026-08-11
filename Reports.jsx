const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { FileText, Download, FileSpreadsheet, AlertTriangle, Package } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import { downloadCSV, downloadPDF, formatCurrency, formatDate } from "@/lib/inventory";

export default function Reports() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    Promise.all([
      db.entities.Product.list("-created_date", 500),
      db.entities.InventoryMovement.list("-created_date", 500),
    ]).then(([p, m]) => { setProducts(p); setMovements(m); })
      .finally(() => setLoading(false));
  }, []);

  const inRange = (d) => {
    const date = new Date(d);
    if (from && date < new Date(from)) return false;
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); if (date > t) return false; }
    return true;
  };

  const exportInventoryCSV = () => {
    const rows = products.map((p) => ({
      SKU: p.sku, Nombre: p.nombre, Categoria: p.categoria_nombre || "", Proveedor: p.proveedor_nombre || "",
      Stock: p.stock_actual, Minimo: p.stock_minimo, Unidad: p.unidad_medida,
      Precio_Compra: p.precio_compra, Precio_Venta: p.precio_venta, Valor: (Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0),
      Estado: p.estado ? "Activo" : "Inactivo",
    }));
    downloadCSV("inventario_actual.csv", rows);
    toast({ title: "Inventario exportado (CSV)" });
  };

  const exportInventoryPDF = () => {
    const rows = products.map((p) => ({
      SKU: p.sku, Nombre: p.nombre, Stock: p.stock_actual, Min: p.stock_minimo, "P. Venta": formatCurrency(p.precio_venta), Valor: formatCurrency((Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0)),
    }));
    downloadPDF("Inventario actual", ["SKU", "Nombre", "Stock", "Min", "P. Venta", "Valor"], rows);
    toast({ title: "Inventario exportado (PDF)" });
  };

  const exportMovementsCSV = () => {
    const rows = movements.filter((m) => inRange(m.created_date)).map((m) => ({
      Fecha: formatDate(m.created_date), Producto: m.producto_nombre, Tipo: m.tipo, Cantidad: m.cantidad, Motivo: m.motivo, Usuario: m.usuario_nombre || "",
    }));
    downloadCSV("movimientos.csv", rows);
    toast({ title: `${rows.length} movimientos exportados` });
  };

  const exportLowStockCSV = () => {
    const rows = products.filter((p) => Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo)).map((p) => ({
      SKU: p.sku, Nombre: p.nombre, Stock_Actual: p.stock_actual, Stock_Minimo: p.stock_minimo, Diferencia: Number(p.stock_actual) - Number(p.stock_minimo),
    }));
    downloadCSV("stock_bajo.csv", rows);
    toast({ title: `${rows.length} productos con stock bajo exportados` });
  };

  const lowStock = products.filter((p) => Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo));

  if (loading) return <div className="p-6 text-[#64748B]">Cargando reportes...</div>;

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Reportes" subtitle="Exportación de inventario y movimientos" icon={FileText} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F0FA] flex items-center justify-center"><Package className="w-5 h-5 text-[#0A3D7C]" /></div>
            <div><h3 className="font-semibold text-[#1E293B]">Inventario actual</h3><p className="text-sm text-[#64748B]">{products.length} productos</p></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={exportInventoryCSV} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg"><FileSpreadsheet className="w-4 h-4" /> Excel (CSV)</button>
            <button onClick={exportInventoryPDF} className="flex-1 inline-flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#1E293B] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#F8FAFC]"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><h3 className="font-semibold text-[#1E293B]">Productos con stock bajo</h3><p className="text-sm text-[#64748B]">{lowStock.length} productos</p></div>
          </div>
          <button onClick={exportLowStockCSV} className="w-full inline-flex items-center justify-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg mt-4"><FileSpreadsheet className="w-4 h-4" /> Exportar CSV</button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 md:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F0FA] flex items-center justify-center"><FileText className="w-5 h-5 text-[#0A3D7C]" /></div>
            <div><h3 className="font-semibold text-[#1E293B]">Movimientos por rango de fechas</h3><p className="text-sm text-[#64748B]">{movements.filter(m => inRange(m.created_date)).length} movimientos en el rango</p></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div><label className="text-xs text-[#64748B]">Desde</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block mt-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1E293B]" /></div>
            <div><label className="text-xs text-[#64748B]">Hasta</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block mt-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1E293B]" /></div>
            <button onClick={exportMovementsCSV} className="sm:mt-5 inline-flex items-center justify-center gap-2 bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg h-fit"><FileSpreadsheet className="w-4 h-4" /> Exportar CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}