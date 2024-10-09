const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { jsonrepair } = require("jsonrepair");

const api = express();
const cors = require("cors");

api.use(cors());
api.use(express.json());

const cleanData = require("./utils/dataCleaner");

const bookingsDataLogs = path.join(__dirname, "booking_data");

const baseUrlPath = process.env.BASE_URL_PATH || "";
const port = process.env.PORT || 3000;

api.use(baseUrlPath, express.static(path.join(__dirname, "/public")));

/**
 * Reads and parses a JSON file asynchronously.
 *
 * @param {string} filePath - The path to the file to be read.
 * @returns {object|null} - The parsed JSON object, or null if an error occurs.
 */
function readAndParseFile(filePath) {
	try {
		const fileData = fs.readFileSync(filePath, "utf8");
		return JSON.parse(fileData);
	} catch (err) {
		console.error(`Error reading or parsing file ${filePath}:`, err);
		return null;
	}
}

/**
 * GET /api/bookings
 * Retrieves a paginated list of bookings from the data logs.
 *
 * Query Parameters:
 *   - page (number, optional): The page number to retrieve. Defaults to 1.
 *   - limit (number, optional): The number of items per page. Defaults to 12.
 *
 * Response:
 *   - total (number): The total number of bookings.
 *   - nextPage (number|null): The next page number, or null if there are no more pages.
 *   - prevPage (number|null): The previous page number, or null if this is the first page.
 *   - data (array): The list of bookings for the current page.
 */
api.get(`${baseUrlPath}/api/bookings`, (req, res) => {
	// Parse the page and limit query parameters. Defaults are page 1 and limit 12.
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 12;

	let startDateTimeFilter, endDateTimeFilter;

	// Determine the date range based on the filter query
	switch (req.query.filter) {
		case "today":
			startDateTimeFilter = new Date(); // Current time as start time
			endDateTimeFilter = new Date();
			endDateTimeFilter.setHours(23, 59, 59); // End of today
			break;

		case "tomorrow":
			startDateTimeFilter = new Date();
			startDateTimeFilter.setDate(startDateTimeFilter.getDate() + 1);
			startDateTimeFilter.setHours(0, 0, 0); // Start of tomorrow
			endDateTimeFilter = new Date();
			endDateTimeFilter.setDate(endDateTimeFilter.getDate() + 1);
			endDateTimeFilter.setHours(23, 59, 59); // End of tomorrow
			break;

		case "this_week":
			startDateTimeFilter = new Date();
			startDateTimeFilter.setDate(startDateTimeFilter.getDate() - startDateTimeFilter.getDay()); // Start of the week (Sunday)
			startDateTimeFilter.setHours(0, 0, 0);

			endDateTimeFilter = new Date();
			endDateTimeFilter.setDate(startDateTimeFilter.getDate() + 6); // End of the week (Saturday)
			endDateTimeFilter.setHours(23, 59, 59);
			break;

		default:
			// Fallback to the provided startDateTime or current time
			startDateTimeFilter = req.query.startDateTime ? new Date(req.query.startDateTime) : new Date();
			// Fallback to provided endDateTime or a far future date
			endDateTimeFilter = req.query.endDateTime
				? new Date(req.query.endDateTime)
				: new Date("9999-12-31T23:59:59Z");
			break;
	}

	// Read the directory containing booking data logs.
	fs.readdir(bookingsDataLogs, (err, files) => {
		if (err) {
			console.error("Could not list the directory.", err);
			res.status(500).send("Internal server error");
		}

		files.sort((a, b) => {
			return (
				fs.statSync(path.join(bookingsDataLogs, b)).mtime.getTime() -
				fs.statSync(path.join(bookingsDataLogs, a)).mtime.getTime()
			);
		});

		// Map over each file to read and parse booking data.
		const bookings = files
			.map((file) => {
				const filePath = path.join(bookingsDataLogs, file);
				try {
					// Read the file content and parse it as JSON.
					const parsedData = readAndParseFile(filePath);

					// Convert ISO date to local date string
					// const creationDateUTC = new Date(creationDateISO).toUTCString();

					// Clean the activityBookings field if it exists
					let activityBookings;
					if (parsedData.activityBookings) {
						activityBookings = cleanData(parsedData.activityBookings);
					}

					const startDateTimeISO = new Date(parseInt(activityBookings[0].startDateTime, 10)).toISOString();
					const endDateTimeISO = new Date(parseInt(activityBookings[0].endDateTime, 10)).toISOString();

					// Filter entries by date range
					if (
						new Date(startDateTimeISO) >= startDateTimeFilter &&
						new Date(endDateTimeISO) < endDateTimeFilter
					) {
						return {
							bookingId: parsedData.bookingId,
							creationDateISO: new Date(parseInt(parsedData.creationDate, 10)).toISOString(),
							startDateTimeISO: startDateTimeISO,
							endDateTimeISO: endDateTimeISO,
						};
					} else {
						return null;
					}
				} catch (err) {
					console.error(`Error reading or parsing file ${filePath}:`, err);
					return null; // Return null if there's an error.
				}
			})
			.filter(Boolean) // Filter out any null values resulting from errors.
			.sort((a, b) => new Date(a.startDateTimeISO) - new Date(b.startDateTimeISO)); // Sort by startDateTimeISO

		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;

		// Calculate total pages
		const totalPages = Math.ceil(bookings.length / limit);

		const result = {
			queryDate: new Date(),
			total: bookings.length,
			nextPage: endIndex < bookings.length ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			page: page, // Current page number
			totalPages: totalPages, // Total number of pages
			data: bookings.slice(startIndex, endIndex),
		};

		res.json(result);
	});
});

