// Inventario - app.js (Versión Final Optimizada y Corregida)
const STORAGE_KEY = 'inventario_facil_v1';

// Selectores de elementos del DOM
const domSelectors = {
  formSection: document.getElementById('form-section'),
  itemForm: document.getElementById('item-form'),
  resetBtn: document.getElementById('reset-btn'),
  inventoryListElement: document.getElementById('inventory-list'),
  searchInput: document.getElementById('search'),
  categoryFilter: document.getElementById('filter-category'),
  totalItemsLabel: document.getElementById('total-items'),
  totalValueLabel: document.getElementById('total-value'),
  itemIdInput: document.getElementById('item-id'),
  inputs: {
    name: document.getElementById('name'),
    category: document.getElementById('category'),
    quantity: document.getElementById('quantity'),
    price: document.getElementById('price'),
    supplierEmail: document.getElementById('supplierEmail'),
    dateIn: document.getElementById('dateIn')
  }
};

// Formateador de moneda MXN
const mxnCurrencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 2
});

// Estado inicial del inventario
let inventoryList = loadInventory();

// Carga el inventario desde localStorage o retorna semilla inicial
function loadInventory() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) return JSON.parse(storedData);
  } catch (error) {
    console.error(error);
  }
  return getInitialSeed();
}

// Guarda el inventario en localStorage
function saveInventory(listToSave) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listToSave));
}

// Renderiza la lista de inventario filtrada en el DOM
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
    filteredInventory.forEach(inventoryItem => {
      const listItem = document.createElement('li');
      listItem.className = 'inventory-item';
      listItem.innerHTML = `
        <div class="item-left">
          <div class="item-meta">
            <div class="item-name">${escapeHtml(inventoryItem.name)}</div>
            <div class="item-sub">${escapeHtml(inventoryItem.category)} · ${inventoryItem.dateIn}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="badge">x${inventoryItem.quantity}</div>
          <div class="item-sub" style="font-weight:500">${mxnCurrencyFormatter.format(inventoryItem.price)}</div>
          <button class="small-btn" data-action="edit" data-id="${inventoryItem.id}">Editar</button>
          <button class="small-btn" data-action="delete" data-id="${inventoryItem.id}">Eliminar</button>
        </div>
      `;
      fragment.appendChild(listItem);
    });
  }
  domSelectors.inventoryListElement.appendChild(fragment);
  updateSummary(filteredInventory);
}

// Filtra el inventario según el término de búsqueda y la categoría seleccionada
function getFilteredInventory() {
  const searchTerm = domSelectors.searchInput.value.trim().toLowerCase();
  const selectedCategory = domSelectors.categoryFilter.value;
  if (!searchTerm && !selectedCategory) return inventoryList;
  return inventoryList.filter(inventoryItem => {
    return (!searchTerm || inventoryItem.name.toLowerCase().includes(searchTerm) || inventoryItem.category.toLowerCase().includes(searchTerm)) &&
      (!selectedCategory || inventoryItem.category === selectedCategory);
  });
}

// Actualiza el resumen de cantidad y valor total en el DOM
function updateSummary(filteredInventory) {
  const totalQuantity = filteredInventory.reduce((sum, inventoryItem) => sum + inventoryItem.quantity, 0);
  const totalInventoryValue = filteredInventory.reduce((sum, inventoryItem) => sum + (inventoryItem.quantity * inventoryItem.price), 0);
  domSelectors.totalItemsLabel.textContent = `${totalQuantity} unidades`;
  domSelectors.totalValueLabel.textContent = `Total: ${mxnCurrencyFormatter.format(totalInventoryValue)}`;
}

// Eventos para limpiar errores de inputs en tiempo real
Object.values(domSelectors.inputs).forEach(inputElement => {
  if (inputElement) {
    inputElement.addEventListener('input', () => inputElement.classList.remove('input-error'));
  }
});

