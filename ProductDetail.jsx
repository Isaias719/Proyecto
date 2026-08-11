const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, ArrowLeftRight, AlertTriangle, TrendingUp } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { formatCurrency, formatDate, formatNumber } from "@/lib/inventory";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.entities.Product.get(id),
      db.entities.InventoryMovement.list("-created_date", 200),
    ])
      .then(([p, m]) => {
        setProduct(p);
        setMovements(m.filter((x) => x.producto_id === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-[#64748B]">Cargando producto...</div>;
  if (!product) return <div className="p-6 text-[#64748B]">Producto no encontrado.</div>;

  const isLow = Number(product.stock_minimo) > 0 && Number(product.stock_actual) <= Number(product.stock_minimo);
  const valorInventario = (Number(product.stock_actual) || 0) * (Number(product.precio_venta) || 0);
  const margen = (Number(product.precio_venta) || 0) - (Number(product.precio_compra) || 0);

  const columns = [
    { key: "created_date", label: "Fecha", sortable: true, render: (r) => formatDate(r.created_date) },
    { key: "tipo", label: "Tipo", render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : r.tipo === "salida" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.tipo}</span>
    ) },
    { key: "cantidad", label: "Cantidad", render: (r) => `${r.tipo === "salida" ? "-" : "+"}${r.cantidad}` },
    { key: "motivo", label: "Motivo", render: (r) => r.motivo || "—" },
    { key: "usuario_nombre", label: "Usuario", render: (r) => r.usuario_nombre || "—" },
  ];

  return (
    <div className="p-4 sm:p-6">
      <Link to="/productos" className="inline-flex items-center gap-1 text-sm text-[#0A3D7C] font-medium mb-4 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Volver a productos
      </Link>
      <PageHeader title={product.nombre} subtitle={`SKU: ${product.sku}`} icon={Package} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="font-semibold text-[#1E293B] mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-[#64748B]">Categoría</dt><dd className="font-medium text-[#1E293B]">{product.categoria_nombre || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Proveedor</dt><dd className="font-medium text-[#1E293B]">{product.proveedor_nombre || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Unidad</dt><dd className="font-medium text-[#1E293B]">{product.unidad_medida}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Precio compra</dt><dd className="font-medium text-[#1E293B]">{formatCurrency(product.precio_compra)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Precio venta</dt><dd className="font-medium text-[#1E293B]">{formatCurrency(product.precio_venta)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Margen</dt><dd className="font-medium text-emerald-600">{formatCurrency(margen)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#64748B]">Estado</dt><dd><span className={`text-xs px-2 py-0.5 rounded-full ${product.estado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.estado ? "Activo" : "Inactivo"}</span></dd></div>
            </dl>
            {product.descripcion && <p className="text-sm text-[#64748B] mt-4 pt-4 border-t border-[#E2E8F0]">{product.descripcion}</p>}
          </div>
          <div className={`rounded-xl border p-5 ${isLow ? "bg-red-50 border-red-200" : "bg-[#E6F0FA] border-[#E2E8F0]"}`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-5 h-5 ${isLow ? "text-red-600" : "text-[#0A3D7C]"}`} />
              <h3 className="font-semibold text-[#1E293B]">Stock</h3>
            </div>
            <p className="text-3xl font-bold text-[#1E293B]">{formatNumber(product.stock_actual)} <span className="text-base font-normal text-[#64748B]">{product.unidad_medida}</span></p>
            <p className="text-sm text-[#64748B] mt-1">Mínimo: {product.stock_minimo}</p>
            {isLow && <p className="text-sm text-red-600 mt-2 font-medium">⚠ Stock por debajo del mínimo</p>}
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-[#0A3D7C]" /><h3 className="font-semibold text-[#1E293B]">Valor en inventario</h3></div>
            <p className="text-2xl font-bold text-[#0A3D7C]">{formatCurrency(valorInventario)}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-[#0A3D7C]" /> Historial de movimientos</h3>
          <DataTable columns={columns} data={movements} searchKeys={["motivo", "usuario_nombre"]} emptyText="Sin movimientos registrados" />
        </div>
      </div>
    </div>
  );
}