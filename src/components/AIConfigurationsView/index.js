import { getSavedAiEndpoints, saveOpenAIEndpoint, deleteOpenAIEndpoint, getOpenAIEndpointById } from '../../utils/settingsUtil.js';
import { showToast } from '../../utils/uiUtil.js';
import { escapeHTML } from '../../utils/uiUtil.js';

let currentEditingEndpointId = null;

function renderSavedAiEndpointsList() {
  const listContainer = document.getElementById("saved-ai-endpoints-list");
  if (!listContainer) {
    console.warn("[AIConfigView] Saved AI endpoints list container not found.");
    return;
  }

  const endpoints = getSavedAiEndpoints();
  listContainer.innerHTML = ''; 

  if (endpoints.length === 0) {
    listContainer.innerHTML = '<p>No OpenAI-compatible API endpoint configurations saved yet. Click "Add New" to create one.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.classList.add('configurations-list');
  endpoints.forEach(endpoint => {
    const li = document.createElement('li');
    li.classList.add('configuration-item');
    li.dataset.endpointId = endpoint.id;
    
    let modelsTextOutput = "No models added"; // Default text
    if (endpoint.models && endpoint.models.length > 0) {
        modelsTextOutput = endpoint.models.map(model => escapeHTML(model)).join(', '); // Plain text, comma-separated
    }

    li.innerHTML = `
      <div class="config-details">
        <strong>${escapeHTML(endpoint.name)}</strong>
        <small>URL: ${escapeHTML(endpoint.baseUrl)}</small>
        <div class="config-models-display">Models: ${modelsTextOutput}</div> 
      </div>
      <div class="config-actions">
        <button class="edit-endpoint-btn btn-secondary">Edit</button>
        <button class="delete-endpoint-btn btn-danger">Delete</button>
      </div>
    `;
    ul.appendChild(li);

    const editBtn = li.querySelector('.edit-endpoint-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`[AIConfigView] Edit button clicked for endpoint ID: ${endpoint.id}`);
            openEndpointModal(endpoint.id);
        });
    }
    const deleteBtn = li.querySelector('.delete-endpoint-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`[AIConfigView] Delete button clicked for endpoint ID: ${endpoint.id}`);
            handleDeleteEndpoint(endpoint.id);
        });
    }
  });
  listContainer.appendChild(ul);
}

/**
 * Adds a model name as an editable tag to the modal's model container.
 * @param {string} modelName - The name of the model.
 * @param {HTMLElement} container - The container to add the tag to.
 */
function addModelTagToModal(modelName, container) {
  if (!modelName.trim() || !container) return;
  const tag = document.createElement('span');
  tag.classList.add('model-tag-editable'); 
  tag.textContent = escapeHTML(modelName.trim());
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.classList.add('remove-model-tag-btn');
  removeBtn.setAttribute('aria-label', `Remove model ${modelName}`);
  removeBtn.onclick = () => tag.remove();
  tag.appendChild(removeBtn);
  container.appendChild(tag);
}

/**
 * Handles adding a new model tag to the modal from the input field.
 */
function handleAddModelTag() {
  const newModelInput = document.getElementById("new-model-name-input");
  const modelsContainer = document.getElementById("endpoint-models-container");
  if (newModelInput && modelsContainer) {
    const modelName = newModelInput.value.trim();
    if (modelName) {
      addModelTagToModal(modelName, modelsContainer);
      newModelInput.value = ''; 
      newModelInput.focus();
    } else {
      showToast("Please enter a model name.", "info");
    }
  } else {
      console.error("[AIConfigView] New model input or container not found for handleAddModelTag.");
  }
}


