import { getAppSettings, saveAppSettings, getResolvedAiSettings, getSavedAiEndpoints, getOpenAIEndpointById } from '../../utils/settingsUtil.js';
import { showToast } from '../../utils/uiUtil.js';
import { applyTheme, initializeTheming } from '../../utils/themeUtil.js';

// DOM elements will be queried within renderSettingsView

/**
 * Populates the OpenAI endpoint dropdown in settings.
 */
function populateOpenAIEndpointSelect() {
  const selectElement = document.getElementById("openai-select-endpoint");
  const modelSelectContainer = document.getElementById("openai-model-selection-container");
  const modelSelect = document.getElementById("openai-select-model-from-endpoint");

  if (!selectElement || !modelSelectContainer || !modelSelect) {
    console.warn("[SettingsView] OpenAI endpoint select or model container not found.");
    return;
  }

  const endpoints = getSavedAiEndpoints();
  const currentVal = selectElement.value; // Preserve current selection if possible

  selectElement.innerHTML = '<option value="">-- Select a Configuration --</option>'; 
  modelSelect.innerHTML = ''; 
  modelSelectContainer.style.display = 'none';

  endpoints.forEach(endpoint => {
    const option = document.createElement('option');
    option.value = endpoint.id;
    option.textContent = endpoint.name;
    selectElement.appendChild(option);
  });
  if (endpoints.find(ep => ep.id === currentVal)) {
    selectElement.value = currentVal; // Restore if still valid
  }
}

/**
 * Populates the model dropdown based on the selected OpenAI endpoint.
 * @param {string} endpointId - The ID of the selected endpoint.
 */
function populateModelsForEndpoint(endpointId) {
  const modelSelectContainer = document.getElementById("openai-model-selection-container");
  const modelSelect = document.getElementById("openai-select-model-from-endpoint");

  if (!modelSelectContainer || !modelSelect) {
      console.warn("[SettingsView] OpenAI model select container or select element not found.");
      return;
  }
  
  const endpoint = getOpenAIEndpointById(endpointId);
  const currentSettings = getAppSettings(); // Get current settings to preserve model selection
  const previouslySelectedModel = currentSettings.activeOpenAiModelName;

  modelSelect.innerHTML = ''; 

  if (endpoint && endpoint.models && endpoint.models.length > 0) {
    endpoint.models.forEach(modelName => {
      const option = document.createElement('option');
      option.value = modelName;
      option.textContent = modelName;
      modelSelect.appendChild(option);
    });
    // Try to restore previously selected model if it exists in the new list
    if (previouslySelectedModel && endpoint.models.includes(previouslySelectedModel)) {
        modelSelect.value = previouslySelectedModel;
    }
    modelSelectContainer.style.display = 'block';
  } else {
    modelSelectContainer.style.display = 'none';
  }
}

/**
 * Loads current settings into the form fields.
 */
export function loadSettingsIntoForm() {
  const settings = getAppSettings();
  
  const aiProviderSelect = document.getElementById("ai-provider-select");
  const geminiApiKeyInput = document.getElementById("gemini-api-key-input");
  const geminiModelSelect = document.getElementById("gemini-ai-model-select");
  const geminiModelOtherInput = document.getElementById("gemini-ai-model-other-input");
  const themeSelect = document.getElementById("theme-select");
  const openaiEndpointSelect = document.getElementById("openai-select-endpoint");
  const openaiModelSelect = document.getElementById("openai-select-model-from-endpoint");
  
  if (!aiProviderSelect || !geminiApiKeyInput || !geminiModelSelect || !geminiModelOtherInput || 
      !themeSelect || !openaiEndpointSelect || !openaiModelSelect) {
    console.warn("[SettingsView] One or more settings form elements not found for loading.");
    return;
  }

  // Populate OpenAI endpoints first, as its value might be needed by toggleProviderSettingsVisibility
  populateOpenAIEndpointSelect(); 

  aiProviderSelect.value = settings.aiProvider || "gemini";
  geminiApiKeyInput.value = settings.geminiApiKey || "";
  
  const knownGeminiModels = ["gemini-2.5-pro-preview-06-05", "gemini-1.5-flash-latest"];
  if (settings.geminiModel && !knownGeminiModels.includes(settings.geminiModel)) {
    geminiModelSelect.value = "other";
    geminiModelOtherInput.value = settings.geminiModel;
    geminiModelOtherInput.style.display = "block";
  } else {
    geminiModelSelect.value = settings.geminiModel || "gemini-2.5-pro-preview-06-05";
    geminiModelOtherInput.style.display = "none";
  }
  
  const currentTheme = settings.theme ? settings.theme.replace('theme-', '') : 'default';
  themeSelect.value = currentTheme;
  
  console.log("[SettingsView] Loading OpenAI settings. Provider:", settings.aiProvider);
  console.log("[SettingsView] Saved activeOpenAiEndpointId:", settings.activeOpenAiEndpointId);
  console.log("[SettingsView] Saved activeOpenAiModelName:", settings.activeOpenAiModelName);

  // Set OpenAI selections if provider is openai
  // This part is crucial for persistence
  if (settings.aiProvider === "openai") {
    if (settings.activeOpenAiEndpointId) { 
      openaiEndpointSelect.value = settings.activeOpenAiEndpointId;
      console.log(`[SettingsView] Set openaiEndpointSelect.value to: ${settings.activeOpenAiEndpointId}`);
      // Models will be populated by toggleProviderSettingsVisibility or the change event listener
    }
  }
  // Visibility and model population for OpenAI is handled by toggleProviderSettingsVisibility
  // which is called after loadSettingsIntoForm in renderSettingsView
}

