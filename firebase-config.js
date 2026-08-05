/* =========================================================
   CONFIGURACIÓN DE LA AGENDA COMPARTIDA
   =========================================================
   Sigue las instrucciones de README-AGENDA.md (5 minutos, gratis)
   y pega aquí los datos que te da Firebase. Mientras dejes los
   valores de ejemplo tal cual, el sitio funciona solo, pero cada
   quien ve la agenda en SU propio navegador (modo demostración).

   Con la configuración real puesta aquí, la agenda se guarda en
   internet y TODOS ven las mismas fechas al instante, incluido
   el grupo desde su celular.
   ========================================================= */

window.FIREBASE_CONFIG = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI.firebaseapp.com",
  projectId: "PEGA_AQUI_TU_PROJECT_ID",
  storageBucket: "PEGA_AQUI.appspot.com",
  messagingSenderId: "000000000000",
  appId: "PEGA_AQUI_TU_APP_ID"
};

/* Correo del administrador (el del grupo) que podrá iniciar sesión
   para marcar fechas. Debes crear este mismo usuario dentro de
   Firebase Authentication (ver README-AGENDA.md, paso 3). */
window.ADMIN_EMAIL_HINT = "jl485183@gmail.com";
