const { jsonrepair } = require("jsonrepair");

/**
 * Cleans and formats a JSON string to be properly parsed as a JavaScript object.
 *
 * @param {string} string - The improperly formatted JSON string to clean.
 * @returns {object|null} - The cleaned and parsed JavaScript object, or null if parsing fails.
 */
function cleanData(string) {
	try {
		return JSON.parse(jsonrepair(string));
	} catch (err) {
		console.error(err);
	}
}

// Export the cleanData function for use in other files
module.exports = cleanData;
