import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { COMPLETED_TOPICS_KEY } from '../../utils/constantsUtil.js';

// const topicSelect = document.getElementById("topic-select"); // Removed: Element will be passed or queried in function

/**
 * Retrieves the list of completed topics from localStorage.
 * @returns {string[]} An array of completed topic names.
 */
export function getCompletedTopics() {
  return getLocalStorageItem(COMPLETED_TOPICS_KEY, []);
}

/**
 * Saves the list of completed topics to localStorage.
 * @param {string[]} topics - An array of completed topic names.
 */
function saveCompletedTopics(topics) {
  setLocalStorageItem(COMPLETED_TOPICS_KEY, topics);
}

/**
 * Updates the display of topics in the select dropdown, marking completed ones.
 * @param {HTMLSelectElement} topicSelectElement - The topic select dropdown element.
 */
export function updateTopicDisplay(topicSelectElement) {
  if (!topicSelectElement) {
    // Attempt to query if not passed, but ideally it should be passed
    const fallbackTopicSelect = document.getElementById("topic-select");
    if (!fallbackTopicSelect) {
        console.warn("[topicCompletion] topicSelect element not found for display update (neither passed nor found by ID).");
        return;
    }
    // eslint-disable-next-line no-param-reassign
    topicSelectElement = fallbackTopicSelect; 
  }
  const completedTopics = getCompletedTopics();
  Array.from(topicSelectElement.options).forEach((option) => {
    if (option.value && option.value !== 'other-topic') {
      const originalText = option.dataset.originalText || option.text.replace(" (Done)", "");
      option.dataset.originalText = originalText; // Store original text if not already stored
      option.text = completedTopics.includes(option.value) ? `${originalText} (Done)` : originalText;
    }
  });
}

/**
 * Marks a topic as done.
 * @param {string} topicName - The name of the topic to mark as done.
 * @param {HTMLSelectElement} topicSelectElement - The topic select dropdown element for UI update.
 */
export function markTopicAsDone(topicName, topicSelectElement) {
  if (!topicName) return;
  const completedTopics = getCompletedTopics();
  if (!completedTopics.includes(topicName)) {
    completedTopics.push(topicName);
    saveCompletedTopics(completedTopics);
    updateTopicDisplay(topicSelectElement);
  }
}

/**
 * Marks a topic as not done.
 * @param {string} topicName - The name of the topic to mark as not done.
 * @param {HTMLSelectElement} topicSelectElement - The topic select dropdown element for UI update.
 */
export function markTopicAsNotDone(topicName, topicSelectElement) {
  if (!topicName) return;
  let completedTopics = getCompletedTopics();
  if (completedTopics.includes(topicName)) {
    completedTopics = completedTopics.filter((t) => t !== topicName);
    saveCompletedTopics(completedTopics);
    updateTopicDisplay(topicSelectElement);
  }
}
