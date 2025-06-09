/**
 * Retrieves an item from localStorage and parses it as JSON.
 * @param {string} key - The key of the item to retrieve.
 * @param {any} defaultValue - The default value to return if the key is not found or parsing fails.
 * @returns {any} The parsed item or the defaultValue.
 */
export function getLocalStorageItem(key, defaultValue = null) {
  try {
    const itemString = localStorage.getItem(key);
    if (itemString === null) {
      return defaultValue;
    }
    return JSON.parse(itemString);
  } catch (error) {
    console.error(`[localStorageUtil] Error getting item "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Saves an item to localStorage after serializing it to JSON.
 * @param {string} key - The key under which to save the item.
 * @param {any} value - The value to save.
 */
export function setLocalStorageItem(key, value) {
  try {
    const itemString = JSON.stringify(value);
    localStorage.setItem(key, itemString);
  } catch (error) {
    console.error(`[localStorageUtil] Error setting item "${key}" in localStorage:`, error);
  }
}

/**
 * Removes an item from localStorage.
 * @param {string} key - The key of the item to remove.
 */
export function removeLocalStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[localStorageUtil] Error removing item "${key}" from localStorage:`, error);
  }
}
