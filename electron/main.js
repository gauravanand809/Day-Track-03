const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
require('dotenv').config(); // To load environment variables

// Import API Handlers
const { generateGeminiContent } = require('./apiHandlers/geminiApiHandler.js');
const { callOpenAICompatibleAPI } = require('./apiHandlers/openaiApiHandler.js');

// Import Prompts
const { getTodoPrompt } = require('./prompts/todoPrompt.js');
const { getAiPlanPrompt } = require('./prompts/aiPlanPrompt.js');
const { getParallelYouInitialPrompt, getParallelYouChatPrompt, getGenericTextCompletionPrompt } = require('./prompts/textCompletionPrompt.js');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Day-Planner",
    icon: path.join(__dirname, '../public/images/icon.png'), // Corrected path for icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Correct path for preload within electron/
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html'); // Assumes index.html is in the root
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler for To-Do Generation
ipcMain.handle('generate-todo', async (event, args) => {
  const { topic, aiProvider, geminiApiKey, geminiModel, openaiBaseUrl, openaiApiKey, openaiModel } = args;
  if (!topic) return { error: "Topic is required" };

  const promptContent = getTodoPrompt(topic);
  let result;

  if (aiProvider === 'gemini') {
    if (!geminiApiKey || !geminiModel) return { error: "Gemini API Key/Model missing." };
    result = await generateGeminiContent(geminiApiKey, geminiModel, promptContent, { maxOutputTokens: 20000 });
  } else if (aiProvider === 'openai') {
    if (!openaiBaseUrl || !openaiModel) return { error: "OpenAI Base URL/Model missing." };
    const messages = [{ role: "user", content: promptContent }];
    result = await callOpenAICompatibleAPI(openaiBaseUrl, openaiApiKey, openaiModel, messages, 3000, 0.5);
  } else {
    return { error: "Invalid AI Provider" };
  }
  // Adapt result structure if needed, assuming handlers return { text: "..." } or { error: "..." }
  return result.text ? { todoList: result.text } : result;
});

// IPC Handler for AI Study Plan Generation
ipcMain.handle('generate-ai-study-plan', async (event, args) => {
  const { topic, startDate, endDate, aiProvider, geminiApiKey, geminiModel, openaiBaseUrl, openaiApiKey, openaiModel } = args;
  if (!topic || !startDate || !endDate) return { error: "Topic, start date, and end date are required." };

  const promptContent = getAiPlanPrompt(topic, startDate, endDate);
  let result;

  if (aiProvider === 'gemini') {
    if (!geminiApiKey || !geminiModel) return { error: "Gemini API Key/Model missing for AI Plan." };
    // Gemini might need specific config for JSON, or rely on prompt structure.
    // For now, assuming it returns text that needs parsing.
    result = await generateGeminiContent(geminiApiKey, geminiModel, promptContent, { maxOutputTokens: 4096 /*, responseMimeType: "application/json"*/ });
    if (result.text) {
        try {
            const planArray = JSON.parse(result.text.replace(/^```json\s*|```$/g, '').trim());
            if (Array.isArray(planArray) && planArray.every(item => item.date && item.taskDescription)) {
                return planArray;
            }
            return { error: "AI plan response was not a valid array of plan objects (Gemini)." };
        } catch (e) {
            return { error: `Failed to parse AI plan data from Gemini: ${e.message}` };
        }
    }
    return result; // Return error object from handler if any
  } else if (aiProvider === 'openai') {
    if (!openaiBaseUrl || !openaiModel) return { error: "OpenAI Base URL/Model missing for AI Plan." };
    const messages = [{ role: "user", content: promptContent }];
    // For OpenAI, you might try to enforce JSON object response if the server supports it
    const additionalParams = { response_format: { "type": "json_object" } };
    result = await callOpenAICompatibleAPI(openaiBaseUrl, openaiApiKey, openaiModel, messages, 4096, 0.5, additionalParams);
     if (result.text) {
        try {
            const planArray = JSON.parse(result.text.replace(/^```json\s*|```$/g, '').trim()); // Clean just in case
            if (Array.isArray(planArray) && planArray.every(item => item.date && item.taskDescription)) {
                return planArray;
            }
            return { error: "AI plan response was not a valid array of plan objects (OpenAI)." };
        } catch (e) {
            return { error: `Failed to parse AI plan data from OpenAI: ${e.message}` };
        }
    }
    return result; // Return error object from handler if any
  } else {
    return { error: "Invalid AI Provider for AI Plan." };
  }
});

// IPC Handler for Generic Text Completion
ipcMain.handle('generate-text-completion', async (event, args) => {
  const { baseUserPrompt, contextDetails, chatHistory, aiProvider, geminiApiKey, geminiModel, openaiBaseUrl, openaiApiKey, openaiModel, promptType } = args;
  
  if (!baseUserPrompt && !chatHistory) return { error: "Prompt or chat history is required." };

  let promptContent;
  if (promptType === 'parallelYouInitial') {
    promptContent = getParallelYouInitialPrompt(baseUserPrompt); // baseUserPrompt is the goal here
  } else if (promptType === 'parallelYouChat') {
    // baseUserPrompt is the latest user message, contextDetails is the goal
    promptContent = getParallelYouChatPrompt(contextDetails, chatHistory, baseUserPrompt);
  } else {
    // Fallback to generic prompt or handle error
    promptContent = getGenericTextCompletionPrompt(baseUserPrompt, contextDetails?.systemContext, contextDetails?.examples);
  }
  
  let result;

  if (aiProvider === 'gemini') {
    if (!geminiApiKey || !geminiModel) return { error: "Gemini API Key/Model missing for text completion." };
    result = await generateGeminiContent(geminiApiKey, geminiModel, promptContent, { maxOutputTokens: 250, temperature: 0.7 });
  } else if (aiProvider === 'openai') {
    if (!openaiBaseUrl || !openaiModel) return { error: "OpenAI Base URL/Model missing for text completion." };
    const messages = [{ role: "user", content: promptContent }];
    result = await callOpenAICompatibleAPI(openaiBaseUrl, openaiApiKey, openaiModel, messages, 250, 0.7);
  } else {
    return { error: "Invalid AI Provider for text completion." };
  }
  return result; // API handlers return { text: "..." } or { error: "..." }
});
