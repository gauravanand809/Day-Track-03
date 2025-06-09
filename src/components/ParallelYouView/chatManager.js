import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { PARALLEL_YOU_PODS_KEY } from '../../utils/constantsUtil.js';
import { showToast, escapeHTML } from '../../utils/uiUtil.js'; // Removed toggleLoader
import { getAppSettings, getResolvedAiSettings } from '../../utils/settingsUtil.js';
import { getParallelYouPods } from './podManager.js'; 
import { generateChatResponseWithAI } from '../../plug-and-play/parallel-you-module.js'; 
import { switchToView } from '../../utils/navigationUtil.js'; // Import for back button

// DOM Elements will be queried inside functions when needed.

let currentChatPodId = null;
let currentChatPodGoal = ""; 

/**
 * Renders chat messages for the current pod.
 */
function renderDreamChatMessages(chatHistory = []) {
  const dreamChatMessagesContainer = document.getElementById("dream-chat-messages-container");
  if (!dreamChatMessagesContainer) {
    console.warn("[chatManager] dreamChatMessagesContainer not found at render time.");
    return;
  }
  dreamChatMessagesContainer.innerHTML = '';
  if (chatHistory.length === 0) {
    dreamChatMessagesContainer.innerHTML = '<p class="chat-message-system">No messages yet. Send one to start!</p>';
    return;
  }
  chatHistory.forEach(msg => {
    const el = document.createElement('div');
    el.classList.add('chat-message', msg.sender === 'user' ? 'user-message' : 'ai-message');
    el.innerHTML = `
        <span class="message-sender">${escapeHTML(msg.sender === 'user' ? 'You (Past Self):' : 'Future Self (2029):')}</span>
        <p class="message-text">${escapeHTML(msg.text)}</p>
        <span class="message-timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
    `;
    dreamChatMessagesContainer.appendChild(el);
  });
  dreamChatMessagesContainer.scrollTop = dreamChatMessagesContainer.scrollHeight;
}

/**
 * Handles sending a chat message.
 */
async function handleSendChatMessage() {
  const dreamChatInput = document.getElementById("dream-chat-input");
  const dreamChatSendBtn = document.getElementById("dream-chat-send-btn");

  if (!dreamChatInput || !dreamChatSendBtn) {
      console.warn("[chatManager] Chat input or send button not found at runtime.");
      return;
  }
  const messageText = dreamChatInput.value.trim();
  console.log(`[chatManager] handleSendChatMessage: messageText="${messageText}", currentChatPodId=${currentChatPodId}`);

  if (!messageText || !currentChatPodId) {
    if (!messageText) showToast("Please type a message.", "info");
    if (!currentChatPodId) console.error("[chatManager] currentChatPodId is null in handleSendChatMessage.");
    return;
  }

  const userMessage = { sender: "user", text: messageText, timestamp: new Date().toISOString() };
  
  let allPods = getParallelYouPods(); 
  const podIndex = allPods.findIndex(p => p.id === currentChatPodId);
  if (podIndex === -1) { 
    showToast("Error: Current chat pod not found.", "error"); 
    return; 
  }
  
  allPods[podIndex].chatHistory.push(userMessage);
  setLocalStorageItem(PARALLEL_YOU_PODS_KEY, allPods); 
  renderDreamChatMessages(allPods[podIndex].chatHistory);
  dreamChatInput.value = '';

  const typingIndicator = document.getElementById('dream-chat-typing-indicator');
  if (typingIndicator) typingIndicator.style.display = 'block';
  dreamChatSendBtn.disabled = true;

  const appSettings = getAppSettings();
  const resolvedAISettings = getResolvedAiSettings(appSettings);
  if (!resolvedAISettings) {
    if (typingIndicator) typingIndicator.style.display = 'none';
    dreamChatSendBtn.disabled = false;
    return;
  }

  try {
    const aiResponseText = await generateChatResponseWithAI(
        currentChatPodGoal, 
        allPods[podIndex].chatHistory, 
        messageText, 
        resolvedAISettings
    );
    console.log("[chatManager] AI Response:", aiResponseText);

    if (aiResponseText && !aiResponseText.startsWith("Error:") && !aiResponseText.startsWith("The line to the future is a bit noisy")) {
      const aiMessage = { sender: "futureSelf", text: aiResponseText, timestamp: new Date().toISOString() };
      
      let currentPodsState = getParallelYouPods(); // Re-fetch to ensure latest state
      const currentPodIdx = currentPodsState.findIndex(p => p.id === currentChatPodId);
      if (currentPodIdx !== -1) {
        currentPodsState[currentPodIdx].chatHistory.push(aiMessage);
        setLocalStorageItem(PARALLEL_YOU_PODS_KEY, currentPodsState);
        renderDreamChatMessages(currentPodsState[currentPodIdx].chatHistory);
      } else {
          console.error("[chatManager] Pod disappeared while AI was responding.");
          showToast("Error: Could not save AI response, pod not found.", "error");
      }
    } else {
      showToast(aiResponseText || "AI did not provide a response.", "info");
    }
  } catch (error) { 
    showToast(`Error getting AI response: ${error.message}`, "error");
    console.error("[chatManager] AI response error:", error);
  } finally {
    const typingIndicator = document.getElementById('dream-chat-typing-indicator');
    if (typingIndicator) typingIndicator.style.display = 'none';
    if(dreamChatSendBtn) dreamChatSendBtn.disabled = false;
    if(dreamChatInput) dreamChatInput.focus();
  }
}

