const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { jsPDF } from "jspdf";

export const ROLES = {
  admin: {
    label: "Administrador",
    modules: ["dashboard", "productos", "categorias", "proveedores", "movimientos", "reportes", "usuarios"],
  },
  almacenista: {
    label: "Almacenista",
    modules: ["dashboard", "productos", "categorias", "proveedores", "movimientos", "reportes"],
  },
  consulta: {
    label: "Consulta",
    modules: ["dashboard", "productos", "categorias", "proveedores", "movimientos", "reportes"],
  },
};

export function can(role, moduleKey) {
  return ROLES[role]?.modules.includes(moduleKey) ?? false;
}

export function canEdit(role) {
  return role === "admin" || role === "almacenista";
}

export function formatCurrency(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n) || 0);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("es-MX").format(Number(n) || 0);
}

export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-MX");
}

export function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export function computeNewStock(current, tipo, cantidad) {
  if (tipo === "entrada") return (Number(current) || 0) + Number(cantidad);
  if (tipo === "salida") return Math.max(0, (Number(current) || 0) - Number(cantidad));
  if (tipo === "ajuste") return Number(cantidad);
  return Number(current) || 0;
}

export async function syncAlert(productId, productName, stockActual, stockMinimo) {
  try {
    await db.entities.Alert.deleteMany({ producto_id: productId });
  } catch (e) {
    /* ignore */
  }
  if (Number(stockMinimo) > 0 && Number(stockActual) <= Number(stockMinimo)) {
    await db.entities.Alert.create({
      producto_id: productId,
      producto_nombre: productName,
      tipo: "stock_bajo",
      mensaje: `Stock bajo: ${stockActual} unidades (mínimo ${stockMinimo})`,
      leido: false,
    });
  }
}

export async function recordMovement({ product, tipo, cantidad, motivo, user }) {
  const qty = Math.abs(Number(cantidad) || 0);
  if (qty === 0 && tipo !== "ajuste") throw new Error("La cantidad debe ser mayor a 0");
  if (tipo === "salida" && qty > Number(product.stock_actual || 0)) {
    throw new Error("Stock insuficiente para registrar la salida");
  }
  const newStock = computeNewStock(product.stock_actual, tipo, tipo === "ajuste" ? qty : qty);
  const movement = await db.entities.InventoryMovement.create({
    producto_id: product.id,
    producto_nombre: product.nombre,
    tipo,
    cantidad: qty,
    motivo: motivo || "",
    usuario_id: user?.id || "",
    usuario_nombre: user?.full_name || user?.email || "Sistema",
  });
  await db.entities.Product.update(product.id, { stock_actual: newStock });
  await syncAlert(product.id, product.nombre, newStock, product.stock_minimo);
  return { movement, newStock };
}

export function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    rows = [{}];
  }
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPDF(title, headers, rows) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setTextColor(10, 61, 124);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 14, 25);

  const colWidth = Math.floor((doc.internal.pageSize.getWidth() - 28) / headers.length);
  let y = 34;
  doc.setFillColor(10, 61, 124);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y - 6, doc.internal.pageSize.getWidth() - 28, 8, "F");
  headers.forEach((h, i) => doc.text(String(h), 16 + i * colWidth, y - 0.5));
  y += 8;
  doc.setTextColor(30, 41, 59);
  rows.forEach((row, ri) => {
    if (y > doc.internal.pageSize.getHeight() - 12) {
      doc.addPage();
      y = 20;
    }
    if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 6, doc.internal.pageSize.getWidth() - 28, 8, "F");
    }
    headers.forEach((h, i) => {
      const val = String(row[h] ?? "");
      doc.text(val.length > 28 ? val.slice(0, 28) + "…" : val, 16 + i * colWidth, y - 0.5);
    });
    y += 8;
  });
  doc.save(title.replace(/\s+/g, "_") + ".pdf");
}