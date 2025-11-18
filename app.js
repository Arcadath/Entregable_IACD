// Inventario Fácil - app.js (persistencia con localStorage)
// Key para localStorage
const STORAGE_KEY = 'inventario_facil_v1';

// Selectores DOM
const selectors = {
  formSection: document.getElementById('form-section'),
  itemForm: document.getElementById('item-form'),
  toggleFormBtn: document.getElementById('toggle-form'),
  resetBtn: document.getElementById('reset-btn'),
  inventoryList: document.getElementById('inventory-list'),
  search: document.getElementById('search'),
  filterCategory: document.getElementById('filter-category'),
  totalItems: document.getElementById('total-items'),
  totalValue: document.getElementById('total-value'),
  itemId: document.getElementById('item-id')
};

// Cargar inventario desde localStorage o semilla inicial
function loadInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error leyendo localStorage, se usa semilla.', err);
  }
  // Semilla inicial si no hay datos en storage
  return [
    { id: 1, name: "Auriculares Bluetooth", category: "Electrónica", quantity: 12, price: 499.00, supplierEmail: "ventas@ejemplo.com", dateIn: "2025-11-01" },

    { id: 2, name: "Camiseta de algodón", category: "Ropa", quantity: 35, price: 199.99, supplierEmail: "proveedor@moda.com", dateIn: "2025-10-20" },

    { id: 3, name: "Mouse inalámbrico", category: "Electrónica", quantity: 20, price: 289.50, supplierEmail: "tech@distribuidor.com", dateIn: "2025-10-15" },

    { id: 4, name: "Teclado mecánico RGB", category: "Electrónica", quantity: 8, price: 1399.00, supplierEmail: "contacto@hardwaremx.com", dateIn: "2025-10-10" },

    { id: 5, name: "Pants deportivos", category: "Ropa", quantity: 18, price: 350.00, supplierEmail: "ventas@ropaactiva.com", dateIn: "2025-09-30" },

    { id: 6, name: "Botella térmica 750ml", category: "Hogar", quantity: 42, price: 159.00, supplierEmail: "", dateIn: "2025-09-25" },

    { id: 7, name: "Silla ergonómica", category: "Oficina", quantity: 5, price: 1899.99, supplierEmail: "oficinas@comfort.com", dateIn: "2025-09-18" },

    { id: 8, name: "Cargador USB-C 30W", category: "Electrónica", quantity: 30, price: 249.00, supplierEmail: "power@techsupplier.com", dateIn: "2025-09-10" },

    { id: 9, name: "Zapatillas running", category: "Ropa", quantity: 16, price: 899.00, supplierEmail: "ventas@deportivostore.com", dateIn: "2025-09-05" },

    { id: 10, name: "Velas aromáticas", category: "Hogar", quantity: 25, price: 129.90, supplierEmail: "", dateIn: "2025-08-30" },

    { id: 11, name: "Cuaderno profesional 100 hojas", category: "Oficina", quantity: 40, price: 59.50, supplierEmail: "papeleria@mx.com", dateIn: "2025-08-25" },

    { id: 12, name: "Sudadera con capucha", category: "Ropa", quantity: 22, price: 499.00, supplierEmail: "proveedor@moda.com", dateIn: "2025-08-15" },

    { id: 13, name: "Lámpara LED escritorio", category: "Hogar", quantity: 10, price: 329.00, supplierEmail: "iluminacion@hogar.com", dateIn: "2025-08-10" },

    { id: 14, name: "Paquete de plumas negras (12 pzas)", category: "Oficina", quantity: 60, price: 89.00, supplierEmail: "", dateIn: "2025-07-28" },

    { id: 15, name: "Power Bank 10,000 mAh", category: "Electrónica", quantity: 14, price: 699.00, supplierEmail: "ventas@techplus.com", dateIn: "2025-07-20" }
  ];

}

// Guardar inventario en localStorage
function saveInventory(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('No se pudo guardar en localStorage.', err);
  }
}

// Estado en memoria (se sincroniza con localStorage)
let inventory = loadInventory();

// Render inicial
renderInventory(inventory);

// Eventos UI
if (selectors.toggleFormBtn) {
  selectors.toggleFormBtn.addEventListener('click', () => {
    selectors.formSection.scrollIntoView({ behavior: 'smooth' });
    highlightForm();
  });
}

selectors.resetBtn.addEventListener('click', resetForm);
selectors.search.addEventListener('input', applyFilters);
selectors.filterCategory.addEventListener('change', applyFilters);

