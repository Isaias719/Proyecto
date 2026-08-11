import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const EMPTY = {
  sku: "",
  nombre: "",
  descripcion: "",
  categoria_id: "",
  proveedor_id: "",
  precio_compra: "",
  precio_venta: "",
  stock_actual: "",
  stock_minimo: "",
  unidad_medida: "pieza",
  estado: true,
};

export default function ProductFormDialog({ open, onOpenChange, onSubmit, initial, categories, suppliers }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial });
      setErrors({});
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.sku.trim()) e.sku = "El SKU es obligatorio";
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (form.precio_compra === "" || Number(form.precio_compra) < 0) e.precio_compra = "Precio inválido";
    if (form.precio_venta === "" || Number(form.precio_venta) < 0) e.precio_venta = "Precio inválido";
    if (form.stock_actual !== "" && Number(form.stock_actual) < 0) e.stock_actual = "No puede ser negativo";
    if (form.stock_minimo !== "" && Number(form.stock_minimo) < 0) e.stock_minimo = "No puede ser negativo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      precio_compra: Number(form.precio_compra) || 0,
      precio_venta: Number(form.precio_venta) || 0,
      stock_actual: Number(form.stock_actual) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
      categoria_nombre: categories.find((c) => c.id === form.categoria_id)?.nombre || "",
      proveedor_nombre: suppliers.find((s) => s.id === form.proveedor_id)?.nombre || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-1">
            <Label>SKU *</Label>
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="mt-1" />
            {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
          </div>
          <div className="col-span-1">
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className="mt-1" />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>
          <div className="col-span-2">
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} className="mt-1" rows={2} />
          </div>
          <div className="col-span-1">
            <Label>Categoría</Label>
            <Select value={form.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Label>Proveedor</Label>
            <Select value={form.proveedor_id} onValueChange={(v) => set("proveedor_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio compra *</Label>
            <Input type="number" min="0" value={form.precio_compra} onChange={(e) => set("precio_compra", e.target.value)} className="mt-1" />
            {errors.precio_compra && <p className="text-xs text-red-500 mt-1">{errors.precio_compra}</p>}
          </div>
          <div>
            <Label>Precio venta *</Label>
            <Input type="number" min="0" value={form.precio_venta} onChange={(e) => set("precio_venta", e.target.value)} className="mt-1" />
            {errors.precio_venta && <p className="text-xs text-red-500 mt-1">{errors.precio_venta}</p>}
          </div>
          <div>
            <Label>Stock actual</Label>
            <Input type="number" min="0" value={form.stock_actual} onChange={(e) => set("stock_actual", e.target.value)} className="mt-1" />
            {errors.stock_actual && <p className="text-xs text-red-500 mt-1">{errors.stock_actual}</p>}
          </div>
          <div>
            <Label>Stock mínimo</Label>
            <Input type="number" min="0" value={form.stock_minimo} onChange={(e) => set("stock_minimo", e.target.value)} className="mt-1" />
          </div>
          <div className="col-span-1">
            <Label>Unidad de medida</Label>
            <Input value={form.unidad_medida} onChange={(e) => set("unidad_medida", e.target.value)} className="mt-1" />
          </div>
          <div className="col-span-1 flex items-center gap-2 pt-6">
            <Switch checked={form.estado} onCheckedChange={(v) => set("estado", v)} />
            <Label className="text-sm">Activo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}