/**
 * Opens and prepares the chat view for a specific pod.
 */
export function openChatView(podId) {
  // ---- START OF IMPORTANT LOGS ----
  console.log(`[chatManager LOGS] openChatView CALLED with podId: ${podId}`); 
  currentChatPodId = podId;
  const pods = getParallelYouPods();
  console.log(`[chatManager LOGS] All pods retrieved:`, pods); 
  const pod = pods.find(p => p.id === podId);
  console.log(`[chatManager LOGS] Found pod for ID ${podId}:`, pod); 

  const dreamChatView = document.getElementById('dream-chat-view'); 
  console.log(`[chatManager LOGS] dreamChatView element found: ${!!dreamChatView}`); 
  const dreamChatGoalTitle = document.getElementById("dream-chat-goal-title");
  console.log(`[chatManager LOGS] dreamChatGoalTitle element found: ${!!dreamChatGoalTitle}`); 
  const dreamChatMessagesContainer = document.getElementById("dream-chat-messages-container");
  console.log(`[chatManager LOGS] dreamChatMessagesContainer element found: ${!!dreamChatMessagesContainer}`); 
  const dreamChatInput = document.getElementById("dream-chat-input");
  console.log(`[chatManager LOGS] dreamChatInput element found: ${!!dreamChatInput}`); 

  console.log(`[chatManager LOGS PRE-CONDITION CHECK] pod: ${!!pod}, dreamChatGoalTitle: ${!!dreamChatGoalTitle}, dreamChatMessagesContainer: ${!!dreamChatMessagesContainer}, dreamChatView: ${!!dreamChatView}`); 
  // ---- END OF IMPORTANT LOGS ----

  if (pod && dreamChatGoalTitle && dreamChatMessagesContainer && dreamChatView) {
    console.log(`[chatManager LOGS] Conditions MET. Setting up chat for pod: ${pod.goal}`); // DEBUG
    currentChatPodGoal = pod.goal; 
    dreamChatGoalTitle.textContent = `Chatting about: ${escapeHTML(pod.goal)}`;
    renderDreamChatMessages(pod.chatHistory || []);
    if(dreamChatInput) dreamChatInput.value = "";
    
    console.log(`[chatManager] Successfully opened chat for pod: ${podId} - Goal: ${pod.goal}`); // Existing log
  } else {
    console.error("[chatManager LOGS] Conditions NOT MET. Failed to open chat."); // DEBUG
    showToast("Error opening chat. Pod or essential UI elements missing.", "error");
    console.error("[chatManager] Failed to open chat. Missing pod or UI elements for podId:", podId,  // Existing log
                  {podExists: !!pod, titleEl: !!dreamChatGoalTitle, messagesEl: !!dreamChatMessagesContainer, viewEl: !!dreamChatView});
    currentChatPodId = null; 
    currentChatPodGoal = "";
    // If critical elements are missing, perhaps navigate away or show a persistent error in the view
    if (dreamChatMessagesContainer) { // Check if messages container exists to show error
        dreamChatMessagesContainer.innerHTML = '<p class="chat-message-system error-message">Could not load chat. Required elements are missing.</p>';
    }
    if (dreamChatGoalTitle) {
        dreamChatGoalTitle.textContent = 'Error Loading Chat';
    }
  }
}

/**
 * Initializes event listeners for the chat view.
 * @param {object} viewRenderCallbacks - The main app's viewRenderCallbacks for navigation.
 */
export function initializeChatManager(viewRenderCallbacks) {
  requestAnimationFrame(() => {
    const dreamChatSendBtn = document.getElementById("dream-chat-send-btn");
    const dreamChatInput = document.getElementById("dream-chat-input");
    const backToPodsBtn = document.getElementById("back-to-pods-btn");

    console.log(`[chatManager] Initializing (rAF). SendBtn: ${!!dreamChatSendBtn}, Input: ${!!dreamChatInput}, BackBtn: ${!!backToPodsBtn}`);

    if (dreamChatSendBtn && dreamChatInput) {
      if (!dreamChatSendBtn.dataset.listenerAttached) {
          dreamChatSendBtn.addEventListener('click', handleSendChatMessage);
          dreamChatSendBtn.dataset.listenerAttached = 'true';
          console.log("[chatManager] Send button listener attached.");
      }
      if (!dreamChatInput.dataset.listenerAttached) {
          dreamChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
              e.preventDefault();
              handleSendChatMessage();
            }
          });
          dreamChatInput.dataset.listenerAttached = 'true';
          console.log("[chatManager] Chat input keypress listener attached.");
      }
    } else {
        console.warn("[chatManager] Chat send button or input not found during initialization (rAF).");
    }

    if (backToPodsBtn) {
      if(!backToPodsBtn.dataset.listenerAttached) {
          backToPodsBtn.addEventListener('click', () => {
              console.log("[chatManager] Back to pods button clicked.");
              // Pass viewRenderCallbacks to switchToView if it's available and needed by that specific view transition
              switchToView('parallel-you-view', viewRenderCallbacks); 
          });
          backToPodsBtn.dataset.listenerAttached = 'true';
          console.log("[chatManager] Back to pods button listener attached.");
      }
    } else {
        console.warn("[chatManager] Back to pods button not found during initialization (rAF).");
    }
  });
}

window.setCurrentChatPodIdForNav = (podId) => {
    window.g_currentChatPodId = podId;
};
window.getCurrentChatPodIdForNav = () => {
    const id = window.g_currentChatPodId;
    window.g_currentChatPodId = null; 
    return id;
};
