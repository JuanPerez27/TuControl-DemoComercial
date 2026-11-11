// Datos de ejemplo de la demo: un negocio ficticio con dos sedes.
// Todo se genera en el navegador; no hay servidor ni datos reales.

export const VERSION = 1;

export const METODOS = [
  { codigo: 'efectivo', nombre: 'Efectivo' },
  { codigo: 'nequi', nombre: 'Nequi' },
  { codigo: 'daviplata', nombre: 'Daviplata' },
  { codigo: 'transferencia', nombre: 'Transferencia' },
  { codigo: 'tarjeta', nombre: 'Tarjeta' },
];

const SEDES = [
  { id: 1, nombre: 'Centro' },
  { id: 2, nombre: 'Norte' },
];

const PROVEEDORES = [
  { id: 1, nombre: 'Panadería El Trigal' },
  { id: 2, nombre: 'Distribuidora Andina' },
  { id: 3, nombre: 'Tostadora Sierra Nevada' },
];

// [nombre, categoría, precio de venta, costo, stock mínimo, popularidad]
const CATALOGO = [
  ['Café americano', 'Bebidas', 4500, 900, 15, 10],
  ['Capuchino', 'Bebidas', 7000, 1800, 15, 9],
  ['Latte', 'Bebidas', 7500, 2000, 15, 7],
  ['Chocolate caliente', 'Bebidas', 6500, 1700, 10, 4],
  ['Té chai', 'Bebidas', 7000, 1900, 8, 3],
  ['Jugo natural', 'Bebidas', 7000, 2200, 10, 5],
  ['Agua en botella', 'Bebidas', 3000, 1100, 12, 4],
  ['Gaseosa', 'Bebidas', 4000, 1900, 12, 3],
  ['Pan de bono', 'Comida', 3000, 900, 12, 9],
  ['Almojábana', 'Comida', 3000, 950, 12, 5],
  ['Empanada', 'Comida', 3500, 1200, 12, 7],
  ['Croissant', 'Comida', 5500, 2100, 10, 6],
  ['Sándwich de pollo', 'Comida', 14000, 6200, 8, 4],
  ['Torta de zanahoria', 'Comida', 8500, 3000, 6, 3],
  ['Brownie', 'Comida', 6000, 2000, 8, 5],
  ['Galleta de avena', 'Comida', 3500, 1000, 10, 4],
  ['Café en grano 500 g', 'Otros', 32000, 19000, 5, 1],
  ['Termo La Esquina', 'Otros', 45000, 26000, 3, 1],
];

// Stock inicial que queda por debajo del mínimo, para que la demo muestre alertas.
const STOCK_BAJO = { '1-12': 4, '1-15': 0, '1-6': 7, '2-11': 5, '2-14': 2 };

