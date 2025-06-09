/**
 * Invokes the 'generate-todo' IPC handler in the main process.
 * @param {object} args - Arguments for the to-do generation (topic, aiProvider, api keys, models).
 * @returns {Promise<object>} A promise that resolves with the to-do list or an error object.
 */
export async function fetchGeneratedTodo(args) {
  if (window.electronAPI && typeof window.electronAPI.generateTodo === 'function') {
    try {
      return await window.electronAPI.generateTodo(args);
    } catch (error) {
      console.error('[apiUtil] Error invoking generateTodo via electronAPI:', error);
      return { error: 'Failed to invoke to-do generation API.', details: error.message };
    }
  }
  console.error('[apiUtil] electronAPI.generateTodo is not available.');
  return { error: 'ToDo generation API (electronAPI.generateTodo) is not available.' };
}

/**
 * Invokes the 'generate-ai-study-plan' IPC handler in the main process.
 * @param {object} planDetails - Arguments for the AI study plan generation.
 * @returns {Promise<object>} A promise that resolves with the study plan or an error object.
 */
export async function fetchAiStudyPlan(planDetails) {
  if (window.electronAPI && typeof window.electronAPI.generateAiStudyPlan === 'function') {
    try {
      return await window.electronAPI.generateAiStudyPlan(planDetails);
    } catch (error) {
      console.error('[apiUtil] Error invoking generateAiStudyPlan via electronAPI:', error);
      return { error: 'Failed to invoke AI study plan API.', details: error.message };
    }
  }
  console.error('[apiUtil] electronAPI.generateAiStudyPlan is not available.');
  return { error: 'AI Study Plan API (electronAPI.generateAiStudyPlan) is not available.' };
}

/**
 * Invokes the 'generate-text-completion' IPC handler in the main process.
 * @param {object} args - Arguments for text completion (prompt, aiProvider, api keys, models).
 * @returns {Promise<object>} A promise that resolves with the completed text or an error object.
 */
export async function fetchTextCompletion(args) {
  if (window.electronAPI && typeof window.electronAPI.generateTextCompletion === 'function') {
    try {
      return await window.electronAPI.generateTextCompletion(args);
    } catch (error) {
      console.error('[apiUtil] Error invoking generateTextCompletion via electronAPI:', error);
      return { error: 'Failed to invoke text completion API.', details: error.message };
    }
  }
  console.error('[apiUtil] electronAPI.generateTextCompletion is not available.');
  return { error: 'Text completion API (electronAPI.generateTextCompletion) is not available.' };
}
