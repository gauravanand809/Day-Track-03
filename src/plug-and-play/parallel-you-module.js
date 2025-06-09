// src/plug-and-play/parallel-you-module.js
import { getParallelYouInitialPrompt, getParallelYouChatPrompt } from '../../electron/prompts/textCompletionPrompt.js'; // Moved import to top

// --- Configuration & Constants ---
const FUTURE_YEAR_OFFSET = 5;
const CHAT_HISTORY_LIMIT = 10; // Max history items to send in prompt
const CURRENT_YEAR = new Date().getFullYear();
const FUTURE_YEAR = CURRENT_YEAR + FUTURE_YEAR_OFFSET;

// --- Internal Helper ---
async function _createAIApiCall(prompt, aiSettings, promptType, baseUserPromptForIPC, chatHistoryForIPC = [], contextDetailsForIPC = null) {
  if (!aiSettings?.aiProvider) {
    console.error("[ParallelYouModule] AI settings are missing or invalid.");
    return { error: "Configuration error: AI settings not provided." };
  }
  if (!window.electronAPI?.generateTextCompletion) {
    console.error("[ParallelYouModule] electronAPI.generateTextCompletion is not available.");
    return { error: "Timeline communication channel is not open." };
  }

  // Prepare args for the refactored IPC handler
  const ipcArgs = {
    prompt, // This is the fully constructed prompt for the AI model
    aiProvider: aiSettings.aiProvider,
    geminiApiKey: aiSettings.geminiApiKey,
    geminiModel: aiSettings.geminiModel,
    openaiBaseUrl: aiSettings.openaiBaseUrl,
    openaiApiKey: aiSettings.openaiApiKey,
    openaiModel: aiSettings.openaiModel,
    promptType: promptType, // e.g., 'parallelYouInitial', 'parallelYouChat'
    baseUserPrompt: baseUserPromptForIPC, // The core user input (goal or message)
    chatHistory: chatHistoryForIPC, // Relevant for chat type
    contextDetails: contextDetailsForIPC // e.g., the goal for chat context
  };
  
  try {
    const result = await window.electronAPI.generateTextCompletion(ipcArgs);
    if (!result) return { error: "The connection to the future is silent right now. Please try again." };
    if (result.error) return { error: `The signal from ${FUTURE_YEAR} is unclear... (${result.details || result.error})` };
    if (typeof result.text === "string" && result.text.trim()) return { text: result.text.trim() };
    return { error: "The future is a bit hazy right now, but keep believing! (Unexpected data)" };
  } catch (error) {
    console.error("[ParallelYouModule] Error in _createAIApiCall:", error);
    return { error: `I tried to channel your future self, but the timeline connection was fuzzy... (Error: ${error.message})` };
  }
}

/**
 * Generates the initial message from the "future self".
 * @param {string} goal - The user's defined goal.
 * @param {object} aiSettings - Resolved AI settings.
 * @returns {Promise<string>} The AI-generated message or an error string.
 */
export async function generateFutureSelfMessageWithAI(goal, aiSettings) {
  console.log("[ParallelYouModule] Generating initial message.");
  const prompt = getParallelYouInitialPrompt(goal); // Use imported prompt function
  const result = await _createAIApiCall(prompt, aiSettings, 'parallelYouInitial', goal);
  return result.text || result.error || "It seems the future is quiet at the moment. Try again soon.";
}

/**
 * Generates a chat response from the "future self".
 * @param {string} goal - The user's goal (for context).
 * @param {Array<object>} chatHistory - The recent chat history.
 * @param {string} currentUserMessage - The user's latest message.
 * @param {object} aiSettings - Resolved AI settings.
 * @returns {Promise<string>} The AI-generated chat response or an error string.
 */
export async function generateChatResponseWithAI(goal, chatHistory, currentUserMessage, aiSettings) {
  console.log("[ParallelYouModule] Generating chat response.");
  
  // The getParallelYouChatPrompt function in textCompletionPrompt.js handles history formatting.
  const prompt = getParallelYouChatPrompt(goal, chatHistory, currentUserMessage); 

  const result = await _createAIApiCall(prompt, aiSettings, 'parallelYouChat', currentUserMessage, chatHistory, goal);
  return result.text || result.error || "The line to the future is a bit noisy... What were you saying?";
}

console.log("Parallel You AI Module (ESM) loaded. [Version: Prompts-Extracted]");
