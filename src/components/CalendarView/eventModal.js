import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorageUtil.js';
import { CALENDAR_EVENTS_KEY } from '../../utils/constantsUtil.js';
import { showToast } from '../../utils/uiUtil.js';
import { getLocalDateString } from '../../utils/dateUtil.js';

// DOM Elements are queried inside functions when needed.

let onEventSaveOrDeleteCallback = null; // To notify parent (CalendarView) to re-render

/**
 * Opens the event modal, populating it with event data if an eventId is provided,
 * or preparing it for a new event if dateString is provided.
 * @param {string | null} eventId - The ID of the event to edit, or null for a new event.
 * @param {string | null} dateString - The date string (YYYY-MM-DD) for a new event.
 */
export function openEventModal(eventId = null, dateString = null) {
  const eventModal = document.getElementById("event-modal");
  const eventIdInput = document.getElementById("event-id");
  const deleteEventBtn = document.getElementById("delete-event-btn");
  const eventModalTitle = document.getElementById("modal-title");
  const eventDateInput = document.getElementById("event-date");
  const eventTitleInput = document.getElementById("event-title");
  const eventDescriptionInput = document.getElementById("event-description");
  const eventTagsInput = document.getElementById("event-tags");
  const eventCompletedCheckbox = document.getElementById("event-completed");

  if (!eventModal || !eventIdInput || !deleteEventBtn || !eventModalTitle || !eventDateInput || 
      !eventTitleInput || !eventDescriptionInput || !eventTagsInput || !eventCompletedCheckbox) {
    console.error("[eventModal] UI elements for event modal not found at runtime.");
    return;
  }
  eventModal.style.display = "flex";
  eventIdInput.value = eventId || "";
  deleteEventBtn.style.display = eventId ? "inline-block" : "none";
  eventModalTitle.textContent = eventId ? "Edit Event" : "Add Event";

  if (eventId) {
    const events = getLocalStorageItem(CALENDAR_EVENTS_KEY, []);
    const event = events.find((e) => e.id === eventId);
    if (event) {
      eventDateInput.value = event.date;
      eventTitleInput.value = event.title;
      eventDescriptionInput.value = event.fullDescription || event.description || "";
      eventTagsInput.value = event.tags ? event.tags.join(", ") : "";
      eventCompletedCheckbox.checked = event.isCompleted || false;
    } else {
        showToast(`Event with ID ${eventId} not found.`, "error");
        closeEventModal(); 
    }
  } else {
    eventDateInput.value = dateString || getLocalDateString(new Date());
    eventTitleInput.value = "";
    eventDescriptionInput.value = "";
    eventTagsInput.value = "";
    eventCompletedCheckbox.checked = false;
  }
}

/**
 * Closes the event modal.
 */
export function closeEventModal() {
  const eventModal = document.getElementById("event-modal");
  if (eventModal) eventModal.style.display = "none";
}

/**
 * Handles saving an event (new or existing).
 */
function handleSaveEvent() {
  // Query elements needed for saving
  const eventIdInput = document.getElementById("event-id");
  const eventDateInput = document.getElementById("event-date");
  const eventTitleInput = document.getElementById("event-title");
  const eventDescriptionInput = document.getElementById("event-description");
  const eventTagsInput = document.getElementById("event-tags");
  const eventCompletedCheckbox = document.getElementById("event-completed");

  if (!eventIdInput || !eventDateInput || !eventTitleInput || !eventDescriptionInput || !eventTagsInput || !eventCompletedCheckbox) {
      showToast("Error: Could not find all event form elements.", "error");
      return;
  }

  const id = eventIdInput.value;
  const date = eventDateInput.value;
  const title = eventTitleInput.value.trim();
  const fullDesc = eventDescriptionInput.value.trim();

  if (!title || !date) {
    showToast("Event title and date are required.", "error");
    return;
  }
  
  let events = getLocalStorageItem(CALENDAR_EVENTS_KEY, []);
  const eventData = {
    date: date,
    title: title.substring(0, 30) + (title.length > 30 ? "..." : ""),
    fullDescription: fullDesc,
    tags: eventTagsInput.value.split(",").map(tag => tag.trim()).filter(tag => tag),
    isCompleted: eventCompletedCheckbox.checked,
  };

  if (id) { 
    const index = events.findIndex((e) => e.id === id);
    if (index > -1) {
      eventData.type = events[index].type || "manual"; 
      events[index] = { ...events[index], ...eventData }; 
    } else {
        showToast("Error: Could not find event to update.", "error");
        return;
    }
  } else { 
    eventData.id = String(Date.now());
    eventData.type = "manual"; 
    events.push(eventData);
  }
  
  setLocalStorageItem(CALENDAR_EVENTS_KEY, events);
  closeEventModal();
  showToast(id ? "Event updated!" : "Event added!", "success");
  if (typeof onEventSaveOrDeleteCallback === 'function') {
    onEventSaveOrDeleteCallback(); 
  }
}

