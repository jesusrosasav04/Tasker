const pool = require("../config/db");
const { success, error } = require("../utils/response");
const { POSTULACIONES_GRATIS, PAQUETES } = require("../config/creditos");

// Stripe se carga solo si hay llave. Sin llave → modo simulado (para demo).
let stripeClient = null;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    try {
      stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY);
    } catch {
      throw new Error("Falta instalar el paquete de Stripe: npm install stripe");
    }
  }
  return stripeClient;
}

// Perfil de trabajador a partir del usuarios.id del token
async function getPerfil(usuarioId) {
  const [[perfil]] = await pool.query(
    "SELECT id, plan, creditos FROM trabajador WHERE usuario_id = ?",
    [usuarioId],
  );
  return perfil || null;
}

// Suma créditos de forma idempotente: un mismo pago (referencia) nunca se acredita dos veces
async function acreditar(perfilId, creditos, referencia, descripcion) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (referencia) {
      const [[ya]] = await conn.query(
        "SELECT id FROM movimientos_credito WHERE referencia_pago = ?",
        [referencia],
      );
      if (ya) {
        await conn.rollback();
        return false;
      }
    }
    await conn.query("UPDATE trabajador SET creditos = creditos + ? WHERE id = ?", [creditos, perfilId]);
    await conn.query(
      `INSERT INTO movimientos_credito (trabajador_id, tipo, cantidad, descripcion, referencia_pago)
       VALUES (?, 'compra', ?, ?, ?)`,
      [perfilId, creditos, descripcion, referencia],
    );
    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") return false; // carrera: ya se acreditó
    throw e;
  } finally {
    conn.release();
  }
}

// GET /api/creditos — estado del plan del trabajador
const getEstado = async (req, res) => {
  try {
    const perfil = await getPerfil(req.user.id);
    if (!perfil) return error(res, "No tienes un perfil de trabajador", 400);

    const [[{ usadas }]] = await pool.query(
      "SELECT COUNT(*) AS usadas FROM postulaciones WHERE trabajador_id = ?",
      [req.user.id],
    );
    const [movimientos] = await pool.query(
      `SELECT id, tipo, cantidad, descripcion, created_at
       FROM movimientos_credito WHERE trabajador_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [perfil.id],
    );

    return success(res, {
      plan: perfil.plan,
      creditos: perfil.creditos,
      gratis_total: POSTULACIONES_GRATIS,
      gratis_restantes: Math.max(0, POSTULACIONES_GRATIS - usadas),
      postulaciones_usadas: usadas,
      paquetes: PAQUETES,
      movimientos,
      stripe_activo: Boolean(process.env.STRIPE_SECRET_KEY),
    });
  } catch (err) {
    console.error("Error getEstado créditos:", err);
    return error(res, "Error al obtener tu plan", 500);
  }
};

// POST /api/creditos/comprar — inicia la compra de un paquete
const comprar = async (req, res) => {
  const paquete = PAQUETES.find((p) => p.id === req.body.paquete_id);
  if (!paquete) return error(res, "Paquete inválido", 400);

  try {
    const perfil = await getPerfil(req.user.id);
    if (!perfil) return error(res, "No tienes un perfil de trabajador", 400);

    const stripe = getStripe();

    // Sin llaves de Stripe → modo simulado (acredita directo)
    if (!stripe) {
      await acreditar(perfil.id, paquete.creditos, null, `Compra simulada: ${paquete.nombre}`);
      return success(res, { simulado: true }, "Créditos agregados (modo simulado)");
    }

    // Con Stripe → sesión de Checkout (modo de prueba con llaves sk_test_)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Desde la API 2026-09-30 se usa allowed_payment_method_types (payment_method_types ya no existe)
      allowed_payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: `Tasker — ${paquete.nombre} (${paquete.creditos} créditos)` },
            unit_amount: paquete.precio * 100, // centavos
          },
          quantity: 1,
        },
      ],
      metadata: { usuario_id: String(req.user.id), paquete_id: paquete.id },
      success_url: `${process.env.FRONTEND_URL}/mi-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/mi-plan?cancelado=1`,
    });

    return success(res, { url: session.url });
  } catch (err) {
    console.error("Error comprar créditos:", err);
    // El detalle técnico queda en la consola; al usuario, un mensaje claro
    return error(res, "No se pudo iniciar el pago. Intenta de nuevo en unos minutos.", 500);
  }
};

// GET /api/creditos/confirmar?session_id=... — verifica el pago con Stripe y acredita
// (Se llama al volver del checkout; no necesita webhook para funcionar en local)
const confirmar = async (req, res) => {
  const { session_id } = req.query;
  try {
    const stripe = getStripe();
    if (!stripe) return error(res, "Stripe no está configurado", 400);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid")
      return error(res, "El pago no se completó", 400);
    if (session.metadata?.usuario_id !== String(req.user.id))
      return error(res, "Este pago no corresponde a tu cuenta", 403);

    const paquete = PAQUETES.find((p) => p.id === session.metadata.paquete_id);
    if (!paquete) return error(res, "Paquete inválido", 400);

    const perfil = await getPerfil(req.user.id);
    const nuevo = await acreditar(perfil.id, paquete.creditos, session.id, `Compra: ${paquete.nombre}`);

    return success(
      res,
      { acreditado: nuevo, creditos: paquete.creditos },
      nuevo ? "¡Pago confirmado! Créditos agregados." : "Este pago ya estaba acreditado.",
    );
  } catch (err) {
    console.error("Error confirmar pago:", err);
    return error(res, "No se pudo confirmar el pago", 500);
  }
};

module.exports = { getEstado, comprar, confirmar };
