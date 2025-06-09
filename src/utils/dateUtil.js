/**
 * Converts a Date object to a "YYYY-MM-DD" string.
 * @param {Date} date - The date object to convert.
 * @returns {string} The date string in YYYY-MM-DD format.
 */
export function getLocalDateString(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("[dateUtil] Invalid date provided to getLocalDateString:", date);
    // Fallback to current date or handle error as appropriate
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
