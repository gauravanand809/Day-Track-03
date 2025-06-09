/**
 * Generates the prompt for creating a detailed to-do list for a given topic.
 * @param {string} topic - The topic for which to generate the to-do list.
 * @returns {string} The formatted prompt string.
 */
export function getTodoPrompt(topic) {
  return `
Generate a highly detailed and exhaustive to-do list for a student preparing for technical interviews on the topic of **"${topic}"**. Your response MUST be a single Markdown table and nothing else. Do not include any introductory text before the table or after it.

**Table Structure Requirements:**
1.  The table MUST have exactly four columns: "Check", "Category", "Algorithm/Topic", and "Notes".
2.  The "Check" column must only contain "[ ]" for each row.
3.  The "Category" column should group related concepts. For example, under "String Matching," categories could be "Pattern Matching," "Hashing," "Trie," "Suffix Structures," etc.
4.  The "Algorithm/Topic" column must list specific, individual algorithms, data structures, or key concepts.
5.  The "Notes" column is critical. For each item, provide a concise but informative note. This note should include the time/space complexity (e.g., O(n log n)), a key insight, a common use case, or a pitfall to watch out for.

**Content Requirements:**
* **Depth:** Be exhaustive. Cover the topic from the absolute basics to advanced, niche concepts. Include prerequisite knowledge, common variations of problems, and important theoretical underpinnings.
* **Completeness:** Do not leave out any major or minor sub-topics. For instance, if the topic is "Dynamic Programming," you must include sections for 1D DP, 2D DP, DP on Trees, Digit DP, Bitmask DP, etc.
* **Clarity:** Use clear and standard terminology.
* **Structure:** Logically group related items under the same "Category".

**Example Output Structure (for "String Matching"):**
| Check | Category          | Algorithm/Topic          | Notes                                      |
|-------|-------------------|--------------------------|--------------------------------------------|
| [ ]   | Pattern Matching  | Naive Pattern Matching   | Brute-force check. Time: O(n*m).           |
| [ ]   | Pattern Matching  | KMP (Knuth-Morris-Pratt) | Uses LPS array to avoid backtracking. Time: O(n+m). |
| [ ]   | Suffix Structures | Suffix Array             | Sorted array of all suffixes. Build: O(n log n). |
| [ ]   | DP on Strings     | Longest Common Subsequence | DP state: dp[i][j]. Time: O(n*m).          |

Now, generate this detailed to-do list for the topic: **"${topic}"**.
`;
}
