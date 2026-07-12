import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/** Solo el super admin (según su doc en Firestore) puede crear usuarios. */
async function assertSuperAdmin(email: string | undefined) {
  if (!email) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  const doc = await admin.firestore().doc(`usuarios/${email}`).get();
  if (!doc.exists || doc.data()?.rol !== "super") {
    throw new HttpsError("permission-denied", "Solo el super admin puede hacer esto.");
  }
}

/**
 * Crea (o reactiva) un usuario: cuenta de Firebase Auth con contraseña temporal + doc en
 * `usuarios/{email}`. Devuelve la contraseña temporal para que el super admin se la pase.
 * El usuario la cambia después (flujo de cambio de contraseña queda para más adelante).
 */
export const crearUsuario = onCall(async (request) => {
  await assertSuperAdmin(request.auth?.token.email as string | undefined);

  const { email, nombre, rol } = request.data as {
    email: string;
    nombre: string;
    rol: "super" | "lider" | "analista" | "calendario";
  };
  const correo = (email ?? "").trim().toLowerCase();
  if (!correo.endsWith("@gmtransporterp.com") || !nombre?.trim()) {
    throw new HttpsError("invalid-argument", "Correo @gmtransporterp.com y nombre requeridos.");
  }

  const tempPassword = "GM" + Math.floor(100000 + Math.random() * 900000);

  // Crea la cuenta de Auth si no existe.
  try {
    await admin.auth().getUserByEmail(correo);
  } catch {
    await admin.auth().createUser({ email: correo, password: tempPassword, displayName: nombre });
  }

  await admin.firestore().doc(`usuarios/${correo}`).set(
    {
      nombre: nombre.trim(),
      rol: rol ?? "analista",
      puedeVer: "Todos los tickets",
      puedeMover: "propio",
      puedeActualizar: false,
    },
    { merge: true }
  );

  return { ok: true, tempPassword };
});
