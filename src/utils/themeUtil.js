import { APP_THEME_KEY, DARK_MODE_KEY, DEFAULT_THEME } from './constantsUtil.js';
// getLocalStorageItem and setLocalStorageItem are not needed here if we store as plain strings

/**
 * Applies the dark mode preference by toggling 'dark-mode' class on the body
 * and updating the toggle button's text.
 */
export function applyDarkModePreference() {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (!document.body || !darkModeToggle) {
    console.warn('[themeUtil] Dark mode elements (body or toggle) not found.');
    return;
  }
  const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true'; // Compare with string 'true'
  document.body.classList.toggle("dark-mode", isDarkMode);
  darkModeToggle.textContent = isDarkMode ? "☀️" : "🌓";
}

/**
 * Toggles dark mode, saves the preference, and applies it.
 */
export function toggleDarkMode() {
  if (!document.body) return;
  const isDarkModeEnabled = document.body.classList.toggle("dark-mode");
  localStorage.setItem(DARK_MODE_KEY, isDarkModeEnabled.toString()); // Save as string 'true' or 'false'
  applyDarkModePreference(); // Update button text
}

/**
 * Applies a specific theme to the application.
 * @param {string} themeClassName - The CSS class name of the theme to apply.
 */
export function applyTheme(themeClassName) {
  const themeSelect = document.getElementById("theme-select");
  if (!document.body) {
    console.warn('[themeUtil] Document body not found for applying theme.');
    return;
  }

  const knownThemeClasses = [
    'theme-default', 'theme-ocean-blue', 'theme-forest-green', 'theme-graphite-gray',
    'theme-sunset-orange', 'theme-royal-purple', 'theme-teal-aqua', 'theme-ruby-red',
    'theme-goldenrod-yellow', 'theme-magenta-rose',
    'theme-solarized', 'theme-nord', 'theme-dracula', 'theme-monokai',
    'theme-gruvbox', 'theme-tomorrow-night-blue', 'theme-one-dark-pro', 
    'theme-material-palenight', 'theme-github'
  ];

  knownThemeClasses.forEach(cls => document.body.classList.remove(cls));
  
  const effectiveTheme = themeClassName || DEFAULT_THEME;
  document.body.classList.add(effectiveTheme);
  localStorage.setItem(APP_THEME_KEY, effectiveTheme); // Save as plain string

  if (themeSelect) {
    // Ensure the value matches the format in the select options (without 'theme-')
    const selectValue = effectiveTheme.startsWith('theme-') ? effectiveTheme.substring(6) : effectiveTheme;
    themeSelect.value = selectValue;
  }
}

/**
 * Loads the saved theme from localStorage and applies it.
 * If no theme is saved, applies the default theme.
 */
export function loadSavedTheme() {
  const savedTheme = localStorage.getItem(APP_THEME_KEY) || DEFAULT_THEME; // Get as plain string
  applyTheme(savedTheme);
}

/**
 * Initializes theme and dark mode functionalities.
 * Should be called once when the application starts.
 */
export function initializeTheming() {
  loadSavedTheme();
  applyDarkModePreference();

  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode);
  }

  const themeSelect = document.getElementById("theme-select");
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      applyTheme(`theme-${e.target.value}`);
    });
  }
}
