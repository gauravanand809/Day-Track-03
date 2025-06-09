import { renderCalendarGrid } from './calendarGrid.js'; // Removed initializeCalendarGrid
import { initializeEventModal, openEventModal, closeEventModal } from './eventModal.js';
import { initializeAiPlanGenerator } from './aiPlanGenerator.js';

// DOM elements will be queried within renderCalendarView

/**
 * This function is called by the navigation utility when switching to the Calendar view.
 * It handles the one-time DOM setup and event listener attachments.
 */
export function renderCalendarView() {
  const calendarViewEl = document.getElementById('calendar-view');
  if (!calendarViewEl) {
    console.warn("[CalendarView] View element (#calendar-view) not found.");
    return;
  }

  if (calendarViewEl.dataset.initialized !== 'true') {
    console.log("[CalendarView] Performing one-time DOM setup.");

    // Query for elements specific to this view, now that its HTML is loaded.
    const prevMonthBtn = document.getElementById("prev-month-btn");
    const nextMonthBtn = document.getElementById("next-month-btn");
    const todayBtn = document.getElementById("today-btn");
    // Other elements like calendar-grid, current-month-year are handled by calendarGrid.js
    // Event modal elements are handled by eventModal.js
    // AI Plan generator elements are handled by aiPlanGenerator.js

    // Initialize sub-modules. They should query their own DOM elements internally.
    initializeEventModal((dateToRefresh) => { // Updated callback
        const dateForGrid = dateToRefresh instanceof Date ? dateToRefresh : new Date();
        renderCalendarGrid(dateForGrid, openEventModal);
    });
    initializeAiPlanGenerator(() => { // Callback for AI Plan Generator
        const currentMonthYearDisplay = document.getElementById("current-month-year");
        const currentDateString = currentMonthYearDisplay ? currentMonthYearDisplay.dataset.currentDate : null;
        const dateToRender = currentDateString ? new Date(currentDateString) : new Date();
        renderCalendarGrid(dateToRender, openEventModal);
    });

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        const currentDate = new Date(document.getElementById("current-month-year").dataset.currentDate || Date.now());
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendarGrid(currentDate, openEventModal);
      });
    } else {
      console.warn("[CalendarView] Previous month button not found post-load.");
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        const currentDate = new Date(document.getElementById("current-month-year").dataset.currentDate || Date.now());
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendarGrid(currentDate, openEventModal);
      });
    } else {
      console.warn("[CalendarView] Next month button not found post-load.");
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        renderCalendarGrid(new Date(), openEventModal);
      });
    } else {
      console.warn("[CalendarView] Today button not found post-load.");
    }
    
    calendarViewEl.dataset.initialized = 'true';
    console.log("Calendar View DOM Initialized and listeners attached.");
  } else {
    console.log("[CalendarView] Already initialized.");
  }

  // Always render the calendar grid when the view is shown.
  // Use the date stored in current-month-year's dataset or default to today.
  const currentDisplayDate = document.getElementById("current-month-year")?.dataset.currentDate;
  renderCalendarGrid(currentDisplayDate ? new Date(currentDisplayDate) : new Date(), openEventModal);
}

// Original initialize function, now largely superseded by renderCalendarView for DOM setup.
export function initializeCalendarView() {
  // This function is called by app.js.
  // It should now only contain non-DOM specific setup if any,
  // or simply be a placeholder if all setup is in renderCalendarView.
  console.log("CalendarView module loaded (initializeCalendarView called - should be minimal or no-op).");
}
