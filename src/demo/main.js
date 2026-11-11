import '@fontsource-variable/inter';
import '../styles.css';
import Alpine from 'alpinejs';
import Chart from 'chart.js/auto';
import { crearSemilla, diaLocal, METODOS, VERSION } from './seed.js';

const CLAVE = 'tucontrol-demo';
const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const graficas = {};

/** Recupera la demo guardada en este navegador; cada día empieza con datos frescos. */
function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (guardado && guardado.version === VERSION && guardado.creado === diaLocal(new Date())) {
      return guardado;
    }
  } catch {
    // Almacenamiento no disponible o dañado: se usa una demo nueva.
  }
  return crearSemilla();
}

const VISTAS = [
  { id: 'panel', nombre: 'Panel', soloAdmin: true, icono: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'caja', nombre: 'Caja', soloAdmin: false, icono: 'M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm8 3a3 3 0 100 6 3 3 0 000-6zM6 9v2m12 2v2' },
  { id: 'ventas', nombre: 'Ventas', soloAdmin: false, icono: 'M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z' },
  { id: 'inventario', nombre: 'Inventario', soloAdmin: true, icono: 'M21 8l-9-5-9 5m18 0l-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5' },
  { id: 'compras', nombre: 'Compras', soloAdmin: true, icono: 'M3 7h11v9H3V7zm11 3h4l3 3v3h-7v-6zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z' },
  { id: 'productos', nombre: 'Productos', soloAdmin: true, icono: 'M4 6h16M4 12h16M4 18h10' },
];

