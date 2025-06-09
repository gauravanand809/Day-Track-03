import { getLocalStorageItem } from '../../utils/localStorageUtil.js';
import { HISTORY_KEY } from '../../utils/constantsUtil.js';

// DOM elements are queried inside functions when needed.

/**
 * Renders the list of history items.
 * @param {string} searchTerm - Optional search term to filter history items.
 * @param {(historyId: string) => void} onItemClick - Callback function when a history item is clicked.
 */
export function renderHistoryList(searchTerm = "", onItemClick) {
  const historyListContainer = document.getElementById("history-list-container");
  if (!historyListContainer) {
    console.warn("[historyList] historyListContainer not found at render time.");
    return;
  }
  const history = getLocalStorageItem(HISTORY_KEY, []);
  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredHistory = searchTerm
    ? history.filter((item) =>
        item.topic.toLowerCase().includes(lowerSearchTerm) ||
        (item.modelName && item.modelName.toLowerCase().includes(lowerSearchTerm)) ||
        (item.notes && item.notes.toLowerCase().includes(lowerSearchTerm)) ||
        (item.content && item.content.toLowerCase().includes(lowerSearchTerm)) // Search in content too
      )
    : history;

  historyListContainer.innerHTML = ""; // Clear previous list
  if (filteredHistory.length === 0) {
    historyListContainer.innerHTML = `<p style="text-align:center; padding:15px;">${
      searchTerm ? "No matching history found." : "No history yet."
    }</p>`;
    return;
  }

  const ul = document.createElement("ul");
  ul.classList.add("history-items-list");
  filteredHistory.forEach((item) => {
    const li = document.createElement("li");
    li.classList.add("history-item");
    li.dataset.historyId = item.id;

    const topicSpan = document.createElement("span");
    topicSpan.classList.add("history-item-topic");
    topicSpan.textContent = item.topic;

    const dateSpan = document.createElement("span");
    dateSpan.classList.add("history-item-date");
    try {
      dateSpan.textContent = new Date(item.date).toLocaleString();
    } catch (e) {
      dateSpan.textContent = "Invalid Date";
    }
    
    const modelSpan = document.createElement("span");
    modelSpan.classList.add("history-item-model");
    modelSpan.textContent = item.modelName && item.modelName !== "N/A" ? item.modelName : "";

    li.appendChild(topicSpan);
    li.appendChild(dateSpan);
    li.appendChild(modelSpan);
    if (typeof onItemClick === 'function') {
        li.addEventListener("click", () => onItemClick(item.id));
    }
    ul.appendChild(li);
  });
  historyListContainer.appendChild(ul);
}

/**
 * Initializes the history list specific event listeners (e.g., search).
 * @param {(historyId: string) => void} onItemClick - Callback for when an item is clicked.
 */
export function initializeHistoryList(onItemClick) {
  const historySearchInput = document.getElementById("history-search");
  if (historySearchInput) {
    // Ensure listener is only attached once if this function could be called multiple times
    if (!historySearchInput.dataset.listenerAttached) {
        historySearchInput.addEventListener("input", (e) => renderHistoryList(e.target.value, onItemClick));
        historySearchInput.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[historyList] History search input not found during initialization.");
  }
  // Initial render is typically handled by the parent view's render function (renderHistoryView)
  // calling renderHistoryList directly. If not, uncomment below.
  // renderHistoryList("", onItemClick); 
}
