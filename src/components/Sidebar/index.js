import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { SIDEBAR_COLLAPSED_KEY } from '../../utils/constantsUtil.js';

// DOM elements will be queried inside initializeSidebar, after HTML is loaded.
let sidebar = null;
let toggleSidebarBtn = null;

/**
 * Applies the saved or default sidebar collapsed state.
 * Updates the toggle button icon accordingly.
 */
function applySidebarState() {
  // Ensure elements are queried if not already
  if (!sidebar) sidebar = document.getElementById("sidebar");
  if (!toggleSidebarBtn) toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");

  if (!sidebar || !toggleSidebarBtn) {
    console.warn("[Sidebar] Sidebar or toggle button not found even after initialization attempt.");
    return;
  }
  const isCollapsed = getLocalStorageItem(SIDEBAR_COLLAPSED_KEY) === true;
  sidebar.classList.toggle("collapsed", isCollapsed);

  const iconElement = toggleSidebarBtn.querySelector('i[data-lucide]');
  const newIconName = isCollapsed ? 'chevron-right' : 'chevron-left';

  if (iconElement) {
    iconElement.setAttribute('data-lucide', newIconName);
  } else {
    toggleSidebarBtn.innerHTML = `<i data-lucide="${newIconName}"></i>`;
  }
  // Ensure Lucide icons are re-rendered if they exist or were just added
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons({
        nodes: [toggleSidebarBtn.querySelector('i[data-lucide]')] 
    });
  }
}

/**
 * Toggles the sidebar's collapsed state, saves it, and applies the visual change.
 */
function toggleSidebar() {
  if (!sidebar) { // Ensure sidebar is available
      sidebar = document.getElementById("sidebar");
      if (!sidebar) {
          console.error("[Sidebar] Sidebar element not found for toggle.");
          return;
      }
  }
  const isCollapsed = sidebar.classList.toggle("collapsed");
  setLocalStorageItem(SIDEBAR_COLLAPSED_KEY, isCollapsed);
  applySidebarState(); // Re-apply to update icon
}

/**
 * Initializes the sidebar functionality.
 * Sets up the toggle button event listener and applies the initial state.
 * This function is called after sidebar.html is loaded into #sidebar-container.
 */
export function initializeSidebar() {
  // Query elements now, as their HTML should be loaded.
  sidebar = document.getElementById("sidebar");
  toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");

  if (sidebar && toggleSidebarBtn) {
    // Check if listener already attached to prevent duplicates if called multiple times (though it shouldn't be)
    if (!toggleSidebarBtn.dataset.listenerAttached) {
      toggleSidebarBtn.addEventListener("click", toggleSidebar);
      toggleSidebarBtn.dataset.listenerAttached = 'true';
    }
    applySidebarState(); // Apply initial state on load
    console.log("[Sidebar] Initialized successfully.");
  } else {
    console.warn("[Sidebar] Could not initialize: sidebar or toggle-sidebar-btn not found within #sidebar-container after load.");
  }
}