Alpine.data('demo', () => ({
  s: cargar(),
  vista: 'panel',
  sedeId: 1,
  metodos: METODOS,
  aviso: null,
  error: '',
  soloBajo: false,
  recorridoAbierto: true,
  fVenta: { metodo: 'efectivo', filas: [{ productoId: '', cantidad: 1 }] },
  fCompra: { proveedorId: '', filas: [{ productoId: '', cantidad: 10, costo: '' }] },
  fCaja: { apertura: 100000, cierre: '' },

  init() {
    const pedida = location.hash.replace('#', '');
    this.ir(this.vistas.some((v) => v.id === pedida) ? pedida : this.vistas[0].id);
    window.addEventListener('hashchange', () => {
      const id = location.hash.replace('#', '');
      if (id !== this.vista && this.vistas.some((v) => v.id === id)) this.ir(id);
    });
  },

  // ── Utilidades ────────────────────────────────────────────────────────────
  dinero: (n) => pesos.format(n || 0),
  hora: (f) => new Date(f).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }),
  fechaCorta: (f) => new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
  producto(id) { return this.s.productos.find((p) => p.id === Number(id)); },
  nombreSede(id) { return this.s.sedes.find((x) => x.id === id)?.nombre ?? ''; },
  nombreMetodo(codigo) { return METODOS.find((m) => m.codigo === codigo)?.nombre ?? codigo; },
  stock(sedeId, productoId) { return this.s.inventario[`${sedeId}-${productoId}`] ?? 0; },

  guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(this.s)); } catch { /* sin almacenamiento */ }
    if (this.vista === 'panel') this.$nextTick(() => this.dibujar());
  },
  avisar(texto) {
    this.aviso = texto;
    clearTimeout(this._t);
    this._t = setTimeout(() => { this.aviso = null; }, 4000);
  },
  fallo(texto) { this.error = texto; return false; },

  // ── Navegación y rol ──────────────────────────────────────────────────────
  get esAdmin() { return this.s.rol === 'admin'; },
  get vistas() { return VISTAS.filter((v) => this.esAdmin || !v.soloAdmin); },
  ir(id) {
    this.vista = id;
    this.error = '';
    if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    if (id === 'inventario' && this.s.recorrido.venta && !this.s.recorrido.inventario) {
      this.s.recorrido.inventario = true;
      this.guardar();
    }
    if (id === 'panel') this.$nextTick(() => this.dibujar());
    window.scrollTo({ top: 0 });
  },
  cambiarRol(rol) {
    this.s.rol = rol;
    this.s.recorrido.rol = true;
    if (!this.vistas.some((v) => v.id === this.vista)) this.ir('ventas');
    this.guardar();
    this.avisar(rol === 'admin' ? 'Ahora ves la demo como administrador.' : 'Ahora ves la demo como cajero: solo Caja y Ventas.');
  },
  reiniciar() {
    if (!confirm('¿Reiniciar la demo? Se borra todo lo que hiciste y vuelven los datos de ejemplo.')) return;
    this.s = crearSemilla();
    this.sedeId = 1;
    this.fVenta = { metodo: 'efectivo', filas: [{ productoId: '', cantidad: 1 }] };
    this.fCompra = { proveedorId: '', filas: [{ productoId: '', cantidad: 10, costo: '' }] };
    this.fCaja = { apertura: 100000, cierre: '' };
    this.guardar();
    this.ir('panel');
    this.avisar('Demo reiniciada.');
  },

  // ── Indicadores del panel ─────────────────────────────────────────────────
  get completadas() { return this.s.ventas.filter((v) => v.estado === 'completada'); },
  get deHoy() {
    const hoy = diaLocal(new Date());
    return this.completadas.filter((v) => diaLocal(v.fecha) === hoy);
  },
  get ventasHoy() { return this.deHoy.reduce((t, v) => t + v.total, 0); },
  get utilidadHoy() {
    return this.deHoy.reduce((t, v) => t + v.items.reduce((u, i) => u + i.cantidad * (i.precio - i.costo), 0), 0);
  },
  get cajasAbiertas() { return this.s.cajas.filter((c) => c.estado === 'abierta'); },
  get efectivoEsperado() { return this.cajasAbiertas.reduce((t, c) => t + c.sistema, 0); },
  get stockBajoTotal() {
    return this.s.sedes.reduce((n, sede) => n + this.s.productos.filter((p) => this.stock(sede.id, p.id) <= p.minimo).length, 0);
  },

  // ── Caja ──────────────────────────────────────────────────────────────────
  get cajaAbierta() { return this.s.cajas.find((c) => c.sedeId === this.sedeId && c.estado === 'abierta'); },
  get cajasDeSede() {
    return this.s.cajas.filter((c) => c.sedeId === this.sedeId).slice().reverse().slice(0, 8);
  },
  abrirCaja() {
    this.error = '';
    const monto = Number(this.fCaja.apertura);
    if (this.cajaAbierta) return this.fallo('Ya hay una caja abierta en esta sede.');
    if (!Number.isFinite(monto) || monto < 0) return this.fallo('Escribe el efectivo con el que abres la caja.');
    this.s.cajas.push({
      id: this.s.cajas.length + 1,
      sedeId: this.sedeId,
      turno: 'Tarde',
      fechaApertura: new Date().toISOString(),
      fechaCierre: null,
      apertura: monto,
      sistema: monto,
      cierre: null,
      diferencia: null,
      estado: 'abierta',
    });
    this.s.recorrido.caja = true;
    this.guardar();
    this.avisar(`Caja abierta en ${this.nombreSede(this.sedeId)} con ${this.dinero(monto)}.`);
  },
  cerrarCaja() {
    this.error = '';
    const caja = this.cajaAbierta;
    const contado = Number(this.fCaja.cierre);
    if (!caja) return this.fallo('No hay caja abierta en esta sede.');
    if (this.fCaja.cierre === '' || !Number.isFinite(contado) || contado < 0) {
      return this.fallo('Escribe cuánto efectivo contaste en la caja.');
    }
    caja.cierre = contado;
    caja.diferencia = contado - caja.sistema;
    caja.fechaCierre = new Date().toISOString();
    caja.estado = 'cerrada';
    this.fCaja.cierre = '';
    this.s.recorrido.cierre = true;
    this.guardar();
    const d = caja.diferencia;
    this.avisar(d === 0 ? 'Caja cerrada. Cuadró exacto.' : `Caja cerrada con ${d > 0 ? 'sobrante' : 'faltante'} de ${this.dinero(Math.abs(d))}.`);
  },

  // ── Ventas ────────────────────────────────────────────────────────────────
  get ventasDeSede() {
    return this.s.ventas.filter((v) => v.sedeId === this.sedeId).slice().reverse().slice(0, 12);
  },
  get totalVenta() {
    return this.fVenta.filas.reduce((t, f) => t + (this.producto(f.productoId)?.precio ?? 0) * (Number(f.cantidad) || 0), 0);
  },
  movimiento(productoId, cantidad, tipo, nota) {
    this.s.movimientos.unshift({ fecha: new Date().toISOString(), sedeId: this.sedeId, productoId, cantidad, tipo, nota });
    this.s.movimientos.length = Math.min(this.s.movimientos.length, 100);
  },
  /** Suma las filas repetidas del formulario y descarta las vacías. */
  agrupar(filas) {
    const porProducto = new Map();
    for (const f of filas) {
      if (!f.productoId) continue;
      const cantidad = Number(f.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1) return null;
      const previo = porProducto.get(Number(f.productoId));
      porProducto.set(Number(f.productoId), { cantidad: (previo?.cantidad ?? 0) + cantidad, costo: Number(f.costo) });
    }
    return porProducto;
  },
  registrarVenta() {
    this.error = '';
    const caja = this.cajaAbierta;
    if (!caja) return this.fallo('No hay caja abierta en esta sede. Abre caja antes de vender.');
    const lineas = this.agrupar(this.fVenta.filas);
    if (!lineas) return this.fallo('Las cantidades deben ser números enteros mayores que cero.');
    if (!lineas.size) return this.fallo('Agrega al menos un producto.');
    for (const [id, { cantidad }] of lineas) {
      const disponible = this.stock(this.sedeId, id);
      if (disponible < cantidad) {
        return this.fallo(`Stock insuficiente para ${this.producto(id).nombre} (disponible: ${disponible}).`);
      }
    }

    const id = this.s.ventas.length + 1;
    const numero = `V-${String(id).padStart(5, '0')}`;
    const items = [];
    for (const [productoId, { cantidad }] of lineas) {
      const p = this.producto(productoId);
      items.push({ productoId, cantidad, precio: p.precio, costo: p.costo });
      this.s.inventario[`${this.sedeId}-${productoId}`] -= cantidad;
      this.movimiento(productoId, -cantidad, 'Venta', numero);
    }
    const total = items.reduce((t, i) => t + i.cantidad * i.precio, 0);
    if (this.fVenta.metodo === 'efectivo') caja.sistema += total;

    this.s.ventas.push({
      id, numero, sedeId: this.sedeId, cajaId: caja.id, metodo: this.fVenta.metodo,
      fecha: new Date().toISOString(), total, estado: 'completada', items,
    });
    this.fVenta.filas = [{ productoId: '', cantidad: 1 }];
    this.s.recorrido.venta = true;
    this.guardar();
    this.avisar(`Venta ${numero} registrada por ${this.dinero(total)}.`);
  },
  puedeAnular(v) {
    const caja = this.s.cajas.find((c) => c.id === v.cajaId);
    return this.esAdmin && v.estado === 'completada' && caja?.estado === 'abierta';
  },
  anularVenta(v) {
    if (!this.puedeAnular(v)) return;
    if (!confirm(`¿Anular la venta ${v.numero}? Se devuelve el stock y se ajusta la caja.`)) return;
    const caja = this.s.cajas.find((c) => c.id === v.cajaId);
    for (const i of v.items) {
      this.s.inventario[`${v.sedeId}-${i.productoId}`] += i.cantidad;
      this.s.movimientos.unshift({ fecha: new Date().toISOString(), sedeId: v.sedeId, productoId: i.productoId, cantidad: i.cantidad, tipo: 'Anulación', nota: v.numero });
    }
    if (v.metodo === 'efectivo') caja.sistema -= v.total;
    v.estado = 'anulada';
    this.guardar();
    this.avisar(`Venta ${v.numero} anulada. Stock y caja revertidos.`);
  },

  // ── Inventario ────────────────────────────────────────────────────────────
  estadoStock(p) {
    const n = this.stock(this.sedeId, p.id);
    if (n <= 0) return 'sin';
    return n <= p.minimo ? 'bajo' : 'normal';
  },
  get inventarioDeSede() {
    return this.s.productos.filter((p) => !this.soloBajo || this.estadoStock(p) !== 'normal');
  },
  get movimientosDeSede() {
    return this.s.movimientos.filter((m) => m.sedeId === this.sedeId).slice(0, 10);
  },

  // ── Compras ───────────────────────────────────────────────────────────────
  get totalCompra() {
    return this.fCompra.filas.reduce((t, f) => t + (Number(f.costo) || 0) * (Number(f.cantidad) || 0), 0);
  },
  get comprasDeSede() {
    return this.s.compras.filter((c) => c.sedeId === this.sedeId).slice().reverse();
  },
  alElegirProductoCompra(fila) {
    fila.costo = this.producto(fila.productoId)?.costo ?? '';
  },
  registrarCompra() {
    this.error = '';
    if (this.fCompra.filas.some((f) => f.productoId && (!Number.isFinite(Number(f.costo)) || f.costo === '' || Number(f.costo) < 0))) {
      return this.fallo('Escribe el costo unitario de cada producto.');
    }
    const lineas = this.agrupar(this.fCompra.filas);
    if (!lineas) return this.fallo('Las cantidades deben ser números enteros mayores que cero.');
    if (!lineas.size) return this.fallo('Agrega al menos un producto.');

    const id = this.s.compras.length + 1;
    const numero = `C-${String(id).padStart(5, '0')}`;
    const items = [];
    for (const [productoId, { cantidad, costo }] of lineas) {
      items.push({ productoId, cantidad, costo });
      this.s.inventario[`${this.sedeId}-${productoId}`] = this.stock(this.sedeId, productoId) + cantidad;
      this.movimiento(productoId, cantidad, 'Compra', numero);
    }
    const proveedor = this.s.proveedores.find((p) => p.id === Number(this.fCompra.proveedorId));
    const total = items.reduce((t, i) => t + i.cantidad * i.costo, 0);
    this.s.compras.push({ id, numero, sedeId: this.sedeId, proveedor: proveedor?.nombre ?? 'Sin proveedor', fecha: new Date().toISOString(), total, items });
    this.fCompra = { proveedorId: '', filas: [{ productoId: '', cantidad: 10, costo: '' }] };
    this.s.recorrido.compra = true;
    this.guardar();
    this.avisar(`Compra ${numero} registrada. El stock se actualizó.`);
  },

  // ── Recorrido sugerido ────────────────────────────────────────────────────
  get pasos() {
    const r = this.s.recorrido;
    return [
      { hecho: r.caja, texto: 'Abre la caja de la sede', vista: 'caja' },
      { hecho: r.venta, texto: 'Registra una venta en efectivo', vista: 'ventas' },
      { hecho: r.inventario, texto: 'Mira cómo bajó el stock', vista: 'inventario' },
      { hecho: r.compra, texto: 'Registra una compra a un proveedor', vista: 'compras' },
      { hecho: r.cierre, texto: 'Cierra la caja y revisa el cuadre', vista: 'caja' },
      { hecho: r.rol, texto: 'Cambia al rol de cajero', vista: null },
    ];
  },
  get pasosHechos() { return this.pasos.filter((p) => p.hecho).length; },

  // ── Gráficas ──────────────────────────────────────────────────────────────
  dibujar() {
    if (!this.esAdmin || this.vista !== 'panel') return;
    const marino = '#0f2244';
    const acento = '#0ea5e9';
    const completadas = this.completadas;

    const dias = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      dias.push(d);
    }
    const porDia = Object.fromEntries(dias.map((d) => [diaLocal(d), 0]));
    const porMetodo = {};
    const unidades = {};
    for (const v of completadas) {
      const dia = diaLocal(v.fecha);
      if (dia in porDia) porDia[dia] += v.total;
      porMetodo[v.metodo] = (porMetodo[v.metodo] || 0) + v.total;
      for (const i of v.items) unidades[i.productoId] = (unidades[i.productoId] || 0) + i.cantidad;
    }
    const top = Object.entries(unidades).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const metodosOrdenados = Object.entries(porMetodo).sort((a, b) => b[1] - a[1]);

    const pintar = (id, config) => {
      graficas[id]?.destroy();
      const lienzo = document.getElementById(id);
      if (lienzo) graficas[id] = new Chart(lienzo, config);
    };
    const ejeDinero = { ticks: { callback: (v) => (v >= 1e6 ? `$${v / 1e6}M` : `$${v / 1e3}k`) }, grid: { color: '#eef2f7' } };

    pintar('g-dias', {
      type: 'line',
      data: {
        labels: dias.map((d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })),
        datasets: [{ data: Object.values(porDia), borderColor: acento, backgroundColor: 'rgba(14,165,233,.12)', fill: true, tension: 0.35, pointRadius: 2 }],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => pesos.format(c.parsed.y) } } },
        scales: { y: ejeDinero, x: { grid: { display: false } } },
      },
    });
    pintar('g-top', {
      type: 'bar',
      data: {
        labels: top.map(([id]) => this.producto(id).nombre),
        datasets: [{ data: top.map(([, n]) => n), backgroundColor: marino, borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: '#eef2f7' } }, y: { grid: { display: false } } },
      },
    });
    pintar('g-metodos', {
      type: 'doughnut',
      data: {
        labels: metodosOrdenados.map(([m]) => this.nombreMetodo(m)),
        datasets: [{ data: metodosOrdenados.map(([, t]) => t), backgroundColor: [marino, acento, '#10b981', '#f59e0b', '#94a3b8'], borderWidth: 2 }],
      },
      options: {
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12 } },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${pesos.format(c.parsed)}` } },
        },
      },
    });
  },
}));

Alpine.start();
