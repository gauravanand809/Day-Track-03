/**
 * Generates the prompt for creating an AI study plan.
 * @param {string} topic - The main topic/goal for the plan.
 * @param {string} startDate - The start date for the plan (YYYY-MM-DD).
 * @param {string} endDate - The end date for the plan (YYYY-MM-DD).
 * @returns {string} The formatted prompt string.
 */
export function getAiPlanPrompt(topic, startDate, endDate) {
  return `
Generate a study plan for the topic "${topic}" from ${startDate} to ${endDate}.
Break it down into daily tasks or focus areas. For each day, provide a concise task description.
The output MUST be a JSON array of objects. Each object in the array should represent a day in the plan and MUST have the following properties:
- "date": The date for the task in "YYYY-MM-DD" format.
- "taskDescription": A brief description of the task or focus for that day.
- "complexity": An estimated complexity, which can be "low", "medium", or "high".

Example for a 2-day plan:
[
  {
    "date": "YYYY-MM-DD", 
    "taskDescription": "Introduction to [Sub-topic 1 of ${topic}], cover basic concepts.",
    "complexity": "low"
  },
  {
    "date": "YYYY-MM-DD",
    "taskDescription": "Practice problems for [Sub-topic 1 of ${topic}], explore [Sub-topic 2 of ${topic}].",
    "complexity": "medium"
  }
]

Ensure every day within the range ${startDate} to ${endDate} (inclusive) has an entry if appropriate for the plan. If the topic can be covered in fewer days, only generate entries for those days.
Do not include any text before or after the JSON array.
The JSON should be well-formed and directly parsable.
Topic: "${topic}"
Start Date: ${startDate}
End Date: ${endDate}
`;
}
