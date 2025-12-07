// inv.js
// Importamos Firestore
import { db } from './firebase-init.js'; 
import { 
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Estado local del módulo
let inventoryList = [];
let currentUserEmail = ""; 
let editingId = null;

// Formateador de moneda
const mxnCurrencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 2
});

// SELECTORES (Solo los relacionados con el inventario)
const invDOM = {
  formSection: document.getElementById('form-section'),
  itemForm: document.getElementById('item-form'),
  resetBtn: document.getElementById('reset-btn'),
  inventoryListElement: document.getElementById('inventory-list'),
  searchInput: document.getElementById('search'),
  categoryFilter: document.getElementById('filter-category'),
  totalItemsLabel: document.getElementById('total-items'),
  totalValueLabel: document.getElementById('total-value'),
  inputs: {
    name: document.getElementById('name'),
    category: document.getElementById('category'),
    quantity: document.getElementById('quantity'),
    price: document.getElementById('price'),
    supplierEmail: document.getElementById('supplierEmail'),
    dateIn: document.getElementById('dateIn')
  },
  btnExport: document.getElementById('btn-backup'),
  btnRestore: document.getElementById('btn-restore')
};

/**
 * Función principal que inicia el módulo de inventario.
 * Se llama desde session.js una vez que el usuario está autenticado.
 */
export async function initInventory(user) {
    currentUserEmail = user.email;
    
    // Configurar Listeners (se configuran una sola vez al iniciar)
    setupEventListeners();
    
    // Cargar datos iniciales
    await loadInventoryFromCloud();
}

// --- FUNCIONES CRUD ---

async function loadInventoryFromCloud() {
  invDOM.inventoryListElement.innerHTML = '<li class="inventory-item" style="justify-content:center">Cargando datos...</li>';
  
  try {
    const querySnapshot = await getDocs(collection(db, "usuarios", currentUserEmail, "inventario"));
    inventoryList = [];
    querySnapshot.forEach((doc) => {
        inventoryList.push({ id: doc.id, ...doc.data() });
    });
    renderInventory();
  } catch (error) {
    console.error("Error al cargar:", error);
    showToast("Error de conexión al cargar datos");
  }
}

async function createItem(data) {
  try {
    const docRef = await addDoc(collection(db, "usuarios", currentUserEmail, "inventario"), data);
    inventoryList.push({ id: docRef.id, ...data });
    renderInventory();
    showToast("Ítem guardado en la nube");
  } catch (error) {
    console.error("Error creando:", error);
    showToast("Error al guardar");
  }
}

async function updateItem(id, data) {
  try {
    const itemRef = doc(db, "usuarios", currentUserEmail, "inventario", id);
    await updateDoc(itemRef, data);
    
    const index = inventoryList.findIndex(i => i.id === id);
    if (index !== -1) inventoryList[index] = { id, ...data };
    
    renderInventory();
    showToast("Ítem actualizado");
  } catch (error) {
    console.error("Error actualizando:", error);
    showToast("Error al actualizar");
  }
}

async function deleteItem(id) {
  try {
    await deleteDoc(doc(db, "usuarios", currentUserEmail, "inventario", id));
    inventoryList = inventoryList.filter(item => item.id !== id);
    renderInventory();
    showToast("Ítem eliminado");
  } catch (error) {
    console.error("Error borrando:", error);
    showToast("Error al eliminar");
  }
}

// --- RENDERIZADO ---

function renderInventory() {
  const filteredInventory = getFilteredInventory();
  invDOM.inventoryListElement.innerHTML = '';

  if (filteredInventory.length === 0) {
    invDOM.inventoryListElement.innerHTML = `
        <li class="inventory-item" style="justify-content:center; color:#6b7280">
            ${inventoryList.length === 0 ? 'Tu inventario está vacío.' : 'No hay coincidencias.'}
        </li>`;
  } else {
    const fragment = document.createDocumentFragment();
    filteredInventory.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = 'inventory-item';
      listItem.innerHTML = `
        <div class="item-left">
          <div class="item-meta">
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="item-sub">${escapeHtml(item.category)} · ${item.dateIn}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="badge">x${item.quantity}</div>
          <div class="item-sub" style="font-weight:500">${mxnCurrencyFormatter.format(item.price)}</div>
          <button class="small-btn" data-action="edit" data-id="${item.id}">✏️</button>
          <button class="small-btn" data-action="delete" data-id="${item.id}">🗑️</button>
        </div>
      `;
      fragment.appendChild(listItem);
    });
    invDOM.inventoryListElement.appendChild(fragment);
  }
  updateSummary(filteredInventory);
}

