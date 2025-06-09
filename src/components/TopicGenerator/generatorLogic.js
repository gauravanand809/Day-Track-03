import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { HISTORY_KEY } from '../../utils/constantsUtil.js';
import { showToast, toggleLoader } from '../../utils/uiUtil.js';
import { fetchGeneratedTodo } from '../../utils/apiUtil.js';
import { getAppSettings, getSavedAiEndpoints } from '../../utils/settingsUtil.js';
import { getCompletedTopics, markTopicAsDone, markTopicAsNotDone, updateTopicDisplay } from './topicCompletion.js'; // Added updateTopicDisplay

// DOM Elements are now queried inside functions when needed.

let currentTopicState = { value: "" }; 
let todoContentRawState = { value: "" };

export function addTopicToHistory_local(topic, content, modelName, itemStates = {}) {
  console.log(`[generatorLogic] Attempting to add topic to history: ${topic}, Model: ${modelName}`);
  try {
    let history = getLocalStorageItem(HISTORY_KEY, []);
    const newHistoryItem = {
      id: String(Date.now()),
      topic: topic,
      content: content,
      date: new Date().toISOString(),
      notes: "",
      itemStates: itemStates,
      modelName: modelName || "N/A",
    };
    history.unshift(newHistoryItem);
    if (history.length > 50) history.pop();
    setLocalStorageItem(HISTORY_KEY, history);
  } catch (e) {
    console.error(`[generatorLogic] Failed to add topic ${topic} to history:`, e);
  }
}

export async function handleGenerateClick() {
  console.log('[generatorLogic] Generate button clicked.');
  // Query elements at runtime
  const topicSelect = document.getElementById("topic-select");
  const topicOtherInput = document.getElementById("topic-other-input");
  const generateBtn = document.getElementById("generate-btn"); // For disabling/text change
  const todoContainer = document.getElementById("todo-container");
  const downloadBtn = document.getElementById("download-btn");


  if (!topicSelect) {
    showToast('Topic selection element not found.', 'error');
    return;
  }

  currentTopicState.value = topicSelect.value === 'other-topic' ? (topicOtherInput ? topicOtherInput.value.trim() : "") : topicSelect.value;

  if (!currentTopicState.value) {
    showToast('Please select or enter a topic.', 'error');
    return;
  }
  if (topicSelect.value === 'other-topic' && !currentTopicState.value && topicOtherInput) { // check topicOtherInput exists
    showToast('Please enter a custom topic if "Other" is selected.', 'error');
    return;
  }

  toggleLoader(true); // Assumes 'loader' is the default ID or a global loader
  if(generateBtn) { generateBtn.disabled = true; generateBtn.textContent = 'Processing...'; }

  const appSettings = getAppSettings();
  let apiArgs = { topic: currentTopicState.value, aiProvider: appSettings.aiProvider };

  if (appSettings.aiProvider === 'gemini') {
    if (!appSettings.geminiApiKey || !appSettings.geminiModel) {
      showToast('Gemini API Key or Model not set. Please configure in Settings.', 'error');
      toggleLoader(false); if(generateBtn) {generateBtn.disabled = false; generateBtn.textContent = 'Generate';}
      return;
    }
    apiArgs.geminiApiKey = appSettings.geminiApiKey;
    apiArgs.geminiModel = appSettings.geminiModel;
  } else if (appSettings.aiProvider === 'openai') {
    if (!appSettings.activeOpenAiEndpointId || !appSettings.activeOpenAiModelName) {
      showToast('OpenAI Endpoint or Model not selected. Please configure in Settings.', 'error');
      toggleLoader(false); if(generateBtn) {generateBtn.disabled = false; generateBtn.textContent = 'Generate';}
      return;
    }
    const savedEndpoints = getSavedAiEndpoints();
    const activeEndpoint = savedEndpoints.find(ep => ep.id === appSettings.activeOpenAiEndpointId);
    if (!activeEndpoint) {
      showToast('Active OpenAI endpoint configuration not found. Please check Settings.', 'error');
      toggleLoader(false); if(generateBtn) {generateBtn.disabled = false; generateBtn.textContent = 'Generate';}
      return;
    }
    apiArgs.openaiBaseUrl = activeEndpoint.baseUrl;
    apiArgs.openaiApiKey = activeEndpoint.apiKey;
    apiArgs.openaiModel = appSettings.activeOpenAiModelName;
  } else {
    showToast('Invalid AI Provider selected in Settings.', 'error');
    toggleLoader(false); if(generateBtn) {generateBtn.disabled = false; generateBtn.textContent = 'Generate';}
    return;
  }

  try {
    const data = await fetchGeneratedTodo(apiArgs);
    if (data && data.error) {
      throw new Error(data.details ? `${data.error} - ${data.details}` : data.error);
    }
    if (!data || !data.todoList) {
      throw new Error("Received an invalid response from the AI for to-do list.");
    }

    todoContentRawState.value = data.todoList;
    const modelUsed = apiArgs.aiProvider === 'gemini' ? apiArgs.geminiModel : apiArgs.openaiModel;
    
    // Initial itemStates for new history entry (all false)
    let initialItemStates = {};
    if (todoContainer) { // Ensure todoContainer is available for parsing tasks
        // Temporarily parse to count tasks for initialItemStates, actual display parsing happens next
        const tempDiv = document.createElement('div');
        if (typeof marked !== 'undefined' && marked.parse) {
            tempDiv.innerHTML = marked.parse(todoContentRawState.value);
        } else {
            tempDiv.innerHTML = `<pre>${todoContentRawState.value}</pre>`; // Fallback
        }
        const tempTable = tempDiv.querySelector('table');
        if (tempTable) {
            const tempRows = tempTable.querySelectorAll('tbody tr');
            tempRows.forEach((row, rowIndex) => {
                if (row.cells.length > 2 && row.cells[0].textContent.trim() === '[ ]') {
                    const taskName = row.cells[2].textContent.trim();
                    const itemKey = `${currentTopicState.value}_${taskName}_${rowIndex}`;
                    initialItemStates[itemKey] = false;
                }
            });
        }
    }
    addTopicToHistory_local(currentTopicState.value, todoContentRawState.value, modelUsed, initialItemStates);


    if (todoContainer) {
      if (typeof marked !== 'undefined' && marked.parse) {
        todoContainer.innerHTML = marked.parse(todoContentRawState.value);
      } else {
        console.warn('[generatorLogic] Marked library not available.');
        todoContainer.innerHTML = `<pre>${todoContentRawState.value}</pre>`;
      }
    }
    
    const table = todoContainer ? todoContainer.querySelector('table') : null;
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        const itemStates = getLocalStorageItem(`todo-${currentTopicState.value}_states`, {}) || initialItemStates; // Use initial if nothing in storage
        rows.forEach((row, rowIndex) => {
            if (row.cells.length > 2 && row.cells[0].textContent.trim() === '[ ]') {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                const taskName = row.cells[2].textContent.trim();
                const itemKey = `${currentTopicState.value}_${taskName}_${rowIndex}`;
                checkbox.dataset.itemKey = itemKey;
                checkbox.checked = itemStates[itemKey] === true;
                checkbox.addEventListener('change', () => {
                    itemStates[itemKey] = checkbox.checked;
                    setLocalStorageItem(`todo-${currentTopicState.value}_states`, itemStates);
                    let allChecked = true;
                    table.querySelectorAll('tbody tr input[type="checkbox"]').forEach(cb => {
                        if (!cb.checked) allChecked = false;
                    });
                    const topicSelectForCompletion = document.getElementById("topic-select"); // Query for completion update
                    if (allChecked) markTopicAsDone(currentTopicState.value, topicSelectForCompletion);
                    else markTopicAsNotDone(currentTopicState.value, topicSelectForCompletion);
                });
                row.cells[0].innerHTML = '';
                row.cells[0].appendChild(checkbox);
            }
        });
        let allInitiallyChecked = true;
        const allCheckboxes = table.querySelectorAll('tbody tr input[type="checkbox"]');
        const topicSelectForCompletion = document.getElementById("topic-select"); // Query for completion update
        if (allCheckboxes.length > 0) {
            allCheckboxes.forEach(cb => { if (!cb.checked) allInitiallyChecked = false; });
            if (allInitiallyChecked) markTopicAsDone(currentTopicState.value, topicSelectForCompletion);
            else if (getCompletedTopics().includes(currentTopicState.value)) markTopicAsNotDone(currentTopicState.value, topicSelectForCompletion);
        } else if (rows.length > 0) { // If there are rows but no checkboxes (e.g. malformed markdown)
             markTopicAsNotDone(currentTopicState.value, topicSelectForCompletion);
        }
        updateTopicDisplay(topicSelectForCompletion); // Ensure display is current
    }
    if (downloadBtn) downloadBtn.style.display = 'block';
    showToast("To-Do list generated successfully!", "success");
  } catch (error) {
    console.error('[generatorLogic] Error during to-do generation:', error);
    if (todoContainer) todoContainer.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
    showToast(`Error generating to-do: ${error.message}`, 'error');
  } finally {
    toggleLoader(false);
    if(generateBtn) { generateBtn.disabled = false; generateBtn.textContent = 'Generate';}
  }
}

