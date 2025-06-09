import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { CALENDAR_EVENTS_KEY } from '../../utils/constantsUtil.js';
import { showToast, toggleLoader } from '../../utils/uiUtil.js';
import { fetchAiStudyPlan } from '../../utils/apiUtil.js';
import { getAppSettings, getResolvedAiSettings } from '../../utils/settingsUtil.js';

// DOM Elements are queried inside functions when needed.

let onAiPlanGeneratedCallback = null; // To notify parent (CalendarView) to re-render calendar

/**
 * Handles the AI study plan generation.
 */
async function handleGenerateAiPlan() {
  // Query elements at runtime
  const aiPlanTopicInput = document.getElementById("ai-plan-topic");
  const aiPlanStartDateInput = document.getElementById("ai-plan-start-date");
  const aiPlanEndDateInput = document.getElementById("ai-plan-end-date");
  const generateAiPlanBtn = document.getElementById("generate-ai-plan-btn");

  if (!aiPlanTopicInput || !aiPlanStartDateInput || !aiPlanEndDateInput || !generateAiPlanBtn) {
    console.warn("[aiPlanGenerator] UI elements for AI Plan generation not found at runtime.");
    showToast("Error: AI Plan UI elements missing.", "error");
    return;
  }
  const topic = aiPlanTopicInput.value.trim();
  const startDate = aiPlanStartDateInput.value;
  const endDate = aiPlanEndDateInput.value;

  console.log('[aiPlanGenerator] handleGenerateAiPlan called. Values:');
  console.log(`  Topic: "${topic}" (from element: ${!!aiPlanTopicInput})`);
  console.log(`  Start Date: "${startDate}" (from element: ${!!aiPlanStartDateInput})`);
  console.log(`  End Date: "${endDate}" (from element: ${!!aiPlanEndDateInput})`);

  if (!topic || !startDate || !endDate) {
    showToast("Please provide topic, start date, and end date for AI plan.", "error");
    return;
  }

  toggleLoader(true, 'loader'); // Assuming a general loader or a specific one for AI plan
  generateAiPlanBtn.disabled = true;
  generateAiPlanBtn.textContent = "Processing...";

  const appSettings = getAppSettings();
  const resolvedAISettings = getResolvedAiSettings(appSettings);
  if (!resolvedAISettings) {
      toggleLoader(false, 'loader');
      generateAiPlanBtn.disabled = false;
      generateAiPlanBtn.textContent = "Generate AI Plan";
      return;
  }

  const apiArgs = { 
    topic, 
    startDate, 
    endDate, 
    ...resolvedAISettings 
  };

  try {
    const planData = await fetchAiStudyPlan(apiArgs);

    if (planData && planData.error) {
      throw new Error(planData.details ? `${planData.error} - ${planData.details}` : planData.error);
    }

    if (planData && Array.isArray(planData) && planData.length > 0) {
      let currentCalendarEvents = getLocalStorageItem(CALENDAR_EVENTS_KEY, []);
      const newAiEvents = planData.map((p) => ({
        id: String(Date.now() + Math.random().toString(36).substr(2, 9)),
        title: p.taskDescription.substring(0,30) + (p.taskDescription.length > 30 ? "..." : ""),
        fullDescription: p.taskDescription,
        date: p.date,
        isCompleted: false,
        tags: [topic.replace(/\s+/g, "-").toLowerCase(), "ai-plan"],
        type: "ai-plan",
        complexity: p.complexity || "N/A"
      }));
      
      currentCalendarEvents = currentCalendarEvents.concat(newAiEvents);
      setLocalStorageItem(CALENDAR_EVENTS_KEY, currentCalendarEvents);
      
      showToast("AI study plan generated and added to calendar!", "success");
      aiPlanTopicInput.value = "";
      aiPlanStartDateInput.value = "";
      aiPlanEndDateInput.value = "";

      if (typeof onAiPlanGeneratedCallback === 'function') {
        onAiPlanGeneratedCallback();
      }
    } else {
      showToast("AI returned an empty or invalid plan. Please try again.", "info");
    }
  } catch (error) {
    console.error("[aiPlanGenerator] Error generating AI plan:", error);
    showToast(`Failed to generate AI plan: ${error.message}`, "error");
  } finally {
    toggleLoader(false, 'loader');
    generateAiPlanBtn.disabled = false;
    generateAiPlanBtn.textContent = "Generate AI Plan";
  }
}

/**
 * Initializes the AI Plan Generator, setting up event listeners.
 * @param {() => void} onPlanGenerated - Callback function to execute after a plan is generated.
 */
export function initializeAiPlanGenerator(onPlanGenerated) {
  onAiPlanGeneratedCallback = onPlanGenerated;
  // Query button here, as this function is called after parent template is loaded
  const generateAiPlanBtn = document.getElementById("generate-ai-plan-btn");
  if (generateAiPlanBtn) {
    // Ensure listener is only attached once
    if (!generateAiPlanBtn.dataset.listenerAttached) {
        generateAiPlanBtn.addEventListener("click", handleGenerateAiPlan);
        generateAiPlanBtn.dataset.listenerAttached = 'true';
    }
  } else {
    console.warn("[aiPlanGenerator] Generate AI Plan button not found during initialization.");
  }
}
