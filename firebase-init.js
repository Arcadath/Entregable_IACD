// IMPORTANTE: Ambas URLs deben tener la misma versión (10.7.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsC_F7esBrqQtXgv71_r1ZicrYqiX25e8",
    authDomain: "gestor-de-inventario-25272.firebaseapp.com",
    projectId: "gestor-de-inventario-25272",
    storageBucket: "gestor-de-inventario-25272.firebasestorage.app",
    messagingSenderId: "519091772384",
    appId: "1:519091772384:web:06e982e86c722ff126a985"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };