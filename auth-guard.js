// session.js
// Importamos la inicialización del inventario
import { initInventory } from './inv.js'; 
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Elementos del DOM exclusivos de la sesión (Header)
const sessionUI = {
    body: document.body,
    userNameLabel: document.getElementById('user-name'),
    userPhotoImg: document.getElementById('user-photo'),
    btnLogout: document.getElementById('btn-logout')
};

// MONITOR DE ESTADO (Auth Guard)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Sesión validada para:", user.email);
        
        // Actualizar UI del Header
        const nombreDisplay = user.displayName ? user.displayName.split(' ')[0] : "Usuario";
        sessionUI.userNameLabel.textContent = nombreDisplay;
        sessionUI.userPhotoImg.src = user.photoURL || 'https://via.placeholder.com/30';
        
        // Mostrar la aplicación (estaba oculta por CSS)
        sessionUI.body.style.display = 'block';

        // INICIAR LA LÓGICA DEL INVENTARIO (Pasamos el usuario y el email)
        initInventory(user);

    } else {
        // Si no hay usuario, mandar al login
        window.location.href = "index.html";
    }
});

// LÓGICA DE CERRAR SESIÓN
sessionUI.btnLogout.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error al salir:", error);
    });
});