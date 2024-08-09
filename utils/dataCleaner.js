/**
 * Cleans and formats a JSON string to be properly parsed as a JavaScript object.
 *
 * @param {string} string - The improperly formatted JSON string to clean.
 * @returns {object|null} - The cleaned and parsed JavaScript object, or null if parsing fails.
 */
function cleanData(string) {
	let cleanedString;

	try {
		// Step 1: Handle single quotes used for contractions and replace with a placeholder
		cleanedString = string.replace(/\b(\w*)'(\w*)\b/g, "$1SINGLE_QUOTE_STANDBY$2");
		console.log("Step 1 (Single quotes to placeholder)");

		// Step 2: Replace escaped double quotes with a placeholder
		cleanedString = cleanedString.replace(/\\"/g, "DOUBLE_QUOTES_STANDBY");
		console.log("Step 2 (Escaped double quotes to placeholder)");

		// Step 3: Replace double quotes with a placeholder
		cleanedString = cleanedString.replace(/"/g, "DOUBLE_QUOTES_STANDBY");
		console.log("Step 2 (Double quotes to placeholder)");

		// Step 3: Replace DOUBLE_QUOTES_STANDBY only for non-space values
		cleanedString = cleanedString.replace(/DOUBLE_QUOTES_STANDBY(\S*?)DOUBLE_QUOTES_STANDBY/g, "$1");
		console.log("Step 3 (Specific DOUBLE_QUOTES_STANDBY replacement)");

		// Step 4: Perform replacements for Python-style booleans, None, hex escape sequences
		// and other explicit fixes for HTML elements
		cleanedString = cleanedString
			.replace(/False/g, "false") // Replace Python False with JavaScript false
			.replace(/True/g, "true") // Replace Python True with JavaScript true
			.replace(/None/g, "null") // Replace Python None with JavaScript null
			.replace(/\\x[0-9A-Fa-f]{2}/g, "") // Remove hexadecimal escape sequences like \xNN
			.replace(/="/g, "=&quot;")
			.replace(/;"/g, ";&quot;")
			.replace(/">/g, "&quot;&gt;");

		console.log("Step 4 (Booleans, None, Hex sequences, etc.)");

		// Step 5: Replace single quotes with double quotes globally
		cleanedString = cleanedString.replace(/'/g, '"');
		console.log("Step 5 (Single quotes to double quotes)");

		// Step 6: Replace remaining DOUBLE_QUOTES_STANDBY with double quotes
		cleanedString = cleanedString.replace(/DOUBLE_QUOTES_STANDBY/g, '"');
		console.log("Step 7 (Final DOUBLE_QUOTES_STANDBY replacement)");

		// Step 8: Parse the cleaned string into a JavaScript object
		return JSON.parse(cleanedString);
	} catch (error) {
		console.error("Parsing error at step:", error.message);
		console.error("Current state of string when error occurred:", cleanedString);
		return null;
	}
}

// Export the cleanData function for use in other files
module.exports = cleanData;
