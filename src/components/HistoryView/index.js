import { setLocalStorageItem, getLocalStorageItem } from '../../utils/localStorageUtil.js';
import { HISTORY_KEY } from '../../utils/constantsUtil.js';
import { showToast } from '../../utils/uiUtil.js';
import { initializeHistoryList, renderHistoryList as renderList } from './historyList.js';
import { initializeHistoryDetail, populateAndShowHistoryDetail, hideHistoryDetail } from './historyDetail.js';

// DOM Elements will be queried within renderHistoryView after HTML is loaded.

/**
 * Shows the history list view and hides the detail view.
 * Optionally re-renders the list.
 */
function showListView(shouldRenderList = true) {
  const historyListContainer = document.getElementById("history-list-container");
  const historyDetailContainer = document.getElementById("history-detail-container");
  const historySearchInput = document.getElementById("history-search");

  if (historyDetailContainer) historyDetailContainer.style.display = "none";
  if (historyListContainer) historyListContainer.style.display = "block";
  
  hideHistoryDetail(); // Ensure detail state is cleared
  
  if (shouldRenderList) {
    // Pass the search input value, which might be null if element not found yet,
    // renderList should handle this gracefully or be called after search input is confirmed.
    const searchTerm = historySearchInput ? historySearchInput.value : "";
    renderList(searchTerm, switchToDetailView);
  }
}

/**
 * Switches to the detail view for a specific history item.
 * @param {string} historyId - The ID of the history item to display.
 */
function switchToDetailView(historyId) {
  const historyListContainer = document.getElementById("history-list-container");
  if (historyListContainer) historyListContainer.style.display = "none";
  // populateAndShowHistoryDetail also makes the detail container visible
  populateAndShowHistoryDetail(historyId); 
}

/**
 * Handles the clear all history action.
 */
function handleClearAllHistory() {
  if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
    setLocalStorageItem(HISTORY_KEY, []);
    showListView(true); // Show list view and re-render it (it will be empty)
    showToast("All history cleared.", "info");
  }
}

/**
 * This function is called by the navigation utility when switching to the history view.
 * It ensures the view is in the correct initial state (list view) and
 * performs one-time DOM setup and event listener attachments.
 */
export function renderHistoryView() {
  const historyViewEl = document.getElementById('history-view');
  if (!historyViewEl) {
    console.warn("[HistoryView] History view element (#history-view) not found in DOM.");
    return;
  }

  // Query for elements within this specific view, now that its HTML is loaded.
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const backToHistoryListBtn = document.getElementById("back-to-history-list-btn");
  // historySearchInput is used by historyList.js, which should also query it post-load.
  // initializeHistoryList will set up the search listener.

  if (historyViewEl.dataset.initialized !== 'true') {
    console.log("[HistoryView] Performing one-time DOM setup for History View.");

    // Initialize sub-modules, passing callbacks for inter-module communication
    // These sub-modules should also query their own elements internally after their parent (history-view) is loaded.
    initializeHistoryList(switchToDetailView); 
    initializeHistoryDetail(() => showListView(true)); // onAfterDelete will show list view

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", handleClearAllHistory);
    } else {
      console.warn("[HistoryView] Clear History button not found post-load.");
    }

    if (backToHistoryListBtn) {
      backToHistoryListBtn.addEventListener("click", () => showListView(false)); // Don't re-render list, just show
    } else {
      console.warn("[HistoryView] Back to History List button not found post-load.");
    }
    
    historyViewEl.dataset.initialized = 'true';
    console.log("History View DOM Initialized and listeners attached.");
  } else {
    console.log("[HistoryView] Already initialized. Refreshing list.");
  }
  
  // Always show the list view by default when rendering/switching to the history view.
  // This also re-renders the list content.
  showListView(true); 
}

// The initializeHistoryView function is no longer strictly needed if app.js
// only uses renderHistoryView as the callback. Kept for conceptual separation if desired,
// but it should not perform DOM operations that depend on historyView.html being loaded.
export function initializeHistoryView() {
  console.log("HistoryView module loaded (initializeHistoryView called - should be minimal or no-op if renderHistoryView handles all DOM setup).");
  // Any non-DOM pre-setup could go here, but typically not needed for these view components.
}
