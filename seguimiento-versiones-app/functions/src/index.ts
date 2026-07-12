import * as admin from "firebase-admin";

admin.initializeApp();

export { syncZoho, syncZohoScheduled } from "./sync";
export { crearUsuario } from "./usuarios";
