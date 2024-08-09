/**
 * Cleans and formats a JSON string to be properly parsed as a JavaScript object.
 *
 * @param {string} string - The improperly formatted JSON string to clean.
 * @returns {object} - The cleaned and parsed JavaScript object.
 */
function cleanData(string) {
	// Define replacements for Python-style booleans, None, and hex escape sequences
	const replacements = {
		"'": '"', // Replace single quotes with double quotes
		False: "false", // Replace Python False with JavaScript false
		True: "true", // Replace Python True with JavaScript true
		None: "null", // Replace Python None with JavaScript null
		"\\x[0-9A-Fa-f]{2}": "", // Remove hexadecimal escape sequences like \xNN
		SINGLE_QUOTE_STANDBY: "'", // Placeholder for restoring single quotes
	};

	// Perform replacements using the defined dictionary
	let cleanedString = string.replace(/'/g, replacements["'"]);

	cleanedString = cleanedString.replace(
		/False|True|None/g,
		(match) => replacements[match]
	);

	cleanedString = cleanedString.replace(
		/\\x[0-9A-Fa-f]{2}/g,
		replacements["\\x[0-9A-Fa-f]{2}"]
	);

	// Handle in-string double quotes that need to be temporarily replaced
	cleanedString = cleanedString.replace(
		/(?<=[A-Za-z0-9])"(?=[A-Za-z0-9])/g,
		"SINGLE_QUOTE_STANDBY"
	);

	// Perform other specific replacements
	cleanedString = cleanedString
		.replace(/="/g, "=&quot;")
		.replace(/;"/g, ";&quot;")
		.replace(/">/g, "&quot;&gt;");

	// Restore single quotes that were placeholders
	cleanedString = cleanedString.replace(
		/SINGLE_QUOTE_STANDBY/g,
		replacements["SINGLE_QUOTE_STANDBY"]
	);

	// Parse the cleaned string into a JavaScript object
	const formattedData = JSON.parse(cleanedString);

	return formattedData;
}

// Export the cleanData function for use in other files
module.exports = cleanData;