/**
 * Handles saving the settings from the form.
 */
function handleSaveSettings() {
  const aiProviderSelect = document.getElementById("ai-provider-select");
  const geminiApiKeyInput = document.getElementById("gemini-api-key-input");
  const geminiModelSelect = document.getElementById("gemini-ai-model-select");
  const geminiModelOtherInput = document.getElementById("gemini-ai-model-other-input");
  const themeSelect = document.getElementById("theme-select");
  const openaiEndpointSelect = document.getElementById("openai-select-endpoint");
  const openaiModelSelect = document.getElementById("openai-select-model-from-endpoint");

  if (!aiProviderSelect || !geminiApiKeyInput || !geminiModelSelect || !geminiModelOtherInput || !themeSelect || !openaiEndpointSelect || !openaiModelSelect) {
    showToast("Error: Could not find all settings elements to save.", "error");
    return;
  }

  const newSettings = {
    aiProvider: aiProviderSelect.value,
    geminiApiKey: geminiApiKeyInput.value.trim(),
    geminiModel: geminiModelSelect.value === "other" ? geminiModelOtherInput.value.trim() : geminiModelSelect.value,
    theme: `theme-${themeSelect.value}`,
    activeOpenAiEndpointId: openaiEndpointSelect.value, 
    activeOpenAiModelName: openaiModelSelect.value    
  };

  saveAppSettings(newSettings);
  applyTheme(newSettings.theme); 
  showToast("Settings saved successfully!", "success");
  // No need to call loadSettingsIntoForm() here, as save implies current state is now the saved state.
  // Re-calling toggleProviderSettingsVisibility might be good if provider changed.
  toggleProviderSettingsVisibility(); 
}

/**
 * Toggles visibility of AI provider specific settings.
 */
function toggleProviderSettingsVisibility() {
  const aiProviderSelect = document.getElementById("ai-provider-select");
  const geminiSettingsGroup = document.getElementById("gemini-settings-group");
  const openaiSettingsGroup = document.getElementById("openai-settings-group");
  const openaiEndpointSelect = document.getElementById("openai-select-endpoint"); // Get this element
  const openaiModelSelect = document.getElementById("openai-select-model-from-endpoint"); // Get this element

  if (!aiProviderSelect || !geminiSettingsGroup || !openaiSettingsGroup || !openaiEndpointSelect || !openaiModelSelect) {
      console.warn("[SettingsView] Core elements for toggling visibility not found.");
      return;
  }

  const selectedProvider = aiProviderSelect.value;
  const settings = getAppSettings(); // Get current settings to restore selections

  if (selectedProvider === "openai") {
    geminiSettingsGroup.style.display = "none";
    openaiSettingsGroup.style.display = "block";
    // populateOpenAIEndpointSelect(); // Already called by loadSettingsIntoForm
    // Ensure the correct endpoint is selected before populating models
    if (settings.activeOpenAiEndpointId) {
        openaiEndpointSelect.value = settings.activeOpenAiEndpointId;
    }
    populateModelsForEndpoint(openaiEndpointSelect.value); // Populate models based on current selection
    // Restore model selection
    if (settings.activeOpenAiEndpointId === openaiEndpointSelect.value && settings.activeOpenAiModelName) {
        openaiModelSelect.value = settings.activeOpenAiModelName;
    }

  } else { 
    geminiSettingsGroup.style.display = "block";
    openaiSettingsGroup.style.display = "none";
  }
}

/**
 * This function is called by the navigation utility when switching to the Settings view.
 */
export function renderSettingsView() {
  const settingsViewEl = document.getElementById('settings-view');
  if (!settingsViewEl) {
    console.warn("[SettingsView] View element (#settings-view) not found.");
    return;
  }

  if (settingsViewEl.dataset.initialized !== 'true') {
    console.log("[SettingsView] Performing one-time DOM setup.");

    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const aiProviderSelect = document.getElementById("ai-provider-select");
    const geminiModelSelect = document.getElementById("gemini-ai-model-select");
    const openaiEndpointSelect = document.getElementById("openai-select-endpoint");

    if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", handleSaveSettings);
    if (aiProviderSelect) aiProviderSelect.addEventListener("change", toggleProviderSettingsVisibility);
    if (geminiModelSelect) {
        geminiModelSelect.addEventListener('change', () => {
            const geminiModelOtherInput = document.getElementById("gemini-ai-model-other-input");
            if (geminiModelOtherInput) {
                geminiModelOtherInput.style.display = geminiModelSelect.value === 'other' ? 'block' : 'none';
            }
        });
    }
    if (openaiEndpointSelect) {
        openaiEndpointSelect.addEventListener('change', (e) => {
            populateModelsForEndpoint(e.target.value);
            // When endpoint changes, clear previously selected model from settings if it's no longer valid
            // This will be handled by save if user doesn't pick a new one.
            const openaiModelSelect = document.getElementById("openai-select-model-from-endpoint");
            if (openaiModelSelect.options.length > 0) {
                // Optionally auto-select first model, or leave for user
            } else {
                // No models, clear any saved model for this non-existent list
            }
        });
    }
    
    settingsViewEl.dataset.initialized = 'true';
    console.log("Settings View DOM Initialized and listeners attached.");
  } else {
    console.log("[SettingsView] Already initialized.");
  }

  loadSettingsIntoForm(); 
  toggleProviderSettingsVisibility(); 
}

export function initializeSettingsView() {
  console.log("SettingsView module loaded (initializeSettingsView called - should be minimal or no-op).");
}
