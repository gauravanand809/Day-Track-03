const https = require('https');

/**
 * Calls an OpenAI-compatible API for chat completions.
 * @param {string} baseUrl - The base URL of the OpenAI-compatible API.
 * @param {string} apiKey - The API key.
 * @param {string} modelName - The name of the model to use.
 * @param {Array<object>} messages - An array of message objects (e.g., [{ role: "user", content: "Hello" }]).
 * @param {number} [maxTokens=1500] - Maximum tokens to generate.
 * @param {number} [temperature=0.7] - Sampling temperature.
 * @param {object} [additionalParams={}] - Any additional parameters to include in the request body.
 * @returns {Promise<object>} A promise that resolves with an object containing the response text or an error.
 *                           Example success: { text: "Generated content" }
 *                           Example error: { error: "Error message", details?: "Optional details" }
 */
async function callOpenAICompatibleAPI(baseUrl, apiKey, modelName, messages, maxTokens = 1500, temperature = 0.7, additionalParams = {}) {
  if (!baseUrl || !modelName || !messages || messages.length === 0) {
    return { error: "Base URL, model name, and messages are required for OpenAI-compatible API call." };
  }

  const requestBody = JSON.stringify({
    model: modelName,
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature,
    ...additionalParams // Spread any additional parameters like response_format
  });

  return new Promise((resolve) => {
    try {
      const url = new URL(baseUrl);
      let apiPath = url.pathname;
      if (apiPath.endsWith('/')) {
        apiPath = apiPath.slice(0, -1); // Remove trailing slash
      }
      // Ensure the path ends with /chat/completions or similar standard if not already part of baseUrl
      if (!apiPath.endsWith('/chat/completions') && !apiPath.endsWith('/completions')) {
         // Prefer /chat/completions for newer models, but some local servers might use /completions
         // For this project, it seems /chat/completions is standard.
        apiPath += '/chat/completions';
      }


      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: apiPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey || 'dummy-key'}`, // Use dummy if no key, for local servers
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const contentType = res.headers['content-type'];
              if (contentType && contentType.includes('application/json')) {
                const responseJson = JSON.parse(data);
                // Standard OpenAI chat completion response structure
                const textContent = responseJson.choices && responseJson.choices[0] && responseJson.choices[0].message && responseJson.choices[0].message.content;
                if (textContent) {
                  resolve({ text: textContent.trim() });
                } else {
                  console.error("[openaiApiHandler] OpenAI response format error (expected content):", responseJson);
                  resolve({ error: "Failed to extract content from AI response. Unexpected format." });
                }
              } else {
                console.error(`[openaiApiHandler] API returned status ${res.statusCode} but with unexpected content-type: ${contentType}. Data: ${data.substring(0, 200)}...`);
                resolve({ error: `AI returned an unexpected response type: ${contentType}.` });
              }
            } else {
              console.error(`[openaiApiHandler] API error (${res.statusCode}):`, data);
              let errorDetails = `Raw error response: ${data.substring(0, 200)}...`;
              try {
                const errorJson = JSON.parse(data);
                if (errorJson && errorJson.error && errorJson.error.message) {
                  errorDetails = errorJson.error.message;
                } else if (errorJson && errorJson.message) {
                    errorDetails = errorJson.message;
                }
              } catch (e) { /* Was not JSON */ }
              resolve({ error: `AI API request failed with status ${res.statusCode}.`, details: errorDetails });
            }
          } catch (e) {
            console.error("[openaiApiHandler] Error processing API response or parsing JSON:", e, "Raw data:", data);
            resolve({ error: "Error processing AI response." });
          }
        });
      });

      req.on('error', (error) => {
        console.error('[openaiApiHandler] HTTPS request error:', error);
        resolve({ error: `Network error during API request: ${error.message}` });
      });

      req.write(requestBody);
      req.end();

    } catch (error) { // Catch errors from new URL() or other synchronous setup issues
      console.error('[openaiApiHandler] Error setting up API request:', error);
      resolve({ error: `Failed to setup API request: ${error.message}` });
    }
  });
}

module.exports = { callOpenAICompatibleAPI };
