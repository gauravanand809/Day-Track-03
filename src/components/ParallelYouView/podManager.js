import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { PARALLEL_YOU_PODS_KEY } from '../../utils/constantsUtil.js';
import { showToast, toggleLoader, escapeHTML, truncateMessage } from '../../utils/uiUtil.js';
import { getAppSettings, getResolvedAiSettings } from '../../utils/settingsUtil.js';
import { generateFutureSelfMessageWithAI } from '../../plug-and-play/parallel-you-module.js';

// DOM Elements will be queried inside functions when needed.

/**
 * Retrieves all Parallel You pods from local storage.
 * @returns {Array<Object>} An array of pod objects.
 */
export function getParallelYouPods() {
  return getLocalStorageItem(PARALLEL_YOU_PODS_KEY, []);
}

/**
 * Saves an array of Parallel You pods to local storage.
 * @param {Array<Object>} pods - The array of pods to save.
 */
function saveParallelYouPods(pods) {
  setLocalStorageItem(PARALLEL_YOU_PODS_KEY, pods);
}

/**
 * Renders the list of dream pods in the UI.
 * @param {(podId: string) => void} onOpenChat - Callback function to open chat for a pod.
 */
export function renderDreamPods(onOpenChat) {
  const dreamPodsContainer = document.getElementById("dream-pods-container");
  if (!dreamPodsContainer) {
    console.error('[podManager] CRITICAL: dreamPodsContainer not found at render time. Pods cannot be displayed.');
    return;
  }
  console.log('[podManager] renderDreamPods called. onOpenChat is a function:', typeof onOpenChat === 'function');
  dreamPodsContainer.innerHTML = '';
  const pods = getParallelYouPods();
  console.log(`[podManager] Found ${pods.length} pods to render.`);

  if (pods.length === 0) {
    dreamPodsContainer.classList.add('is-empty');
    dreamPodsContainer.innerHTML = `<p class="empty-state-message">No dream conversations started yet. Click "Start a New Dream Conversation" to begin!</p>`;
    return;
  }
  dreamPodsContainer.classList.remove('is-empty');

  pods.forEach(pod => {
    const podElement = document.createElement('div');
    podElement.classList.add('dream-pod');
    podElement.dataset.podId = pod.id;

    let rawInitialMessage = "No message yet.";
    if (pod.chatHistory && pod.chatHistory.length > 0 && pod.chatHistory[0].text) {
      rawInitialMessage = pod.chatHistory[0].text;
    }
    const truncatedMessage = truncateMessage(rawInitialMessage, 20); 
    
    podElement.innerHTML = `
      <div class="pod-content-area">
        <h4>Goal: ${escapeHTML(pod.goal || 'N/A')}</h4>
        <p class="future-self-message"><em>Future Self (2029):</em> "${escapeHTML(truncatedMessage)}"</p>
        <small>Started: ${pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : 'Unknown'}</small>
      </div>
      <button class="delete-pod-btn btn-danger" data-pod-id="${pod.id}" aria-label="Delete pod">&times;</button>
    `;
    dreamPodsContainer.appendChild(podElement);

    const contentArea = podElement.querySelector('.pod-content-area');
    if (contentArea) {
        if (typeof onOpenChat === 'function') {
            contentArea.addEventListener('click', () => {
                console.log(`[podManager] Pod content area clicked for pod ID: ${pod.id}`);
                onOpenChat(pod.id);
            });
        } else {
            console.warn(`[podManager] onOpenChat is not a function for pod ID: ${pod.id}. Click to open chat will not work.`);
        }
    } else {
        console.warn(`[podManager] .pod-content-area not found for pod ID: ${pod.id}`);
    }
    
    const deleteButton = podElement.querySelector('.delete-pod-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`[podManager] Delete button clicked for pod ID: ${pod.id}`);
            deleteDreamPod(pod.id, onOpenChat); 
        });
    } else {
        console.warn(`[podManager] .delete-pod-btn not found for pod ID: ${pod.id}`);
    }
  });
  console.log('[podManager] Finished rendering pods.');
}

/**
 * Deletes a dream pod by its ID.
 * @param {string} podId - The ID of the pod to delete.
 * @param {(podId: string) => void} onOpenChat - Callback for re-rendering list.
 */
