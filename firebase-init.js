// En caso se implementar este proyecto en otro modificar las credenciales de Firebase aquí.
// Por convenniencia se se usa la versión 10.7.1 de Firebase, pero se puede actualizar a la última versión si es necesario.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsC_F7esBrqQtXgv71_r1ZicrYqiX25e8", // Recuerda proteger esto en producción
    authDomain: "gestor-de-inventario-25272.firebaseapp.com",
    projectId: "gestor-de-inventario-25272",
    storageBucket: "gestor-de-inventario-25272.firebasestorage.app",
    messagingSenderId: "519091772384",
    appId: "1:519091772384:web:06e982e86c722ff126a985"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); // Inicializamos Firestore

export { auth, provider, db };