// Delegación de eventos para botones de editar y eliminar
domSelectors.inventoryListElement.addEventListener('click', (event) => {
  const clickedButton = event.target.closest('button');
  if (!clickedButton) return;
  const { action, id } = clickedButton.dataset;
  const clickedItemId = Number(id);

  if (action === 'edit') {
    populateFormForEdit(clickedItemId);
    domSelectors.formSection.scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'delete') {
    if (confirm('¿Eliminar este ítem?')) {
      inventoryList = inventoryList.filter(inventoryItem => inventoryItem.id !== clickedItemId);
      saveAndRender();
      showToast('Ítem eliminado');
    }
  }
});

// Evento de submit del formulario de ítem
domSelectors.itemForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateForm()) {
    showToast('Corrige los campos marcados en rojo.');
    return;
  }

  const formValues = {
    name: domSelectors.inputs.name.value.trim(),
    category: domSelectors.inputs.category.value,
    quantity: Number(domSelectors.inputs.quantity.value),
    price: Number(domSelectors.inputs.price.value),
    supplierEmail: domSelectors.inputs.supplierEmail.value.trim(),
    dateIn: domSelectors.inputs.dateIn.value
  };

  const itemIdValue = domSelectors.itemIdInput.value;

  if (itemIdValue) {
    const itemId = Number(itemIdValue);
    const itemIndex = inventoryList.findIndex(inventoryItem => inventoryItem.id === itemId);
    if (itemIndex !== -1) inventoryList[itemIndex] = { id: itemId, ...formValues };
    showToast('Ítem actualizado');
  } else {
    const newItemId = inventoryList.length ? Math.max(...inventoryList.map(inventoryItem => inventoryItem.id)) + 1 : 1;
    inventoryList.push({ id: newItemId, ...formValues });
    showToast('Ítem agregado');
  }

  saveAndRender();
  resetForm();
});

domSelectors.resetBtn.addEventListener('click', resetForm);
domSelectors.searchInput.addEventListener('input', renderInventory);
domSelectors.categoryFilter.addEventListener('change', renderInventory);

// Valida los campos del formulario
function validateForm() {
  let isValid = true;
  const formFields = [
    domSelectors.inputs.name, domSelectors.inputs.category,
    domSelectors.inputs.quantity, domSelectors.inputs.price,
    domSelectors.inputs.supplierEmail, domSelectors.inputs.dateIn
  ];

  formFields.forEach(field => {
    field.classList.remove('input-error');
    const fieldValue = field.value.trim();
    let hasError = false;

    if (!fieldValue) hasError = true;
    if (field.type === 'number' && (fieldValue === '' || Number(fieldValue) < 0)) hasError = true;

    if (hasError) {
      field.classList.add('input-error');
      isValid = false;
    }
  });
  return isValid;
}

// Limpia el formulario y los errores visuales
function resetForm() {
  domSelectors.itemForm.reset();
  domSelectors.itemIdInput.value = '';
  document.querySelectorAll('.input-error').forEach(element => {
    element.classList.remove('input-error');
  });
}

// Llena el formulario con los datos de un ítem para editar
function populateFormForEdit(itemId) {
  resetForm();
  const inventoryItem = inventoryList.find(inventoryItem => inventoryItem.id === itemId);
  if (!inventoryItem) return;

  domSelectors.itemIdInput.value = inventoryItem.id;
  domSelectors.inputs.name.value = inventoryItem.name;
  domSelectors.inputs.category.value = inventoryItem.category;
  domSelectors.inputs.quantity.value = inventoryItem.quantity;
  domSelectors.inputs.price.value = inventoryItem.price;
  domSelectors.inputs.supplierEmail.value = inventoryItem.supplierEmail || '';
  domSelectors.inputs.dateIn.value = inventoryItem.dateIn;
}

// Guarda el inventario y lo renderiza
function saveAndRender() {
  saveInventory(inventoryList);
  renderInventory();
}

// Previene inyecciones HTML
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
}

// Muestra un mensaje en consola
function showToast(message) {
  console.log('Sistema:', message);
}

// Retorna la semilla inicial del inventario
function getInitialSeed() {
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

// Inicializa la renderización del inventario
renderInventory();