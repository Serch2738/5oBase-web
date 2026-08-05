# Cómo activar la agenda compartida (gratis, ~10 minutos)

Ahorita la página funciona en **modo demostración**: el calendario se guarda
solo en el navegador de cada quien. Para que el grupo marque una fecha y
**todos** (tú, tus contrataciones, cualquier visitante) la vean al instante,
conecta el sitio a Firebase (de Google). Es gratis para este tamaño de uso.

## 1. Crea el proyecto
1. Entra a https://console.firebase.google.com y da clic en **"Agregar proyecto"**.
2. Ponle un nombre, por ejemplo `5obase-agenda`. Puedes desactivar Google Analytics.
3. Espera a que se cree el proyecto.

## 2. Activa la base de datos (Firestore)
1. En el menú izquierdo entra a **Compilación → Firestore Database**.
2. Da clic en **"Crear base de datos"**.
3. Elige **modo producción** y la región más cercana (por ejemplo `us-central`).
4. Ve a la pestaña **Reglas** y pega esto (permite que cualquiera *lea* la
   agenda, pero solo un usuario que haya iniciado sesión pueda *escribir*):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /agenda/{fecha} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
5. Da clic en **Publicar**.

## 3. Crea el usuario del grupo (administrador)
1. En el menú izquierdo entra a **Compilación → Authentication**.
2. Da clic en **"Comenzar"** y activa el proveedor **Correo electrónico/contraseña**.
3. Ve a la pestaña **Users → Add user** y crea el usuario con el correo y
   contraseña que usará el grupo para entrar a marcar fechas (por ejemplo
   `jl485183@gmail.com`).

## 4. Copia tu configuración
1. En el menú izquierdo, da clic en el engrane ⚙️ → **Configuración del proyecto**.
2. Baja hasta **Tus apps** y da clic en el ícono `</>` (Web) para crear una app web.
3. Ponle un nombre (por ejemplo `sitio-5obase`) y da clic en **Registrar app**.
4. Firebase te mostrará un bloque `firebaseConfig = {...}`. Copia esos valores.

## 5. Pégalos en el sitio
Abre el archivo `js/firebase-config.js` de esta carpeta y reemplaza los
valores de ejemplo por los tuyos:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "5obase-agenda.firebaseapp.com",
  projectId: "5obase-agenda",
  storageBucket: "5obase-agenda.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

Guarda el archivo y vuelve a publicar el sitio. El aviso amarillo de "modo
demostración" desaparecerá automáticamente y la agenda ya quedará compartida
para todos.

## Cómo se usa después de conectarlo
- Cualquier visitante puede **ver** el calendario y tocar un día para ver si
  está disponible.
- El botón redondo con el candado, abajo a la derecha, es para que el grupo
  **inicie sesión** con el correo y contraseña del paso 3.
- Ya con la sesión iniciada, al tocar un día se abre un formulario para
  marcarlo como disponible, en proceso o confirmado, con nombre del evento
  y una nota interna (la nota no es visible para el público).

## ¿Dónde publico el sitio?
Cualquier hosting estático sirve (todo el sitio son archivos HTML/CSS/JS):
- **Firebase Hosting** (queda todo en un solo lugar, gratis): `firebase init hosting` → `firebase deploy`.
- **Netlify** o **Vercel**: arrastra la carpeta del sitio a su panel.
- Un hosting tradicional por FTP también funciona; solo sube todos los archivos tal cual están.