/** Generador pseudoaleatorio con semilla: la demo se ve igual para todos. */
function azar(semilla) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function diaLocal(fecha) {
  const d = new Date(fecha);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function crearSemilla(ahora = new Date()) {
  const r = azar(20261107);
  const entero = (min, max) => Math.floor(r() * (max - min + 1)) + min;

  const productos = CATALOGO.map(([nombre, categoria, precio, costo, minimo], i) => ({
    id: i + 1,
    nombre,
    categoria,
    precio,
    costo,
    minimo,
  }));

  // Ruleta ponderada por popularidad para elegir qué se vende.
  const ruleta = CATALOGO.flatMap(([, , , , , peso], i) => Array(peso).fill(i + 1));
  const ruletaMetodos = ['efectivo', 'efectivo', 'efectivo', 'efectivo', 'nequi', 'nequi', 'nequi', 'daviplata', 'transferencia', 'tarjeta', 'tarjeta'];

  const inventario = {};
  for (const sede of SEDES) {
    for (const p of productos) {
      const clave = `${sede.id}-${p.id}`;
      inventario[clave] = clave in STOCK_BAJO ? STOCK_BAJO[clave] : p.minimo + entero(6, 40);
    }
  }

  const inicioHoy = new Date(ahora);
  inicioHoy.setHours(0, 0, 0, 0);

  const ventas = [];
  const cajas = [];
  let nVenta = 0;
  let nCaja = 0;

  for (let hace = 13; hace >= 0; hace--) {
    const dia = new Date(inicioHoy);
    dia.setDate(dia.getDate() - hace);
    const finDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
    const esHoy = hace === 0;

    for (const sede of SEDES) {
      const apertura = 100000;
      const caja = {
        id: ++nCaja,
        sedeId: sede.id,
        turno: esHoy ? 'Mañana' : 'Día',
        fechaApertura: null,
        fechaCierre: null,
        apertura,
        sistema: apertura,
        cierre: null,
        diferencia: null,
        estado: 'cerrada',
      };

      let cuantas = entero(9, 15) + (finDeSemana ? 5 : 0) + (sede.id === 1 ? 3 : 0);
      if (esHoy) cuantas = entero(5, 7);

      // Las ventas de hoy se reparten entre el inicio del día y este momento.
      // Si ya pasó la mañana, las ventas de hoy empiezan a las 7:00; si no, desde la medianoche.
      const inicioMs = dia.getTime() + (ahora.getTime() - dia.getTime() > 8 * 3600e3 ? 7 * 3600e3 : 0);
      const ventanaMs = esHoy ? Math.max(ahora.getTime() - inicioMs, 60e3) : 0;

      const delDia = [];
      for (let k = 0; k < cuantas; k++) {
        const fecha = esHoy
          ? new Date(inicioMs + r() * ventanaMs * 0.95)
          : new Date(dia.getTime() + (7 + r() * 12) * 3600e3);

        const lineas = {};
        const nItems = entero(1, 3);
        for (let j = 0; j < nItems; j++) {
          const id = ruleta[entero(0, ruleta.length - 1)];
          lineas[id] = (lineas[id] || 0) + entero(1, 2);
        }
        const items = Object.entries(lineas).map(([id, cantidad]) => {
          const p = productos[id - 1];
          return { productoId: p.id, cantidad, precio: p.precio, costo: p.costo };
        });
        const total = items.reduce((s, i) => s + i.cantidad * i.precio, 0);
        const metodo = ruletaMetodos[entero(0, ruletaMetodos.length - 1)];
        if (metodo === 'efectivo') caja.sistema += total;

        delDia.push({ sedeId: sede.id, cajaId: caja.id, metodo, fecha: fecha.toISOString(), total, estado: 'completada', items });
      }

      // Cierre de la caja: casi siempre cuadra; a veces hay sobrante o faltante.
      const descuadres = [0, 0, 0, 0, 0, 0, -2000, 1000, -5000, 0];
      const diferencia = descuadres[entero(0, descuadres.length - 1)];
      caja.cierre = caja.sistema + diferencia;
      caja.diferencia = diferencia;
      caja.fechaApertura = new Date(esHoy ? inicioMs : dia.getTime() + 6.5 * 3600e3).toISOString();
      caja.fechaCierre = esHoy
        ? new Date(inicioMs + ventanaMs * 0.97).toISOString()
        : new Date(dia.getTime() + 19.5 * 3600e3).toISOString();

      cajas.push(caja);
      ventas.push(...delDia);
    }
  }

  ventas.sort((a, b) => a.fecha.localeCompare(b.fecha));
  for (const v of ventas) {
    v.id = ++nVenta;
    v.numero = `V-${String(nVenta).padStart(5, '0')}`;
  }

  return {
    version: VERSION,
    creado: diaLocal(ahora),
    empresa: 'Café La Esquina',
    rol: 'admin',
    sedes: SEDES,
    proveedores: PROVEEDORES,
    productos,
    inventario,
    cajas,
    ventas,
    compras: [],
    movimientos: [],
    recorrido: { caja: false, venta: false, inventario: false, compra: false, cierre: false, rol: false },
  };
}
