import { getLocalStorageItem } from '../../utils/localStorageUtil.js';
import { CALENDAR_EVENTS_KEY } from '../../utils/constantsUtil.js';
import { getLocalDateString } from '../../utils/dateUtil.js';

// DOM elements are queried inside renderCalendarGrid

/**
 * Renders the main calendar grid with events.
 * @param {Date} dateToDisplay - The date indicating the month and year to render.
 * @param {(eventId: string | null, dateString?: string) => void} onOpenEventModal - Callback to open the event modal.
 */
export function renderCalendarGrid(dateToDisplay, onOpenEventModal) {
  const calendarGrid = document.getElementById("calendar-grid");
  const currentMonthYearDisplay = document.getElementById("current-month-year");

  if (!calendarGrid || !currentMonthYearDisplay) {
    console.warn("[calendarGrid] Calendar elements (grid or month/year display) not found at render time.");
    return;
  }
  calendarGrid.innerHTML = ""; // Clear previous grid
  const month = dateToDisplay.getMonth();
  const year = dateToDisplay.getFullYear();
  currentMonthYearDisplay.textContent = `${dateToDisplay.toLocaleString("default", { month: "long" })} ${year}`;
  currentMonthYearDisplay.dataset.currentDate = dateToDisplay.toISOString(); // Store the current date
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarEvents = getLocalStorageItem(CALENDAR_EVENTS_KEY, []);

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("calendar-day", "other-month");
    calendarGrid.appendChild(emptyCell);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("calendar-day");
    const dayDate = new Date(year, month, day);
    const dateString = getLocalDateString(dayDate);

    if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
      dayCell.classList.add("today");
    }
    dayCell.innerHTML = `<span class="day-number">${day}</span><div class="calendar-day-events"></div>`;
    dayCell.dataset.date = dateString;
    
    const dayEventsContainer = dayCell.querySelector(".calendar-day-events");
    if (dayEventsContainer) {
      calendarEvents
        .filter((event) => event.date === dateString)
        .forEach((event) => {
          const eventDiv = document.createElement("div");
          eventDiv.classList.add("calendar-event-item");
          if (event.isCompleted) eventDiv.classList.add("completed");
          eventDiv.classList.add(event.type === "ai-plan" ? "event-ai-plan" : "event-manual");
          eventDiv.textContent = event.title; // Short title for display
          eventDiv.dataset.eventId = event.id;
          eventDiv.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent dayCell click
            if (typeof onOpenEventModal === 'function') {
              onOpenEventModal(event.id);
            }
          });
          dayEventsContainer.appendChild(eventDiv);
        });
    }
    if (typeof onOpenEventModal === 'function') {
        dayCell.addEventListener("click", () => onOpenEventModal(null, dateString));
    }
    calendarGrid.appendChild(dayCell);
  }
}