/**
 * Handles deleting the currently open event.
 */
function handleDeleteEvent() {
  const eventIdInput = document.getElementById("event-id");
  if (!eventIdInput) {
      showToast("Error: Event ID input not found.", "error");
      return;
  }
  const id = eventIdInput.value;
  if (!id) {
      showToast("No event selected for deletion.", "error");
      return;
  }
  if (confirm("Are you sure you want to delete this event?")) {
    let events = getLocalStorageItem(CALENDAR_EVENTS_KEY, []);
    events = events.filter((e) => e.id !== id);
    setLocalStorageItem(CALENDAR_EVENTS_KEY, events);
    closeEventModal();
    showToast("Event deleted.", "info");
    if (typeof onEventSaveOrDeleteCallback === 'function') {
      // Get the currently displayed date from the calendar header to re-render the same month
      const currentMonthYearDisplay = document.getElementById("current-month-year");
      const currentDateString = currentMonthYearDisplay ? currentMonthYearDisplay.dataset.currentDate : null;
      const dateToRender = currentDateString ? new Date(currentDateString) : new Date(); // Fallback to today
      onEventSaveOrDeleteCallback(dateToRender); // Pass the date
    }
  }
}

/**
 * Initializes the event modal, setting up event listeners.
 * This function is called after the parent view's HTML (calendarView.html) is loaded.
 * @param {() => void} onSaveOrDelete - Callback function to execute after an event is saved or deleted.
 */
export function initializeEventModal(onSaveOrDelete) {
  onEventSaveOrDeleteCallback = onSaveOrDelete;

  // Query elements now that the template is loaded
  const eventModal = document.getElementById("event-modal");
  const closeEventModalBtn = document.getElementById("close-event-modal-btn");
  const saveEventBtn = document.getElementById("save-event-btn");
  const deleteEventBtn = document.getElementById("delete-event-btn");

  if (closeEventModalBtn) {
    if (!closeEventModalBtn.dataset.listenerAttached) {
        closeEventModalBtn.addEventListener("click", closeEventModal);
        closeEventModalBtn.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[eventModal] Close button not found during init.");
  }

  if (eventModal) { 
    if (!eventModal.dataset.listenerAttached) {
        eventModal.addEventListener("click", (e) => {
          if (e.target === eventModal) closeEventModal();
        });
        eventModal.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[eventModal] Modal backdrop element not found during init.");
  }

  if (saveEventBtn) {
    if (!saveEventBtn.dataset.listenerAttached) {
        saveEventBtn.addEventListener("click", handleSaveEvent);
        saveEventBtn.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[eventModal] Save button not found during init.");
  }

  if (deleteEventBtn) {
    if (!deleteEventBtn.dataset.listenerAttached) {
        deleteEventBtn.addEventListener("click", handleDeleteEvent);
        deleteEventBtn.dataset.listenerAttached = 'true';
    }
  } else {
      console.warn("[eventModal] Delete button not found during init.");
  }
}
