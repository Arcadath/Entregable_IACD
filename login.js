// login.js
import { auth, provider } from './firebase-init.js';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // Añadí imports para email/pass

const btnGoogle = document.getElementById('google-login-btn');
const errorMsg = document.getElementById('error-msg');
const emailForm = document.getElementById('email-form'); // Referencia al formulario

// MONITOR DE ESTADO: Si ya está logueado, redirigir a inv.html
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Redirigir al inventario
        window.location.href = "inv.html"; 
    }
});

// Lógica Google
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
            showError("Error: " + error.message);
        }
    });
}

// Lógica Email/Password
if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Intentamos loguear
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            // Si el usuario no existe, podrías intentar registrarlo o mostrar error
            // Aquí un ejemplo simple de manejo de error:
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                showError("Usuario o contraseña incorrectos.");
            } else {
                showError(error.message);
            }
        }
    });
}

function showError(msg) {
    if(errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
}