export function handleDownloadClick() {
  if (!todoContentRawState.value) {
    showToast("No todo list content to download.", "error");
    return;
  }
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const filename = `${dateStr}_${currentTopicState.value.replace(/\s+/g, "_")}.md`;
  const blob = new Blob([todoContentRawState.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function handlePickForMeClick() {
  const topicSelect = document.getElementById("topic-select");
  const topicOtherInput = document.getElementById("topic-other-input");
  if (!topicSelect) return;

  const completedTopics = getCompletedTopics();
  const availableOptions = Array.from(topicSelect.options)
    .filter(option => option.value && option.value !== 'other-topic' && !completedTopics.includes(option.value))
    .map(option => option.value);

  if (availableOptions.length === 0) {
    showToast("All topics are marked as done, or no topics available.", "info");
    return;
  }
  const randomIndex = Math.floor(Math.random() * availableOptions.length);
  topicSelect.value = availableOptions[randomIndex];
  currentTopicState.value = topicSelect.value; 
  if (topicOtherInput) topicOtherInput.style.display = 'none';
  if (topicSelect.value === 'other-topic' && topicOtherInput) {
      topicOtherInput.style.display = 'inline-block';
  }
  updateTopicDisplay(topicSelect); // Update display for the newly picked topic
}

export function handleTopicSelectChange() {
    const topicSelect = document.getElementById("topic-select");
    const topicOtherInput = document.getElementById("topic-other-input");
    if (!topicSelect || !topicOtherInput) return;

    if (topicSelect.value === 'other-topic') {
        topicOtherInput.style.display = 'inline-block';
        topicSelect.style.flexGrow = '0'; // Keep select from growing too much
        topicSelect.style.flexBasis = '180px'; // Give it a reasonable base width
    } else {
        topicOtherInput.style.display = 'none';
        topicSelect.style.flexGrow = '1'; // Allow select to take available space
        topicSelect.style.flexBasis = 'auto';
    }
    currentTopicState.value = topicSelect.value === 'other-topic' ? "" : topicSelect.value;
}
