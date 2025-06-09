/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'error'} type - The type of toast.
 * @param {number} duration - How long to display the toast (in ms).
 */
export function showToast(message, type = "info", duration = 3000) {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.warn("Toast container not found. Cannot display toast:", message);
    return;
  }
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Trigger reflow to enable transition
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  toast.offsetHeight; 

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener(
      "transitionend",
      () => {
        if (toast.parentNode) { // Check if still in DOM
          toast.remove();
        }
      },
      { once: true }
    );
  }, duration);
}

/**
 * Escapes HTML special characters in a string.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') {
    if (str === null || typeof str === 'undefined') return '';
    str = String(str);
  }
  return str.replace(/[&<>"']/g, function (match) {
    switch (match) {
      case '&': return '&';
      case '<': return '<';
      case '>': return '>';
      case '"': return '"';
      case "'": return '&#039;';
      default: return match;
    }
  });
}

/**
 * Truncates a message to a maximum number of words.
 * @param {string} text - The text to truncate.
 * @param {number} maxWords - The maximum number of words.
 * @returns {string} The truncated text, or the original if within limit.
 */
export function truncateMessage(text, maxWords) {
  if (!text) return "";
  const words = text.split(/\s+/); // Split by any whitespace
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }
  return text;
}

/**
 * Shows or hides a loader element.
 * @param {boolean} show - True to show the loader, false to hide.
 * @param {string} loaderId - The ID of the loader element (default: 'loader').
 */
export function toggleLoader(show, loaderId = 'loader') {
  const loaderElement = document.getElementById(loaderId);
  if (loaderElement) {
    loaderElement.style.display = show ? 'block' : 'none';
  } else {
    console.warn(`[uiUtil] Loader element with ID '${loaderId}' not found.`);
  }
}

/**
 * Loads HTML content from a file and injects it into a target element.
 * @param {string} filePath - The path to the HTML template file.
 * @param {string} targetElementId - The ID of the DOM element to inject the HTML into.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function loadHTML(filePath, targetElementId) {
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) {
    console.error(`[uiUtil] Target element '${targetElementId}' not found for HTML injection.`);
    return false;
  }
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load HTML template: ${filePath}, status: ${response.status}`);
    }
    const html = await response.text();
    targetElement.innerHTML = html;
    console.log(`[uiUtil] HTML from ${filePath} loaded into #${targetElementId}`);
    return true;
  } catch (error) {
    console.error(`[uiUtil] Error loading HTML from ${filePath}:`, error);
    targetElement.innerHTML = `<p class="error-message">Error loading content. Please try again later.</p>`;
    return false;
  }
}
