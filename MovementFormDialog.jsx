import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MovementFormDialog({ open, onOpenChange, onSubmit, products, user }) {
  const [form, setForm] = useState({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
      setError("");
    }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selected = products.find((p) => p.id === form.producto_id);

  const submit = () => {
    setError("");
    if (!form.producto_id) return setError("Selecciona un producto");
    if (!form.cantidad || Number(form.cantidad) <= 0) return setError("La cantidad debe ser mayor a 0");
    if (form.tipo === "salida" && selected && Number(form.cantidad) > Number(selected.stock_actual || 0)) {
      return setError(`Stock insuficiente (disponible: ${selected.stock_actual})`);
    }
    onSubmit({ product: selected, tipo: form.tipo, cantidad: Number(form.cantidad), motivo: form.motivo, user });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Producto *</Label>
            <Select value={form.producto_id} onValueChange={(v) => set("producto_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de movimiento *</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste (stock absoluto)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{form.tipo === "ajuste" ? "Stock final *" : "Cantidad *"}</Label>
            <Input type="number" min="0" value={form.cantidad} onChange={(e) => set("cantidad", e.target.value)} className="mt-1" />
            {form.tipo === "salida" && selected && (
              <p className="text-xs text-[#64748B] mt-1">Disponible: {selected.stock_actual} {selected.unidad_medida}</p>
            )}
          </div>
          <div>
            <Label>Motivo</Label>
            <Textarea value={form.motivo} onChange={(e) => set("motivo", e.target.value)} className="mt-1" rows={2} placeholder="Compra, venta, merma, conteo..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-[#0A3D7C] hover:bg-[#0A3D7C]/90 text-white">Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}