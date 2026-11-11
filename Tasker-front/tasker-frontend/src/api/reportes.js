export const TIPOS_REPORTE = {
  servicio: "Problema con un servicio",
  pago: "Pago",
  usuario: "Comportamiento de un usuario",
  bug: "Falla de la plataforma",
  otro: "Otro",
};

export const ESTADOS_REPORTE = {
  pendiente: { label: "Pendiente", cls: "bg-miel text-miel-dark" },
  revisado: { label: "En revisión", cls: "bg-stone-100 text-tinta" },
  resuelto: { label: "Resuelto", cls: "bg-menta text-menta-dark" },
};

// Estados de tarea en los que se puede abrir una disputa (igual que el backend)
export const ESTADOS_DISPUTABLES = ["en_progreso", "completada"];
