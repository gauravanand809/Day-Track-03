import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { HISTORY_KEY } from '../../utils/constantsUtil.js';
import { showToast } from '../../utils/uiUtil.js';

// DOM Elements are queried inside functions when needed.
let currentDetailItemId = null;

/**
 * Populates and shows the history detail view for a given item ID.
 * @param {string} historyId - The ID of the history item to display.
 */
export function populateAndShowHistoryDetail(historyId) {
  currentDetailItemId = historyId; 

  const historyDetailContainer = document.getElementById("history-detail-container");
  const historyDetailTopicEl = document.getElementById("history-detail-topic");
  const historyDetailDateEl = document.getElementById("history-detail-date");
  const historyDetailContentEl = document.getElementById("history-detail-content");
  const historyDetailNotesEl = document.getElementById("history-detail-notes");

  if (!historyDetailContainer || !historyDetailTopicEl || !historyDetailDateEl || !historyDetailContentEl || !historyDetailNotesEl) {
    console.warn("[historyDetail] One or more history detail elements are missing at runtime.");
    showToast("Cannot display history item details - UI elements missing.", "error");
    if(historyDetailContainer) historyDetailContainer.style.display = "none";
    return;
  }
  
  const history = getLocalStorageItem(HISTORY_KEY, []);
  const item = history.find(h => h.id === historyId);

  if (!item) {
    showToast("History item not found.", "error");
    if(historyDetailContainer) historyDetailContainer.style.display = "none";
    return;
  }

  historyDetailTopicEl.textContent = item.topic;
  try {
    historyDetailDateEl.textContent = `Generated on: ${new Date(item.date).toLocaleString()}`;
  } catch(e) {
    historyDetailDateEl.textContent = `Generated on: Invalid Date`;
  }
  
  if (typeof marked !== 'undefined' && marked.parse) {
    historyDetailContentEl.innerHTML = marked.parse(item.content);
  } else {
    console.warn("[historyDetail] Marked.js library not found. Displaying raw content.");
    historyDetailContentEl.innerHTML = `<pre>${item.content}</pre>`;
  }

  const table = historyDetailContentEl.querySelector("table");
  if (table) {
    const currentItemStates = item.itemStates || {};
    table.querySelectorAll("tbody tr").forEach((row, rowIndex) => {
      if (row.cells.length > 2 && row.cells[0].textContent.trim() === '[ ]') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const taskName = row.cells[2].textContent.trim();
        const itemKey = `${item.topic}_${taskName}_${rowIndex}`;
        checkbox.dataset.itemKey = itemKey;
        checkbox.checked = currentItemStates[itemKey] === true;
        
        checkbox.addEventListener('change', () => {
          currentItemStates[itemKey] = checkbox.checked;
          const mainHistory = getLocalStorageItem(HISTORY_KEY, []);
          const mainHistoryItemIndex = mainHistory.findIndex(h => h.id === item.id);
          if (mainHistoryItemIndex > -1) {
            if (!mainHistory[mainHistoryItemIndex].itemStates) {
                mainHistory[mainHistoryItemIndex].itemStates = {};
            }
            mainHistory[mainHistoryItemIndex].itemStates[itemKey] = checkbox.checked;
            setLocalStorageItem(HISTORY_KEY, mainHistory);
          }
        });
        row.cells[0].innerHTML = '';
        row.cells[0].appendChild(checkbox);
      }
    });
  }
  historyDetailNotesEl.value = item.notes || "";
  historyDetailContainer.style.display = "block";
}

function handleSaveNote() {
  const historyDetailNotesEl = document.getElementById("history-detail-notes");
  if (!currentDetailItemId) {
    showToast("No history item selected to save note for.", "error");
    return;
  }
  if (!historyDetailNotesEl) {
    showToast("Notes field not found.", "error");
    return;
  }
  let history = getLocalStorageItem(HISTORY_KEY, []);
  const itemIndex = history.findIndex(h => h.id === currentDetailItemId);
  if (itemIndex > -1) {
    history[itemIndex].notes = historyDetailNotesEl.value;
    setLocalStorageItem(HISTORY_KEY, history);
    showToast("Note saved!", "success");
  } else {
    showToast("Could not find history item to save note.", "error");
  }
}

function handleDeleteEntry(onAfterDelete) {
  if (!currentDetailItemId) {
    showToast("No history item selected for deletion.", "error");
    return;
  }
  if (confirm("Are you sure you want to delete this history entry?")) {
    let history = getLocalStorageItem(HISTORY_KEY, []);
    history = history.filter(h => h.id !== currentDetailItemId);
    setLocalStorageItem(HISTORY_KEY, history);
    showToast("History entry deleted.", "info");
    currentDetailItemId = null; 
    hideHistoryDetail(); // Hide detail view
    if (typeof onAfterDelete === 'function') {
        onAfterDelete(); 
    }
  }
}

export function initializeHistoryDetail(onAfterDeleteCallback) {
  // Query buttons here as this is called after parent template is loaded
  const saveHistoryNoteBtn = document.getElementById("save-history-note-btn");
  const deleteHistoryEntryBtn = document.getElementById("delete-history-entry-btn");

  if (saveHistoryNoteBtn) {
    if (!saveHistoryNoteBtn.dataset.listenerAttached) {
        saveHistoryNoteBtn.addEventListener("click", handleSaveNote);
        saveHistoryNoteBtn.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[historyDetail] Save Note button not found during init.");
  }

  if (deleteHistoryEntryBtn) {
    if (!deleteHistoryEntryBtn.dataset.listenerAttached) {
        deleteHistoryEntryBtn.addEventListener("click", () => handleDeleteEntry(onAfterDeleteCallback));
        deleteHistoryEntryBtn.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[historyDetail] Delete Entry button not found during init.");
  }
}

export function hideHistoryDetail() {
    const historyDetailContainer = document.getElementById("history-detail-container");
    if (historyDetailContainer) {
        historyDetailContainer.style.display = "none";
    }
    currentDetailItemId = null;
}