selectors.itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const category = form.category.value;
  const quantity = Number(form.quantity.value);
  const price = Number(form.price.value);
  const dateIn = form.dateIn.value;
  if (!name || !category || Number.isNaN(quantity) || Number.isNaN(price) || !dateIn) {
    alert('Por favor complete los campos obligatorios correctamente.');
    return;
  }
  if (quantity < 0 || price < 0) {
    alert('Cantidad y precio deben ser valores no negativos.');
    return;
  }

  const idVal = selectors.itemId.value;
  if (idVal) {
    // Editar
    const id = Number(idVal);
    const idx = inventory.findIndex(i => i.id === id);
    if (idx > -1) {
      inventory[idx] = {
        id,
        name, category, quantity, price,
        supplierEmail: form.supplierEmail.value.trim(),
        dateIn
      };
      saveInventory(inventory);
      showToast('Ítem actualizado.');
    }
  } else {
    // Crear nuevo
    const newId = inventory.length ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    inventory.push({
      id: newId,
      name, category, quantity, price,
      supplierEmail: form.supplierEmail.value.trim(),
      dateIn
    });
    saveInventory(inventory);
    showToast('Ítem agregado.');
  }
  resetForm();
  renderInventory(applyCurrentFiltersTo(inventory));
});

// Resetea formulario
function resetForm() {
  selectors.itemForm.reset();
  selectors.itemId.value = '';
  selectors.itemForm.querySelectorAll('input,select').forEach(el => el.blur());
}

// Render de la lista con datos proporcionados
function renderInventory(list) {
  selectors.inventoryList.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'inventory-item';
    li.textContent = 'No hay ítems en el inventario.';
    selectors.inventoryList.appendChild(li);
  } else {
    list.forEach(item => {
      const li = document.createElement('li');
      li.className = 'inventory-item';
      li.innerHTML = `
        <div class="item-left">
          <div class="item-meta">
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="item-sub">${escapeHtml(item.category)} · Entrada: ${escapeHtml(item.dateIn)}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="badge">${item.quantity} MXM</div>
          <div class="item-sub">$${formatNumber(item.price)}</div>
          <button class="small-btn" data-action="edit" data-id="${item.id}">Editar</button>
          <button class="small-btn" data-action="delete" data-id="${item.id}">Eliminar</button>
        </div>
      `;
      selectors.inventoryList.appendChild(li);
    });
  }
  updateSummary(list);
  selectors.inventoryList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', handleListAction);
  });
}

// Maneja acciones de la lista (editar/eliminar)
function handleListAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  if (action === 'edit') {
    populateFormForEdit(id);
    selectors.formSection.scrollIntoView({ behavior: 'smooth' });
    highlightForm();
  } else if (action === 'delete') {
    if (confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.')) {
      inventory = inventory.filter(i => i.id !== id);
      saveInventory(inventory);
      renderInventory(applyCurrentFiltersTo(inventory));
      showToast('Ítem eliminado.');
    }
  }
}

// Llena formulario para editar
function populateFormForEdit(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  selectors.itemId.value = item.id;
  selectors.itemForm.name.value = item.name;
  selectors.itemForm.category.value = item.category;
  selectors.itemForm.quantity.value = item.quantity;
  selectors.itemForm.price.value = item.price;
  selectors.itemForm.supplierEmail.value = item.supplierEmail || '';
  selectors.itemForm.dateIn.value = item.dateIn;
}

// Filtros
function applyFilters() {
  const q = selectors.search.value.trim().toLowerCase();
  const cat = selectors.filterCategory.value;
  const filtered = inventory.filter(i => {
    const matchesQ = i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
    const matchesCat = !cat || i.category === cat;
    return matchesQ && matchesCat;
  });
  renderInventory(filtered);
}

function applyCurrentFiltersTo(list) {
  const q = selectors.search.value.trim().toLowerCase();
  const cat = selectors.filterCategory.value;
  return list.filter(i => {
    const matchesQ = i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
    const matchesCat = !cat || i.category === cat;
    return matchesQ && matchesCat;
  });
}

// Resumen
function updateSummary(list) {
  const totalItems = list.reduce((s, it) => s + it.quantity, 0);
  const totalValue = list.reduce((s, it) => s + (it.quantity * it.price), 0);
  selectors.totalItems.textContent = `${totalItems} MXM`;
  selectors.totalValue.textContent = `Valor total: $${formatNumber(totalValue)}`;
}

// Pequeño efecto visual al abrir formulario
function highlightForm() {
  selectors.formSection.style.transition = 'box-shadow 200ms ease';
  selectors.formSection.style.boxShadow = '0 4px 18px rgba(11,92,255,0.18)';
  setTimeout(() => selectors.formSection.style.boxShadow = '', 800);
}

// Mensajes simples (se puede mejorar con UI de toast)
function showToast(msg) {
  console.log(msg);
}

// Helpers
function formatNumber(n) {
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sincronización inicial con posibles filtros actuales
renderInventory(applyCurrentFiltersTo(inventory));