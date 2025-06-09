/**
 * Generates a generic prompt for text completion, allowing for context and specific instructions.
 * @param {string} baseUserPrompt - The core request or question from the user.
 * @param {string} [systemContext="You are a helpful assistant."] - System-level instructions or persona.
 * @param {string} [examples=""] - Few-shot examples if needed, in a "User: ...\nAssistant: ..." format.
 * @returns {string} The formatted prompt string.
 */
export function getGenericTextCompletionPrompt(baseUserPrompt, systemContext = "You are a helpful assistant.", examples = "") {
  let fullPrompt = systemContext + "\n\n";
  if (examples) {
    fullPrompt += "Here are some examples of how to respond:\n" + examples + "\n\n";
  }
  fullPrompt += "User: " + baseUserPrompt + "\nAssistant:";
  return fullPrompt;
}

/**
 * Generates a specific prompt for the Parallel You feature's initial message.
 * @param {string} goal - The user's defined goal.
 * @returns {string} The formatted prompt string.
 */
export function getParallelYouInitialPrompt(goal) {
  return `You are my future self from the year 2029, embodying wisdom, experience, and a slightly reflective tone. My current primary goal is: "${goal}". 
Knowing what you know now from your vantage point in 2029, what is one single, concise, and impactful piece of advice, encouragement, or a key insight you would share with your past self (me, today) regarding this goal? 
Keep your message to 1-3 sentences. Be encouraging and a little bit mysterious, hinting at the journey ahead without revealing specifics.`;
}

/**
 * Generates a prompt for ongoing chat in the Parallel You feature.
 * @param {string} goal - The user's defined goal for context.
 * @param {Array<{sender: string, text: string}>} chatHistory - Array of recent chat messages.
 * @param {string} currentUserMessage - The latest message from the user (past self).
 * @returns {string} The formatted prompt string.
 */
export function getParallelYouChatPrompt(goal, chatHistory, currentUserMessage) {
  let historyString = chatHistory.map(msg => {
    return `${msg.sender === 'user' ? 'Past Self (Me)' : 'Future Self (2029)'}: ${msg.text}`;
  }).join('\n');

  return `You are my future self from the year 2029, continuing a conversation with your past self (me, today).
My current primary goal we are discussing is: "${goal}".

Our recent conversation history:
${historyString}
Past Self (Me): ${currentUserMessage}
Future Self (2029): [Your thoughtful, concise, and encouraging reply based on the history and my latest message, keeping in character as a wiser future self. Aim for 1-4 sentences.]`;
}