function getFilteredInventory() {
  const searchTerm = invDOM.searchInput.value.trim().toLowerCase();
  const selectedCategory = invDOM.categoryFilter.value;
  
  if (!searchTerm && !selectedCategory) return inventoryList;
  
  return inventoryList.filter(item => {
    const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm) || 
        item.category.toLowerCase().includes(searchTerm);
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
}

function updateSummary(list) {
  const qty = list.reduce((sum, item) => sum + item.quantity, 0);
  const val = list.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  invDOM.totalItemsLabel.textContent = `${qty} unidades`;
  invDOM.totalValueLabel.textContent = `Valor: ${mxnCurrencyFormatter.format(val)}`;
}

// --- SETUP EVENT LISTENERS ---

function setupEventListeners() {
    // Click en lista (Delegación de eventos)
    invDOM.inventoryListElement.addEventListener('click', (event) => {
      const btn = event.target.closest('button');
      if (!btn) return;
      
      const { action, id } = btn.dataset;
      
      if (action === 'edit') {
        populateFormForEdit(id);
        invDOM.formSection.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'delete') {
        if (confirm('¿Eliminar este ítem permanentemente?')) {
          deleteItem(id);
        }
      }
    });

    // Submit Formulario
    invDOM.itemForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      // Validación básica HTML5
      if (!invDOM.itemForm.checkValidity()) {
          invDOM.itemForm.reportValidity();
          return;
      }

      const formValues = {
        name: invDOM.inputs.name.value.trim(),
        category: invDOM.inputs.category.value,
        quantity: Number(invDOM.inputs.quantity.value),
        price: Number(invDOM.inputs.price.value),
        supplierEmail: invDOM.inputs.supplierEmail.value.trim(),
        dateIn: invDOM.inputs.dateIn.value
      };

      const submitBtn = invDOM.itemForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";

      if (editingId) {
        await updateItem(editingId, formValues);
      } else {
        await createItem(formValues);
      }

      resetForm();
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar";
    });

    // Reset, Búsqueda y Filtros
    invDOM.resetBtn.addEventListener('click', resetForm);
    invDOM.searchInput.addEventListener('input', renderInventory);
    invDOM.categoryFilter.addEventListener('change', renderInventory);

    // Exportar
    invDOM.btnExport.addEventListener('click', () => {
      if (inventoryList.length === 0) return alert('Nada que exportar');
      const blob = new Blob([JSON.stringify(inventoryList, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${currentUserEmail}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Importar
    invDOM.btnRestore.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!confirm('Esto agregará los datos del archivo a tu nube. ¿Continuar?')) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data)) {
              showToast("Iniciando importación...");
              let count = 0;
              for (const item of data) {
                const { id, ...itemData } = item; 
                await createItem(itemData);
                count++;
              }
              alert(`Importados ${count} ítems.`);
            }
          } catch (err) {
            console.error(err);
            alert('Archivo JSON inválido.');
          }
        };
        reader.readAsText(file);
      };
      
      fileInput.click();
    });
}

// --- UTILIDADES ---

function populateFormForEdit(id) {
  const item = inventoryList.find(i => i.id === id);
  if (!item) return;

  editingId = id; 
  invDOM.inputs.name.value = item.name;
  invDOM.inputs.category.value = item.category;
  invDOM.inputs.quantity.value = item.quantity;
  invDOM.inputs.price.value = item.price;
  invDOM.inputs.supplierEmail.value = item.supplierEmail;
  invDOM.inputs.dateIn.value = item.dateIn;

  document.getElementById('form-title').textContent = `Editando: ${item.name}`;
}

function resetForm() {
  invDOM.itemForm.reset();
  editingId = null;
  document.getElementById('form-title').textContent = "Agregar Item";
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function showToast(msg) { 
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}