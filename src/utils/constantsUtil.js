export const CALENDAR_EVENTS_KEY = "customCalendarEvents";
export const APP_SETTINGS_KEY = "appSettings";
export const SAVED_AI_ENDPOINTS_KEY = "savedAiEndpoints";
export const APP_THEME_KEY = "appTheme";
export const DEFAULT_THEME = 'theme-default'; // Assuming 'theme-default' is the class for default
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-pro-preview-06-05";
export const HISTORY_KEY = "todoHistory";
export const COMPLETED_TOPICS_KEY = "completedTopics";
export const PARALLEL_YOU_PODS_KEY = "parallelYouPods";
export const MAX_POD_MESSAGE_WORDS = 20;
export const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";
export const DARK_MODE_KEY = "darkMode";

// Default settings structure - useful for initialization
export const DEFAULT_APP_SETTINGS = {
  aiProvider: "gemini",
  geminiApiKey: "",
  geminiModel: DEFAULT_GEMINI_MODEL,
  activeOpenAiEndpointId: null,
  activeOpenAiModelName: null,
};