export function deleteDreamPod(podId, onOpenChat) {
  console.log(`[podManager] deleteDreamPod called for podId: ${podId}`);
  if (!podId) {
    console.warn("[podManager] deleteDreamPod: No podId provided.");
    return;
  }
  if (confirm("Are you sure you want to delete this dream pod? This action cannot be undone.")) {
    console.log(`[podManager] Deleting pod ${podId}...`);
    let pods = getParallelYouPods();
    pods = pods.filter(p => p.id !== podId);
    saveParallelYouPods(pods);
    renderDreamPods(onOpenChat); 
    showToast("Dream pod deleted.", "info");
  } else {
    console.log(`[podManager] Deletion cancelled for pod ID: ${podId}`);
  }
}

/**
 * Handles the creation of a new dream pod.
 */
export async function handleCreateDreamPod(onOpenChat) {
  const newDreamGoalInput = document.getElementById("new-dream-goal-input");
  const newDreamPodModal = document.getElementById("new-dream-pod-modal");
  const createDreamPodBtn = document.getElementById("create-dream-pod-btn");

  if (!newDreamGoalInput || !newDreamPodModal || !createDreamPodBtn) {
      console.error("[podManager] Modal elements for creating pod not found at runtime.");
      showToast("Error: Could not find elements for creating a new dream pod.", "error");
      return;
  }
  const goal = newDreamGoalInput.value.trim();
  if (!goal) {
    showToast("Please define your dream/goal.", "error");
    return;
  }
  
  toggleLoader(true, 'parallel-you-loader');
  createDreamPodBtn.disabled = true; 
  createDreamPodBtn.textContent = 'Connecting...';

  const appSettings = getAppSettings();
  const resolvedAISettings = getResolvedAiSettings(appSettings);

  if (!resolvedAISettings) {
    toggleLoader(false, 'parallel-you-loader');
    createDreamPodBtn.disabled = false; 
    createDreamPodBtn.textContent = 'Create Dream Pod & Hear from Future Self';
    return;
  }
  
  try {
    const futureMessageText = await generateFutureSelfMessageWithAI(goal, resolvedAISettings);
    
    if (futureMessageText && !futureMessageText.startsWith("Error:") && !futureMessageText.startsWith("It seems the future is quiet") && !futureMessageText.startsWith("The signal from") && !futureMessageText.startsWith("I tried to channel")) {
      const newPod = {
        id: String(Date.now()),
        goal: goal,
        createdAt: new Date().toISOString(),
        chatHistory: [{ sender: "futureSelf", text: futureMessageText, timestamp: new Date().toISOString() }]
      };
      const pods = getParallelYouPods();
      pods.unshift(newPod);
      saveParallelYouPods(pods);
      renderDreamPods(onOpenChat); 
      if (newDreamPodModal) newDreamPodModal.style.display = "none";
      if (newDreamGoalInput) newDreamGoalInput.value = "";
      showToast("Connection successful! Message from your future self received.", "success");
    } else {
      showToast(futureMessageText || "Failed to get a message from the future. AI returned empty.", "error");
    }
  } catch (error) { 
    console.error('[podManager] Error creating dream pod:', error);
    showToast(`Error: ${error.message}`, "error");
  } finally {
    toggleLoader(false, 'parallel-you-loader');
    if(createDreamPodBtn) {
        createDreamPodBtn.disabled = false; 
        createDreamPodBtn.textContent = 'Create Dream Pod & Hear from Future Self';
    }
  }
}

/**
 * Initializes event listeners related to pod management (e.g., create pod button).
 */
export function initializePodManager(onOpenChat) {
    const createDreamPodBtn = document.getElementById("create-dream-pod-btn");
    if (createDreamPodBtn) {
        if (!createDreamPodBtn.dataset.listenerAttached) {
            createDreamPodBtn.addEventListener("click", () => handleCreateDreamPod(onOpenChat));
            createDreamPodBtn.dataset.listenerAttached = 'true';
            console.log("[podManager] Listener attached to createDreamPodBtn.");
        }
    } else {
        console.warn("[podManager] Create Dream Pod button not found during initialization.");
    }
}
