import { getLocalStorageItem, setLocalStorageItem } from './localStorageUtil.js';
import { APP_SETTINGS_KEY, SAVED_AI_ENDPOINTS_KEY, DEFAULT_APP_SETTINGS } from './constantsUtil.js';
import { showToast } from './uiUtil.js'; // Assuming showToast is in uiUtil.js

/**
 * Retrieves app settings from localStorage, merging with defaults.
 * @returns {object} The application settings.
 */
export function getAppSettings() {
  const settingsString = getLocalStorageItem(APP_SETTINGS_KEY);
  if (settingsString) {
    try {
      const parsedSettings = settingsString; // Already parsed by getLocalStorageItem
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsedSettings,
        aiProvider: parsedSettings.aiProvider || DEFAULT_APP_SETTINGS.aiProvider,
        geminiModel: parsedSettings.geminiModel || DEFAULT_APP_SETTINGS.geminiModel,
      };
    } catch (e) {
      console.error("[settingsUtil] Error merging parsed app settings:", e);
      return { ...DEFAULT_APP_SETTINGS }; // Return a copy
    }
  }
  return { ...DEFAULT_APP_SETTINGS }; // Return a copy
}

/**
 * Saves app settings to localStorage.
 * @param {object} settings - The settings object to save.
 */
export function saveAppSettings(settings) {
  setLocalStorageItem(APP_SETTINGS_KEY, settings);
}

/**
 * Retrieves saved AI endpoint configurations from localStorage.
 * @returns {Array<object>} An array of saved AI endpoint objects.
 */
export function getSavedAiEndpoints() {
  return getLocalStorageItem(SAVED_AI_ENDPOINTS_KEY, []);
}

/**
 * Saves AI endpoint configurations to localStorage.
 * @param {Array<object>} endpoints - The array of AI endpoint objects to save.
 */
export function saveAiEndpoints(endpoints) {
  setLocalStorageItem(SAVED_AI_ENDPOINTS_KEY, endpoints);
}

/**
 * Retrieves a specific AI endpoint configuration by its ID.
 * @param {string} endpointId - The ID of the endpoint to retrieve.
 * @returns {object | undefined} The endpoint object if found, otherwise undefined.
 */
export function getOpenAIEndpointById(endpointId) {
  const endpoints = getSavedAiEndpoints();
  return endpoints.find(ep => ep.id === endpointId);
}

/**
 * Saves (adds or updates) a single AI endpoint configuration.
 * @param {object} endpointData - The endpoint data to save. Must include an 'id'.
 */
export function saveOpenAIEndpoint(endpointData) {
  if (!endpointData || !endpointData.id) {
    console.error("[settingsUtil] Attempted to save endpoint without data or ID.");
    return;
  }
  let endpoints = getSavedAiEndpoints();
  const existingIndex = endpoints.findIndex(ep => ep.id === endpointData.id);
  if (existingIndex > -1) {
    endpoints[existingIndex] = endpointData; // Update existing
  } else {
    endpoints.push(endpointData); // Add new
  }
  saveAiEndpoints(endpoints);
}

/**
 * Deletes an AI endpoint configuration by its ID.
 * @param {string} endpointId - The ID of the endpoint to delete.
 */
export function deleteOpenAIEndpoint(endpointId) {
  if (!endpointId) {
    console.error("[settingsUtil] Attempted to delete endpoint without ID.");
    return;
  }
  let endpoints = getSavedAiEndpoints();
  endpoints = endpoints.filter(ep => ep.id !== endpointId);
  saveAiEndpoints(endpoints);
}

/**
 * Resolves the AI settings to be used for API calls, considering the selected provider and its specific configurations.
 * @param {object} appSettings - The current application settings.
 * @returns {object | null} Resolved AI settings object or null if configuration is incomplete/invalid.
 */
