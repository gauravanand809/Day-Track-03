const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generates content using the Gemini API.
 * @param {string} apiKey - The API key for Gemini.
 * @param {string} modelName - The name of the Gemini model to use.
 * @param {string} promptString - The prompt to send to the model.
 * @param {object} [generationConfig={ maxOutputTokens: 20000 }] - Optional generation configuration.
 * @returns {Promise<object>} A promise that resolves with an object containing the generated text or an error.
 *                           Example success: { text: "Generated content" }
 *                           Example error: { error: "Error message", details?: "Optional details" }
 */
async function generateGeminiContent(apiKey, modelName, promptString, generationConfig = { maxOutputTokens: 20000 }) {
  if (!apiKey) {
    console.error("[geminiApiHandler] API Key is missing.");
    return { error: "Gemini API Key is not configured." };
  }
  if (!modelName) {
    console.error("[geminiApiHandler] Model name is missing.");
    return { error: "Gemini model name is not specified." };
  }
  if (!promptString) {
    console.error("[geminiApiHandler] Prompt string is missing.");
    return { error: "Prompt is required for Gemini content generation." };
  }

  try {
    console.log(`[geminiApiHandler] Generating content with Gemini model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
    });

    const result = await model.generateContent(promptString);
    const response = await result.response;
    const text = await response.text();
    
    console.log(`[geminiApiHandler] Successfully received response from Gemini.`);
    return { text: text.trim() }; // Ensure to trim whitespace
  } catch (error) {
    console.error("[geminiApiHandler] Error generating content with Gemini:", error);
    // Try to provide a more specific error message if possible
    let errorMessage = "Failed to communicate with the Gemini AI model.";
    if (error.message) {
        errorMessage = error.message;
    }
    // Some errors from the SDK might have more details in error.details or similar properties
    // For now, just returning the message.
    return { error: errorMessage, details: error.toString() };
  }
}

module.exports = { generateGeminiContent };
