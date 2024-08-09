/**
 * Cleans and formats a JSON string to be properly parsed as a JavaScript object.
 *
 * @param {string} string - The improperly formatted JSON string to clean.
 * @returns {object|null} - The cleaned and parsed JavaScript object, or null if parsing fails.
 */
function cleanData(string) {

	let cleanedString = string;

	try {

		// Perform replacements for Python-style booleans, None, hex escape sequences
		cleanedString = cleanedString
			.replace(/False/g, "false") // Replace Python False with JavaScript false
			.replace(/True/g, "true") // Replace Python True with JavaScript true
			.replace(/None/g, "null") // Replace Python None with JavaScript null
			.replace(/\\x[0-9A-Fa-f]{2}/g, ""); // Remove hexadecimal escape sequences like \xNN

		// console.log("(Booleans, None, Hex sequences, etc.)");

		// Handle single quotes used for contractions and replace with a placeholder
		cleanedString = cleanedString.replace(/\b(\w*)'(\w*)\b/g, "$1SINGLE_QUOTE_STANDBY$2");
		// console.log("(Single quotes to placeholder)");

		// Replace single quotes with double quotes globally
		cleanedString = cleanedString.replace(/'/g, '"');
		// console.log("(Single quotes to double quotes)");

		// Replace SINGLE_QUOTE_STANDBY with single quote
		cleanedString = cleanedString.replace(/SINGLE_QUOTE_STANDBY/g, "'");
		// console.log("(SINGLE_QUOTE_STANDBY replacement)");

		cleanedString = cleanedString
			.replace(/="(\S*?)"/g, "=\\\"$1\\\"")
			.replace(/="/g, "=\\\"")
			.replace(/(?<!\\)">/g, "\\\">");
		// console.log("(HTML tags fixes)");

		// Parse the cleaned string into a JavaScript object
		return JSON.parse(cleanedString);
	} catch (error) {
		console.error("Parsing error at step:", error.message);
		// console.error("Current state of string when error occurred:", cleanedString);
		return null;
	}
}

// Export the cleanData function for use in other files
module.exports = cleanData;
