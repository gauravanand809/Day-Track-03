import { updateTopicDisplay } from './topicCompletion.js';
import { 
    handleGenerateClick, 
    handleDownloadClick, 
    handlePickForMeClick, 
    handleTopicSelectChange 
} from './generatorLogic.js';

// DOM Elements are queried within renderTopicGeneratorView after HTML is loaded.

/**
 * Renders the Topic Generator view: sets up DOM elements and event listeners.
 * This function is intended to be called after the view's HTML template has been loaded.
 * It ensures that event listeners are only attached once.
 */
export function renderTopicGeneratorView() {
  const generatorViewEl = document.getElementById('generator-view');
  if (!generatorViewEl) {
    console.warn("[TopicGenerator] Generator view element (#generator-view) not found in DOM.");
    return;
  }

  // Check if already initialized to prevent re-attaching listeners
  if (generatorViewEl.dataset.initialized === 'true') {
    console.log("[TopicGenerator] Already initialized.");
    // Potentially call updateTopicDisplay() here if it needs to refresh on every view switch
    // For now, assuming it's mainly for initial setup and completion status changes.
    // If topic list can change dynamically elsewhere, this might need a re-render call.
    const topicSelect = document.getElementById("topic-select"); // Query it again or ensure it's available
    updateTopicDisplay(topicSelect); // Refresh (Done) status on topics
    return;
  }

  // Query elements now that we expect the HTML to be present
  const topicSelect = document.getElementById("topic-select");
  const generateBtn = document.getElementById("generate-btn");
  const pickForMeBtn = document.getElementById("pick-for-me-btn");
  const downloadBtn = document.getElementById("download-btn");
  // topicOtherInput and todoContainer are accessed by generatorLogic.js,
  // which assumes they are present when its functions are called.

  if (generateBtn) {
    generateBtn.addEventListener("click", handleGenerateClick);
  } else {
    console.warn("[TopicGenerator] Generate button not found post-load.");
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownloadClick);
  } else {
    console.warn("[TopicGenerator] Download button not found post-load.");
  }

  if (pickForMeBtn) {
    pickForMeBtn.addEventListener("click", handlePickForMeClick);
  } else {
    console.warn("[TopicGenerator] Pick For Me button not found post-load.");
  }

  if (topicSelect) {
    topicSelect.addEventListener('change', handleTopicSelectChange);
    handleTopicSelectChange(); // Initial layout based on current selection
    updateTopicDisplay(topicSelect); // Pass the element
  } else {
    console.warn("[TopicGenerator] Topic select element not found post-load.");
  }
  
  generatorViewEl.dataset.initialized = 'true'; // Mark as initialized
  console.log("Topic Generator View Rendered and Initialized");
}

// The initializeTopicGenerator function might still be useful if there's any non-DOM setup
// needed when the app starts, before the view is first rendered.
// For this component, all setup seems DOM-dependent, so renderTopicGeneratorView handles it.
// If app.js was calling initializeTopicGenerator, it should now call renderTopicGeneratorView
// via the viewRenderCallbacks in navigationUtil.
