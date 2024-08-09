const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const api = express();

const cors = require("cors");
api.use(cors());

const cleanData = require("./utils/dataCleaner");

const baseUrlPath = process.env.BASE_URL_PATH || "";
const port = process.env.PORT || 3000;

if (baseUrlPath) {
	api.use(baseUrlPath, express.static(path.join(__dirname, "public")));
} else {
	api.use("/", express.static(path.join(__dirname, "public")));
}

api.use(express.json());

const bookingsDataLogs = path.join(__dirname, "booking_data");

api.get(`${baseUrlPath}/api/bookings`, (req, res) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 12;

	fs.readdir(bookingsDataLogs, (err, files) => {
		if (err) {
			console.error("Could not list the directory.", err);
			res.status(500).send("Internal server error");
		}

		// Map over each file to read and parse booking data.
		const bookings = files.map((file) => {
			const filePath = path.join(bookingsDataLogs, file);
			try {
				// Read the file content and parse it as JSON.
				const fileData = fs.readFileSync(filePath, 'utf8');
				const parsedData = JSON.parse(fileData);

				// Extract and format the creation date.
				const creationDate = parsedData.creationDate;
				const creationDateISO = new Date(parseInt(creationDate, 10)).toISOString();

				// Convert ISO date to local date string
				const creationDateUTC = new Date(creationDateISO).toUTCString();

				// Return an object containing bookingId, creationDate, and creationDateISO.
				return {
					bookingId: parsedData.bookingId,
					// ...parsedData,
					creationDateISO: creationDateISO,
					creationDateUTC: creationDateUTC,
				};
			} catch (err) {
				console.error(`Error reading or parsing file ${filePath}:`, err);
				return null; // Return null if there's an error.
			}
		}).filter(Boolean); // Filter out any null values resulting from errors.

		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;

		const result = {
			total: bookings.length,
			nextPage: endIndex < bookings.length ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			data: bookings.slice(startIndex, endIndex),
		};

		res.json(result);
	});
});

api.listen(port, () => console.log(`Application is running on port ${port}`));
