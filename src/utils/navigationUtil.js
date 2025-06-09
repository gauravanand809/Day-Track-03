import { loadHTML } from './uiUtil.js'; // Assuming loadHTML is in uiUtil.js

// Defines the mapping between view IDs (from data-view attributes) and their HTML template paths.
const viewTemplateMap = {
    'generator-view': 'src/templates/generatorView.html',
    'dashboard-view': 'src/templates/dashboardView.html',
    'history-view': 'src/templates/historyView.html',
    'parallel-you-view': 'src/templates/parallelYouView.html',
    'dream-chat-view': 'src/templates/dreamChatView.html', 
    'calendar-view': 'src/templates/calendarView.html',
    'settings-view': 'src/templates/settingsView.html',
    'ai-configurations-view': 'src/templates/aiConfigurationsView.html',
};

const defaultViewId = "generator-view"; // Fallback view

/**
 * Switches the active view in the application, loading its HTML template first.
 * @param {string} viewId - The ID of the view to switch to.
 * @param {object} viewRenderCallbacks - Callbacks to initialize/render specific views after HTML load.
 */
export async function switchToView(viewId, viewRenderCallbacks = {}) {
  console.log(`[navigationUtil] switchToView called for viewId: ${viewId}`);
  const contentArea = document.getElementById("content-area");
  const navLinks = document.querySelectorAll(".sidebar-nav .nav-link"); 

  if (!contentArea) {
    console.error("[navigationUtil] Main content area ('content-area') not found.");
    return;
  }
  if (!navLinks || navLinks.length === 0) {
      console.warn("[navigationUtil] Navigation links not found. Sidebar might not be loaded yet or has no links.");
  }

  const templatePath = viewTemplateMap[viewId];
  let effectiveViewId = viewId;

  if (!templatePath) {
    console.error(`[navigationUtil] No template path found for viewId: ${viewId}. Falling back to default.`);
    effectiveViewId = defaultViewId;
    const fallbackTemplatePath = viewTemplateMap[effectiveViewId];
    if (!fallbackTemplatePath) {
        contentArea.innerHTML = `<p class="error-message">Default view '${effectiveViewId}' could not be loaded either.</p>`;
        return; 
    }
    const htmlLoaded = await loadHTML(fallbackTemplatePath, 'content-area');
    if (!htmlLoaded) {
        contentArea.innerHTML = `<p class="error-message">Failed to load default view '${effectiveViewId}'.</p>`;
        return;
    }
  } else {
    const htmlLoaded = await loadHTML(templatePath, 'content-area');
    if (!htmlLoaded) {
      return;
    }
  }
  
  const targetViewElement = contentArea.querySelector(`#${effectiveViewId}.view`);
  if (targetViewElement) {
      const allViewsInContent = contentArea.querySelectorAll('.view');
      allViewsInContent.forEach(v => v.classList.remove('active-view'));
      
      targetViewElement.classList.add('active-view');
      if (effectiveViewId === 'dream-chat-view' && targetViewElement.style.display !== 'flex') {
          targetViewElement.style.display = 'flex';
      }
  } else {
      console.warn(`[navigationUtil] Target view element #${effectiveViewId} not found within loaded template in #content-area.`);
  }

  if (navLinks && navLinks.length > 0) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.view === effectiveViewId);
    });
  }

  if (viewRenderCallbacks[effectiveViewId] && typeof viewRenderCallbacks[effectiveViewId] === 'function') {
    try {
      console.log(`[navigationUtil] Calling render callback for view ${effectiveViewId}`);
      viewRenderCallbacks[effectiveViewId]();
    } catch (error) {
      console.error(`[navigationUtil] Error calling render callback for view ${effectiveViewId}:`, error);
    }
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
  }
}

/**
 * Initializes navigation functionality, attaching event listeners to nav links.
 */
export function initializeNavigation(viewRenderCallbacks = {}) {
  const navLinks = document.querySelectorAll("#sidebar-container .sidebar-nav .nav-link"); 
  if (navLinks && navLinks.length > 0) {
    navLinks.forEach((link) => {
      link.addEventListener("click", async (e) => { 
        e.preventDefault();
        const viewId = link.dataset.view;
        if (viewId) {
          console.log(`[navigationUtil] Nav link clicked for view: ${viewId}`);
          await switchToView(viewId, viewRenderCallbacks); 
        } else {
          console.warn("[navigationUtil] Nav link clicked without a data-view attribute:", link);
        }
      });
    });
  } else {
    console.warn("[navigationUtil] No navigation links found in #sidebar-container for initialization.");
  }
}
