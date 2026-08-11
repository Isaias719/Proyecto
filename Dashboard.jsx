const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Package, AlertTriangle, TrendingUp, ArrowLeftRight, ArrowRight } from "lucide-react";

import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "@/lib/inventory";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.entities.Product.list("-created_date", 500),
      db.entities.InventoryMovement.list("-created_date", 200),
    ])
      .then(([p, m]) => {
        setProducts(p);
        setMovements(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const totalValue = products.reduce((s, p) => s + (Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0), 0);
  const lowStock = products.filter((p) => Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo));
  const today = new Date().toDateString();
  const movesToday = movements.filter((m) => new Date(m.created_date).toDateString() === today);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayMoves = movements.filter((m) => new Date(m.created_date).toDateString() === key);
    chartData.push({
      dia: d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
      entradas: dayMoves.filter((m) => m.tipo === "entrada").reduce((s, m) => s + Number(m.cantidad || 0), 0),
      salidas: dayMoves.filter((m) => m.tipo === "salida").reduce((s, m) => s + Number(m.cantidad || 0), 0),
    });
  }

  if (loading) {
    return <div className="p-6 text-[#64748B]">Cargando dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Dashboard" subtitle="Resumen general del inventario" icon={Package} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total de productos" value={formatNumber(totalProducts)} icon="product" tone="blue" />
        <StatCard title="Valor del inventario" value={formatCurrency(totalValue)} subtitle="Precio de venta" icon="value" />
        <StatCard title="Productos con stock bajo" value={formatNumber(lowStock.length)} icon="low" tone={lowStock.length ? "danger" : "default"} />
        <StatCard title="Movimientos hoy" value={formatNumber(movesToday.length)} icon="moves" tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1E293B]">Movimientos (últimos 7 días)</h3>
            <Link to="/movimientos" className="text-sm text-[#0A3D7C] font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Bar dataKey="entradas" name="Entradas" fill="#0A3D7C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" name="Salidas" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-[#1E293B]">Alertas de stock bajo</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No hay alertas activas 🎉</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lowStock.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  to={`/productos/${p.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E6F0FA]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{p.nombre}</p>
                    <p className="text-xs text-[#64748B]">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{p.stock_actual}</p>
                    <p className="text-xs text-[#64748B]">mín. {p.stock_minimo}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mt-6">
        <h3 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[#0A3D7C]" /> Movimientos recientes
        </h3>
        <div className="space-y-1">
          {movements.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    m.tipo === "entrada"
                      ? "bg-emerald-100 text-emerald-700"
                      : m.tipo === "salida"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {m.tipo}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{m.producto_nombre}</p>
                  <p className="text-xs text-[#64748B]">{m.usuario_nombre || "Sistema"} · {formatDate(m.created_date)}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${m.tipo === "salida" ? "text-rose-600" : "text-emerald-600"}`}>
                {m.tipo === "salida" ? "-" : "+"}{m.cantidad}
              </p>
            </div>
          ))}
          {movements.length === 0 && <p className="text-sm text-[#64748B] py-4 text-center">Sin movimientos registrados</p>}
        </div>
      </div>
    </div>
  );
}