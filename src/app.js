// Initialize Utilities
import { initializeTheming } from './utils/themeUtil.js';
import { initializeNavigation, switchToView as navigateToView } from './utils/navigationUtil.js';
import { loadHTML } from './utils/uiUtil.js';

// Core UI Components (Sidebar is loaded once initially)
import { initializeSidebar } from './components/Sidebar/index.js';

// Import RENDER functions for views. These will also handle one-time DOM setup.
import { renderTopicGeneratorView } from './components/TopicGenerator/index.js';
import { renderHistoryView } from './components/HistoryView/index.js';
import { renderParallelYouView } from './components/ParallelYouView/index.js';
import { renderCalendarView } from './components/CalendarView/index.js';
import { renderSettingsView } from './components/SettingsView/index.js';
import { renderAIConfigurationsView } from './components/AIConfigurationsView/index.js';
import { initializeChatManager, openChatView as openDreamChatView } from './components/ParallelYouView/chatManager.js'; // For Dream Chat

// This is a global reference to viewRenderCallbacks, needed by renderDreamChatView
// to pass to initializeChatManager for the "Back" button functionality.
// This is not ideal but avoids more complex state management for this specific case.
window.globalViewRenderCallbacks = {}; // Made global

// Render callback for the Dream Chat view
function renderDreamChatView() {
    console.log("[App.js] Rendering Dream Chat View.");
    const dreamChatViewEl = document.getElementById('dream-chat-view');
    if (!dreamChatViewEl) {
        console.error("[App.js] Dream Chat View element (#dream-chat-view) not found during render.");
        return;
    }

    if (dreamChatViewEl.dataset.initialized !== 'true') {
        console.log("[App.js] Initializing Dream Chat View (first time setup).");
        initializeChatManager(globalViewRenderCallbacks); // Pass callbacks
        dreamChatViewEl.dataset.initialized = 'true';
    } else {
        console.log("[App.js] Dream Chat View already initialized.");
    }
    
    const podIdToOpen = window.getCurrentChatPodIdForNav ? window.getCurrentChatPodIdForNav() : null;
    // ---- START OF IMPORTANT LOGS ----
    console.log(`[App.js LOGS] podIdToOpen before calling openDreamChatView (inside setTimeout): ${podIdToOpen}`); 
    if (podIdToOpen) {
        setTimeout(() => { 
            console.log(`[App.js LOGS] Calling openDreamChatView with podId: ${podIdToOpen}`);
            openDreamChatView(podIdToOpen); 
        }, 0);
    } else {
        console.warn("[App.js LOGS] No podId found to open dream chat view. Calling openDreamChatView with null.");
        setTimeout(() => { 
            openDreamChatView(null); 
        }, 0);
    }
    // ---- END OF IMPORTANT LOGS ----
}

// This function will be executed when the DOM is fully loaded
async function onDOMContentLoaded() {
    console.log("DOM fully loaded and parsed. Initializing application modules.");

    await loadHTML('src/templates/sidebar.html', 'sidebar-container');
    initializeSidebar(); 
    initializeTheming(); 

    // Assign to the global reference
    window.globalViewRenderCallbacks = { // Assign to window property
        'generator-view': renderTopicGeneratorView,
        'history-view': renderHistoryView,
        'parallel-you-view': renderParallelYouView,
        'calendar-view': renderCalendarView,
        'settings-view': renderSettingsView,
        'ai-configurations-view': renderAIConfigurationsView,
        'dream-chat-view': renderDreamChatView, 
    };
    
    initializeNavigation(window.globalViewRenderCallbacks); // Pass window property

    const initialView = 'generator-view'; 
    await navigateToView(initialView, window.globalViewRenderCallbacks); // Pass window property

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    console.log("Application initialization complete.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
    onDOMContentLoaded();
}