export function getResolvedAiSettings(appSettings) {
  const resolvedSettings = {
    aiProvider: appSettings.aiProvider,
  };

  if (appSettings.aiProvider === 'gemini') {
    if (!appSettings.geminiApiKey || !appSettings.geminiModel) {
      showToast('Gemini API Key or Model not set. Please configure in Settings.', 'error');
      console.error('[settingsUtil] Gemini API Key or Model not set.');
      return null;
    }
    resolvedSettings.geminiApiKey = appSettings.geminiApiKey;
    resolvedSettings.geminiModel = appSettings.geminiModel;
  } else if (appSettings.aiProvider === 'openai') {
    if (!appSettings.activeOpenAiEndpointId) {
      showToast('OpenAI provider is selected, but no endpoint is configured in Settings.', 'error');
      console.error('[settingsUtil] OpenAI endpoint ID not set.');
      return null;
    }
    const savedEndpoints = getSavedAiEndpoints();
    const activeEndpoint = savedEndpoints.find(ep => ep.id === appSettings.activeOpenAiEndpointId);
    if (!activeEndpoint) {
      showToast('Active OpenAI endpoint configuration not found. Please check Settings.', 'error');
      console.error('[settingsUtil] Active OpenAI endpoint configuration not found for ID:', appSettings.activeOpenAiEndpointId);
      return null;
    }
    if (!appSettings.activeOpenAiModelName && (!activeEndpoint.models || activeEndpoint.models.length === 0)) {
      showToast('OpenAI model name is not selected and the endpoint has no default models. Please configure in Settings.', 'error');
      console.error('[settingsUtil] OpenAI model name not set and no default models on endpoint.');
      return null;
    }
    resolvedSettings.openaiBaseUrl = activeEndpoint.baseUrl;
    resolvedSettings.openaiApiKey = activeEndpoint.apiKey;
    resolvedSettings.openaiModel = appSettings.activeOpenAiModelName || (activeEndpoint.models && activeEndpoint.models.length > 0 ? activeEndpoint.models[0] : null);
    
    if (!resolvedSettings.openaiModel) {
        showToast('OpenAI model could not be determined. Please select a model in Settings or ensure the endpoint has models defined.', 'error');
        console.error('[settingsUtil] OpenAI model could not be determined.');
        return null;
    }
  } else {
    showToast('Invalid AI Provider selected in Settings.', 'error');
    console.error('[settingsUtil] Invalid AI Provider:', appSettings.aiProvider);
    return null;
  }
  console.log('[settingsUtil] Resolved AI settings:', resolvedSettings);
  return resolvedSettings;
}

/**
 * Toggles the visibility of Gemini and OpenAI settings groups based on the selected provider.
 * @param {string} provider - The selected AI provider ('gemini' or 'openai').
 */
export function toggleSettingsVisibility(provider) {
  const geminiSettingsGroup = document.getElementById("gemini-settings-group");
  const openaiSettingsGroup = document.getElementById("openai-settings-group");

  if (!geminiSettingsGroup || !openaiSettingsGroup) {
    console.warn("[settingsUtil] Settings groups not found for toggling visibility.");
    return;
  }

  if (provider === "gemini") {
    geminiSettingsGroup.style.display = "block";
    openaiSettingsGroup.style.display = "none";
  } else if (provider === "openai") {
    geminiSettingsGroup.style.display = "none";
    openaiSettingsGroup.style.display = "block";
    // populateOpenAiEndpointSelector(); // This will be called by the settings component
  }
}

/**
 * Populates the OpenAI endpoint selector dropdown in the settings view.
 */
export function populateOpenAiEndpointSelector() {
  const openaiSelectEndpoint = document.getElementById("openai-select-endpoint");
  if (!openaiSelectEndpoint) {
    console.warn("[settingsUtil] OpenAI endpoint selector not found.");
    return;
  }

  const savedEndpoints = getSavedAiEndpoints();
  const currentSettings = getAppSettings();

  openaiSelectEndpoint.innerHTML = '<option value="">-- Select a Configuration --</option>';
  savedEndpoints.forEach((endpoint) => {
    const option = document.createElement("option");
    option.value = endpoint.id;
    option.textContent = endpoint.name;
    openaiSelectEndpoint.appendChild(option);
  });

  if (currentSettings.activeOpenAiEndpointId) {
    openaiSelectEndpoint.value = currentSettings.activeOpenAiEndpointId;
  }
  // updateOpenAiModelSelector(openaiSelectEndpoint.value); // This will be called by the event listener or settings component
}

/**
 * Updates the OpenAI model selector dropdown based on the selected endpoint.
 * @param {string} endpointId - The ID of the selected OpenAI endpoint.
 */
export function updateOpenAiModelSelector(endpointId) {
  const openaiSelectModelFromEndpoint = document.getElementById("openai-select-model-from-endpoint");
  const openaiModelSelectionContainer = document.getElementById("openai-model-selection-container");

  if (!openaiSelectModelFromEndpoint || !openaiModelSelectionContainer) {
    console.warn("[settingsUtil] OpenAI model selector elements not found.");
    return;
  }

  const savedEndpoints = getSavedAiEndpoints();
  const currentSettings = getAppSettings();

  openaiSelectModelFromEndpoint.innerHTML = ""; // Clear previous options

  if (endpointId) {
    const selectedEndpoint = savedEndpoints.find((ep) => ep.id === endpointId);
    if (selectedEndpoint && selectedEndpoint.models && selectedEndpoint.models.length > 0) {
      selectedEndpoint.models.forEach((modelName) => {
        const option = document.createElement("option");
        option.value = modelName;
        option.textContent = modelName;
        openaiSelectModelFromEndpoint.appendChild(option);
      });
      if (currentSettings.activeOpenAiEndpointId === endpointId && currentSettings.activeOpenAiModelName) {
        openaiSelectModelFromEndpoint.value = currentSettings.activeOpenAiModelName;
      } else if (selectedEndpoint.models.length > 0) {
        // Auto-select the first model if none is set for this endpoint
        // openaiSelectModelFromEndpoint.value = selectedEndpoint.models[0];
      }
      openaiModelSelectionContainer.style.display = "block";
    } else {
      openaiModelSelectionContainer.style.display = "none";
    }
  } else {
    openaiModelSelectionContainer.style.display = "none";
  }
}
