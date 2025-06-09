import { initializePodManager, renderDreamPods } from './podManager.js';
import { initializeChatManager, openChatView } from './chatManager.js';
import { switchToView } from '../../utils/navigationUtil.js'; 

// DOM elements will be queried within renderParallelYouView

/**
 * Handles opening the new dream pod modal.
 */
function openNewDreamPodModal() {
  console.log("[ParallelYouView] openNewDreamPodModal called.");
  const newDreamPodModal = document.getElementById("new-dream-pod-modal");
  const newDreamGoalInput = document.getElementById("new-dream-goal-input");

  if (newDreamPodModal) {
    console.log("[ParallelYouView LOGS] newDreamPodModal found.");
    if(newDreamGoalInput) {
        newDreamGoalInput.value = ''; 
        console.log("[ParallelYouView LOGS] newDreamGoalInput found, value cleared.");
        newDreamGoalInput.disabled = false; // Explicitly ensure it's not disabled
        console.log(`[ParallelYouView LOGS] newDreamGoalInput.disabled = ${newDreamGoalInput.disabled}`);
    } else {
        console.warn("[ParallelYouView LOGS] newDreamGoalInput NOT found inside modal.");
    }
    newDreamPodModal.style.display = "flex"; 
    console.log(`[ParallelYouView LOGS] newDreamPodModal display set to ${newDreamPodModal.style.display}`);
    if(newDreamGoalInput) {
        console.log("[ParallelYouView LOGS] Attempting to focus newDreamGoalInput.");
        newDreamGoalInput.focus();
        // Check if focused
        setTimeout(() => {
            console.log(`[ParallelYouView LOGS] Is newDreamGoalInput focused: ${document.activeElement === newDreamGoalInput}`);
        }, 100);
    }
  } else {
    console.warn("[ParallelYouView LOGS] New Dream Pod Modal (#new-dream-pod-modal) not found.");
  }
}

/**
 * Handles closing the new dream pod modal.
 */
function closeNewDreamPodModal() {
  const newDreamPodModal = document.getElementById("new-dream-pod-modal");
  if (newDreamPodModal) {
    newDreamPodModal.style.display = "none";
  }
}

/**
 * Callback function passed to podManager to handle opening the chat view for a specific pod.
 * @param {string} podId - The ID of the pod to open chat for.
 */
function handleOpenChatForPod(podId) {
  console.log(`[ParallelYouView] handleOpenChatForPod called for podId: ${podId}. Attempting to switch view.`);
  if (typeof window.setCurrentChatPodIdForNav === 'function') {
    window.setCurrentChatPodIdForNav(podId);
    try {
      // Access the globally defined callbacks and pass them
      switchToView('dream-chat-view', window.globalViewRenderCallbacks || {}); 
      console.log(`[ParallelYouView] switchToView('dream-chat-view') called successfully with callbacks.`);
    } catch (error) {
      console.error(`[ParallelYouView] Error during switchToView('dream-chat-view'):`, error);
    }
  } else {
      console.error("[ParallelYouView] Critical: setCurrentChatPodIdForNav global function not found. Cannot switch to chat view.");
  }
}


/**
 * This function is called by the navigation utility when switching to the Parallel You view.
 */
export function renderParallelYouView() {
  const parallelYouViewEl = document.getElementById('parallel-you-view');
  if (!parallelYouViewEl) {
    console.warn("[ParallelYouView] View element (#parallel-you-view) not found.");
    return;
  }

  if (parallelYouViewEl.dataset.initialized !== 'true') {
    console.log("[ParallelYouView] Performing one-time DOM setup.");

    const addNewDreamPodBtn = document.getElementById("add-new-dream-pod-btn");
    const closeNewDreamModalBtn = document.getElementById("close-new-dream-modal-btn");

    if (addNewDreamPodBtn) {
      if (!addNewDreamPodBtn.dataset.listenerAttached) {
        addNewDreamPodBtn.addEventListener("click", openNewDreamPodModal);
        addNewDreamPodBtn.dataset.listenerAttached = 'true';
        console.log("[ParallelYouView] Listener attached to addNewDreamPodBtn.");
      }
    } else {
      console.warn("[ParallelYouView] Add New Dream Pod button (#add-new-dream-pod-btn) not found.");
    }

    if (closeNewDreamModalBtn) {
      if (!closeNewDreamModalBtn.dataset.listenerAttached) {
        closeNewDreamModalBtn.addEventListener("click", closeNewDreamPodModal);
        closeNewDreamModalBtn.dataset.listenerAttached = 'true';
        console.log("[ParallelYouView] Listener attached to closeNewDreamModalBtn.");
      }
    } else {
      console.warn("[ParallelYouView] Close New Dream Modal button (#close-new-dream-modal-btn) not found.");
    }

    initializePodManager(handleOpenChatForPod); 
    // initializeChatManager(); // This initializes chat manager for when dream-chat-view is loaded

    parallelYouViewEl.dataset.initialized = 'true';
    console.log("Parallel You View DOM Initialized and listeners attached.");
  } else {
    console.log("[ParallelYouView] Already initialized.");
  }

  renderDreamPods(handleOpenChatForPod); 
}


export function initializeParallelYouView() {
  console.log("ParallelYouView module loaded (initializeParallelYouView called - should be minimal or no-op).");
}