/**
 * GET /api/booking/single
 * Retrieves a single booking by its bookingId.
 *
 * Query Parameters:
 *   - bookingId (string): The ID of the booking to retrieve.
 *
 * Response:
 *   - 200: JSON object containing the booking data, excluding certain fields.
 *   - 400: If bookingId is not provided in the query parameters.
 *   - 404: If no booking with the specified bookingId is found.
 *   - 500: If there's an error reading the directory or files.
 */
api.get(`${baseUrlPath}/api/booking/single`, (req, res) => {
	const bookingIdQuery = req.query.bookingId;

	// Validate that bookingId is provided
	if (!bookingIdQuery) {
		return res.status(400).json({ message: "Booking ID required" });
	}

	// Read the directory containing booking data logs
	fs.readdir(bookingsDataLogs, (err, files) => {
		if (err) {
			console.error("Could not list the directory.", err);
			return res.status(500).send("Internal server error");
		}

		let foundBooking = null; // Variable to store the found booking

		// Loop through each file to find the booking with the specified bookingId
		for (const file of files) {
			const filePath = path.join(bookingsDataLogs, file);
			const fileData = readAndParseFile(filePath);

			// Check if the current file contains the requested bookingId
			if (fileData.bookingId == bookingIdQuery) {
				// Use loose equality (==) to allow type coercion

				// Exclude specified fields like customerPayments, bookingChannel, carRental
				const { accommodationBookings, affiliate, bookingChannel, ...filteredData } = fileData;

				// Clean the activityBookings field if it exists
				if (filteredData.activityBookings) {
					filteredData.activityBookings = cleanData(filteredData.activityBookings);
				}

				// Construct the final response object with bookingId at the top
				foundBooking = {
					bookingId: filteredData.bookingId, // Place bookingId first
					...filteredData, // Include all other data except excluded fields
				};
				break; // Stop the loop once the booking is found
			}
		}

		// Return the found booking or a 404 error if not found
		if (foundBooking) {
			return res.json(foundBooking); // Return the found booking
		} else {
			return res.status(404).json({ message: "Booking not found" }); // Booking not found
		}
	});
});

api.get(`${baseUrlPath}/webhook/zapier`, (req, res) => {
	res.status(200).send("GET request to the /zapier endpoint");
});

api.post(`${baseUrlPath}/webhook/zapier`, (req, res) => {
	if (!fs.existsSync(bookingsDataLogs)) {
		fs.mkdirSync(bookingsDataLogs, { recursive: true });
	}

	// Get the current timestamp using Date.parse()
	const event = new Date();
	const timestamp = Date.parse(event); // Timestamp in milliseconds

	// Set the file path with the timestamp as the filename
	const filePath = path.join(bookingsDataLogs, `${timestamp}.json`);

	// Write the file asynchronously
	fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
		if (err) {
			console.error("Error writing file:", err);
			return res.status(500).send("Error processing request");
		}

		// Respond with success and file name information
		res.status(200).send(
			`File created with timestamp ${timestamp}.json in the booking_data folder.`
		);
	});
});

api.get(`${baseUrlPath}/webhook/bokun`, (req, res) => {
	res.status(200).send("GET request to the /bokun endpoint");
});

api.post(`${baseUrlPath}/webhook/bokun`, (req, res) => {
	const bookingsLogs = path.join(__dirname, "booking_logs");

	if (!fs.existsSync(bookingsLogs)) {
		fs.mkdirSync(bookingsLogs, { recursive: true });
	}

	// Get the current timestamp using Date.parse()
	const event = new Date();
	const timestamp = Date.parse(event); // Timestamp in milliseconds

	// Set the file path with the timestamp as the filename
	const filePath = path.join(bookingsLogs, `${timestamp}.json`);

	// Write the file asynchronously
	fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
		if (err) {
			console.error("Error writing file:", err);
			return res.status(500).send("Error processing request");
		}

		// Respond with success and file name information
		res.status(200).send(
			`File created with timestamp ${timestamp}.json in the booking_logs folder.`
		);
	});
});

api.listen(port, () => console.log(`Application is running on port ${port} ${baseUrlPath}`));