function openEndpointModal(endpointId = null) {
  console.log(`[AIConfigView] Attempting to open modal. endpointId: ${endpointId === null ? 'NEW' : endpointId}`);
  const modal = document.getElementById("endpoint-config-modal");
  const modalTitle = document.getElementById("endpoint-modal-title");
  const nameInput = document.getElementById("endpoint-name-input");
  const baseUrlInput = document.getElementById("endpoint-base-url-input");
  const apiKeyInput = document.getElementById("endpoint-api-key-input");
  const modelsContainer = document.getElementById("endpoint-models-container"); // Changed back
  const newModelInput = document.getElementById("new-model-name-input"); // For adding new tags

  if (!modal || !modalTitle || !nameInput || !baseUrlInput || !apiKeyInput || !modelsContainer || !newModelInput) { 
    console.error("[AIConfigView] Modal elements not found for openEndpointModal (tag version).");
    return; 
  }

  currentEditingEndpointId = endpointId;
  modelsContainer.innerHTML = ''; // Clear previous model tags

  if (endpointId) {
    modalTitle.textContent = "Edit AI Endpoint Configuration";
    const endpoint = getOpenAIEndpointById(endpointId);
    if (endpoint) {
      nameInput.value = endpoint.name;
      baseUrlInput.value = endpoint.baseUrl;
      apiKeyInput.value = endpoint.apiKey || '';
      if (endpoint.models && endpoint.models.length > 0) {
        endpoint.models.forEach(modelName => addModelTagToModal(modelName, modelsContainer));
      }
    } else {
      showToast(`Error: Endpoint with ID ${endpointId} not found.`, "error");
      closeEndpointModal();
      return; 
    }
  } else {
    modalTitle.textContent = "Add New AI Endpoint Configuration";
    nameInput.value = '';
    baseUrlInput.value = '';
    apiKeyInput.value = '';
    newModelInput.value = ''; // Clear new model input
  }
  modal.style.display = "flex"; 
  console.log(`[AIConfigView] Modal display set to 'flex' for #endpoint-config-modal. Visible: ${modal.style.display}`);
  nameInput.focus();
}

function closeEndpointModal() {
  console.log("[AIConfigView] closeEndpointModal called.");
  const modal = document.getElementById("endpoint-config-modal");
  if (modal) {
    modal.style.display = "none";
    console.log("[AIConfigView] Modal display set to 'none'.");
  }
  currentEditingEndpointId = null; 
}

function handleSaveEndpoint() {
  console.log("[AIConfigView] handleSaveEndpoint called.");
  const nameInput = document.getElementById("endpoint-name-input");
  const baseUrlInput = document.getElementById("endpoint-base-url-input");
  const apiKeyInput = document.getElementById("endpoint-api-key-input");
  const modelsContainer = document.getElementById("endpoint-models-container"); // Read from tags

  if (!nameInput || !baseUrlInput || !apiKeyInput || !modelsContainer) {
    showToast("Error: Modal form elements not found for save.", "error");
    return;
  }

  const name = nameInput.value.trim();
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim(); 

  if (!name || !baseUrl) {
    showToast("Configuration Name and Base URL are required.", "error");
    return;
  }

  const modelTags = modelsContainer.querySelectorAll('.model-tag-editable');
  const models = Array.from(modelTags).map(tag => tag.firstChild.textContent.trim()).filter(Boolean);

  const endpointData = {
    id: currentEditingEndpointId || String(Date.now()),
    name, baseUrl, apiKey, models
  };

  saveOpenAIEndpoint(endpointData);
  showToast(`Endpoint configuration "${name}" saved.`, "success");
  closeEndpointModal();
  renderSavedAiEndpointsList(); 
}

function handleDeleteEndpoint(endpointId) {
  console.log(`[AIConfigView] handleDeleteEndpoint called for ID: ${endpointId}`);
  const endpoint = getOpenAIEndpointById(endpointId);
  if (!endpoint) {
    showToast("Error: Endpoint not found for deletion.", "error");
    return;
  }
  if (confirm(`Are you sure you want to delete the endpoint configuration "${escapeHTML(endpoint.name)}"?`)) {
    deleteOpenAIEndpoint(endpointId);
    showToast(`Endpoint "${escapeHTML(endpoint.name)}" deleted.`, "info");
    renderSavedAiEndpointsList(); 
  }
}

