// Modelo freemium de Tasker
// - Cada trabajador tiene POSTULACIONES_GRATIS postulaciones sin costo.
// - Después, cada postulación consume 1 crédito.
// - Los créditos se compran en paquetes (precios en MXN).

const POSTULACIONES_GRATIS = 3;

const PAQUETES = [
  { id: "basico", nombre: "Paquete Básico", creditos: 10, precio: 49 },
  { id: "estandar", nombre: "Paquete Estándar", creditos: 25, precio: 99 },
  { id: "pro", nombre: "Paquete Pro", creditos: 60, precio: 199 },
];

module.exports = { POSTULACIONES_GRATIS, PAQUETES };
