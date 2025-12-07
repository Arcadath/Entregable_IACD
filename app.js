// IMPORTACIONES
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- SELECTORES GLOBALES ---
const domSelectors = {
  body: document.body,
  formSection: document.getElementById('form-section'),
  itemForm: document.getElementById('item-form'),
  resetBtn: document.getElementById('reset-btn'),
  inventoryListElement: document.getElementById('inventory-list'),
  searchInput: document.getElementById('search'),
  categoryFilter: document.getElementById('filter-category'),
  totalItemsLabel: document.getElementById('total-items'),
  totalValueLabel: document.getElementById('total-value'),
  itemIdInput: document.getElementById('item-id'),
  // Perfil y Auth
  userNameLabel: document.getElementById('user-name'),
  userPhotoImg: document.getElementById('user-photo'),
  btnLogout: document.getElementById('btn-logout'),
  // Inputs
  inputs: {
    name: document.getElementById('name'),
    category: document.getElementById('category'),
    quantity: document.getElementById('quantity'),
    price: document.getElementById('price'),
    supplierEmail: document.getElementById('supplierEmail'),
    dateIn: document.getElementById('dateIn')
  },
  // --- CORRECCIÓN AQUÍ: IDs coinciden con index.html ---
  btnExport: document.getElementById('btn-backup'),
  fileImport: document.getElementById('file-restore')
};

const mxnCurrencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 2
});

// Variable global de inventario
let inventoryList = [];
let currentUserEmail = ""; 

// --- SISTEMA DE PROTECCIÓN Y ARRANQUE ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Acceso autorizado:", user.email);
    currentUserEmail = user.email;

    const nombreDisplay = user.displayName ? user.displayName.split(' ')[0] : "Usuario";
    domSelectors.userNameLabel.textContent = nombreDisplay;
    domSelectors.userPhotoImg.src = user.photoURL || 'https://via.placeholder.com/30';

    domSelectors.body.style.display = 'block';

    inventoryList = loadInventory();
    renderInventory();

  } else {
    window.location.href = "login.html";
  }
});

domSelectors.btnLogout.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});


// --- LÓGICA DE NEGOCIO (INVENTARIO) ---

function getStorageKey() {
  return `inventario_data_${currentUserEmail}`;
}

function loadInventory() {
  try {
    const storedData = localStorage.getItem(getStorageKey());
    if (storedData) return JSON.parse(storedData);
  } catch (error) {
    console.error(error);
  }
  return getInitialSeed(); 
}

function saveInventory(listToSave) {
  localStorage.setItem(getStorageKey(), JSON.stringify(listToSave));
}

function renderInventory() {
  const filteredInventory = getFilteredInventory();
  const fragment = document.createDocumentFragment();
  domSelectors.inventoryListElement.innerHTML = '';

  if (filteredInventory.length === 0) {
    const listItem = document.createElement('li');
    listItem.className = 'inventory-item';
    listItem.style.justifyContent = 'center';
    listItem.style.color = '#6b7280';
    listItem.textContent = 'No se encontraron ítems.';
    fragment.appendChild(listItem);
  } else {
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
  }
  domSelectors.inventoryListElement.appendChild(fragment);
  updateSummary(filteredInventory);
}

function getFilteredInventory() {
  const searchTerm = domSelectors.searchInput.value.trim().toLowerCase();
  const selectedCategory = domSelectors.categoryFilter.value;
  if (!searchTerm && !selectedCategory) return inventoryList;
  return inventoryList.filter(item => {
    return (!searchTerm || item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm)) &&
      (!selectedCategory || item.category === selectedCategory);
  });
}

function updateSummary(list) {
  const qty = list.reduce((sum, item) => sum + item.quantity, 0);
  const val = list.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  domSelectors.totalItemsLabel.textContent = `${qty} unidades`;
  domSelectors.totalValueLabel.textContent = `Valor: ${mxnCurrencyFormatter.format(val)}`;
}

// --- EVENTOS CRUD ---

domSelectors.inventoryListElement.addEventListener('click', (event) => {
  const btn = event.target.closest('button');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const itemId = Number(id);

  if (action === 'edit') {
    populateFormForEdit(itemId);
    domSelectors.formSection.scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'delete') {
    if (confirm('¿Eliminar este ítem permanentemente?')) {
      inventoryList = inventoryList.filter(item => item.id !== itemId);
      saveAndRender();
    }
  }
});

domSelectors.itemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const formValues = {
    name: domSelectors.inputs.name.value.trim(),
    category: domSelectors.inputs.category.value,
    quantity: Number(domSelectors.inputs.quantity.value),
    price: Number(domSelectors.inputs.price.value),
    supplierEmail: domSelectors.inputs.supplierEmail.value.trim(),
    dateIn: domSelectors.inputs.dateIn.value
  };

  const currentId = domSelectors.itemIdInput.value;

  if (currentId) {
    const index = inventoryList.findIndex(i => i.id === Number(currentId));
    if (index !== -1) inventoryList[index] = { id: Number(currentId), ...formValues };
  } else {
    const newId = inventoryList.length ? Math.max(...inventoryList.map(i => i.id)) + 1 : 1;
    inventoryList.push({ id: newId, ...formValues });
  }

  saveAndRender();
  resetForm();
  showToast('Cambios guardados');
});

domSelectors.resetBtn.addEventListener('click', resetForm);
domSelectors.searchInput.addEventListener('input', renderInventory);
domSelectors.categoryFilter.addEventListener('change', renderInventory);

// --- SISTEMA DE RESPALDO (EXPORT / IMPORT) ---

domSelectors.btnExport.addEventListener('click', () => {
  if (inventoryList.length === 0) return alert('Nada que exportar');
  const blob = new Blob([JSON.stringify(inventoryList, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${currentUserEmail}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

domSelectors.fileImport.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('Se reemplazarán los datos actuales con este archivo. ¿Continuar?')) {
    e.target.value = ''; return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data)) {
        inventoryList = data;
        saveAndRender();
        alert('Restauración exitosa');
      }
    } catch (err) { alert('Archivo inválido'); }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// --- UTILIDADES ---
function saveAndRender() {
  saveInventory(inventoryList);
  renderInventory();
}

function validateForm() {
  return domSelectors.itemForm.checkValidity();
}

function resetForm() {
  domSelectors.itemForm.reset();
  domSelectors.itemIdInput.value = '';
}

function populateFormForEdit(id) {
  const item = inventoryList.find(i => i.id === id);
  if (!item) return;
  domSelectors.itemIdInput.value = item.id;
  domSelectors.inputs.name.value = item.name;
  domSelectors.inputs.category.value = item.category;
  domSelectors.inputs.quantity.value = item.quantity;
  domSelectors.inputs.price.value = item.price;
  domSelectors.inputs.supplierEmail.value = item.supplierEmail;
  domSelectors.inputs.dateIn.value = item.dateIn;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function getInitialSeed() {
  return [
    { id: 1, name: "Producto Ejemplo", category: "Otros", quantity: 10, price: 100, supplierEmail: "test@test.com", dateIn: "2025-01-01" }
  ];
}

function showToast(msg) { console.log(msg); }