export function renderAIConfigurationsView() {
  const viewEl = document.getElementById('ai-configurations-view');
  if (!viewEl) {
    console.warn("[AIConfigView] View element (#ai-configurations-view) not found.");
    return;
  }

  if (viewEl.dataset.initialized !== 'true') {
    console.log("[AIConfigView] Performing one-time DOM setup.");

    const addNewBtn = document.getElementById("add-new-endpoint-btn");
    const closeModalBtn = document.getElementById("close-endpoint-modal-btn");
    const saveEndpointBtn = document.getElementById("save-endpoint-config-btn");
    const addModelBtn = document.getElementById("add-model-to-endpoint-btn"); // Re-add
    const newModelNameInput = document.getElementById("new-model-name-input"); // Re-add


    console.log("[AIConfigView] Initial query - addNewBtn found:", !!addNewBtn);
    console.log("[AIConfigView] Initial query - closeModalBtn found:", !!closeModalBtn);
    console.log("[AIConfigView] Initial query - saveEndpointBtn found:", !!saveEndpointBtn);
    console.log("[AIConfigView] Initial query - addModelBtn found:", !!addModelBtn);
    console.log("[AIConfigView] Initial query - newModelNameInput found:", !!newModelNameInput);
    
    if (addNewBtn) {
      if (!addNewBtn.dataset.listenerAttached) {
        addNewBtn.addEventListener('click', () => {
            console.log("[AIConfigView] Add New Endpoint button clicked.");
            openEndpointModal();
        });
        addNewBtn.dataset.listenerAttached = 'true';
        console.log("[AIConfigView] Listener attached to addNewBtn.");
      }
    } else {
      console.warn("[AIConfigView] Add New Endpoint button not found post-load.");
    }

    if (closeModalBtn) {
      if (!closeModalBtn.dataset.listenerAttached) {
        closeModalBtn.addEventListener('click', () => {
            console.log("[AIConfigView] Close modal button clicked.");
            closeEndpointModal();
        });
        closeModalBtn.dataset.listenerAttached = 'true';
        console.log("[AIConfigView] Listener attached to closeModalBtn.");
      }
    } else {
      console.warn("[AIConfigView] Close modal button not found post-load.");
    }

    if (saveEndpointBtn) {
      if (!saveEndpointBtn.dataset.listenerAttached) {
        saveEndpointBtn.addEventListener('click', () => {
            console.log("[AIConfigView] Save endpoint button clicked.");
            handleSaveEndpoint();
        });
        saveEndpointBtn.dataset.listenerAttached = 'true';
        console.log("[AIConfigView] Listener attached to saveEndpointBtn.");
      }
    } else {
      console.warn("[AIConfigView] Save Endpoint button not found post-load.");
    }

    if (addModelBtn) {
        if(!addModelBtn.dataset.listenerAttached) {
            addModelBtn.addEventListener('click', handleAddModelTag);
            addModelBtn.dataset.listenerAttached = 'true';
            console.log("[AIConfigView] Listener attached to addModelBtn.");
        }
    } else {
        console.warn("[AIConfigView] Add Model button not found post-load.");
    }
    if (newModelNameInput) {
        if(!newModelNameInput.dataset.listenerAttached) {
            newModelNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddModelTag();
                }
            });
            newModelNameInput.dataset.listenerAttached = 'true';
            console.log("[AIConfigView] Keypress listener attached to newModelNameInput.");
        }
    } else {
        console.warn("[AIConfigView] New Model Name input not found post-load.");
    }
    
    viewEl.dataset.initialized = 'true';
    console.log("AI Configurations View DOM Initialized and listeners attached.");
  } else {
    console.log("[AIConfigView] Already initialized.");
  }
  renderSavedAiEndpointsList();
}

export function initializeAIConfigurationsView() {
  console.log("AIConfigurationsView module loaded (initializeAIConfigurationsView called - should be minimal or no-op).");
}
