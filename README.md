# Guiando API

Guiando API is a simple Express-based API that serves booking data from JSON files stored in a directory. It is designed to be lightweight and easy to deploy, with basic functionality to retrieve booking information.

## Features

-   **Retrieve Booking List:** Fetch a paginated list of bookings.
-   **Retrieve Single Booking:** Fetch details of a single booking by its ID.
-   **Data Cleaning:** Utility function for cleaning and formatting JSON data (optional feature).

## Requirements

-   Node.js
-   npm (Node Package Manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/gabydevdev/guiando_api.git
```

2. Navigate to the project directory:

```bash
cd guiando_api
```

3. Install the dependencies:

```bash
npm install
```

## Configuration

The API uses environment variables for configuration. Create a .env file in the root directory and add the following variables:

```plaintext
PORT=3000
BASE_URL_PATH=/your-base-url-path
```

-   `PORT`: The port on which the server will run (default is 3000).
-   `BASE_URL_PATH`: Base URL path for the API (optional).

## Usage

To start the API, use the following command:

```bash
npm start
```

The API will be available at http://localhost:3000 (or the port specified in your .env file).

## Endpoints

### GET /api/bookings

Retrieve a paginated list of bookings.

**Query Parameters:**

-   `page`: Page number (default is 1).
-   `limit`: Number of bookings per page (default is 12).

**Example Request:**

```bash
curl http://localhost:3000/api/bookings?page=1&limit=10
```

**Response:**

-   `200 OK`: JSON object containing the list of bookings.
-   `500 Internal Server Error`: If there is an error reading the booking data.

### GET /api/booking/single

Retrieve details of a single booking by its bookingId.

**Query Parameters:**

-   `bookingId`: The ID of the booking to retrieve (required).

**Example Request:**

```bash
curl http://localhost:3000/api/booking/single?bookingId=1234
```

**Response:**

-   `200 OK`: JSON object containing the booking details.
-   `400 Bad Request`: If `bookingId` is not provided.
-   `404 Not Found`: If the booking with the specified bookingId is not found.
-   `500 Internal Server Error`: If there is an error reading the booking data.

## Utilities

### Data Cleaner

The `utils/dataCleaner.js` script contains a `cleanData` function that can be used to clean and format JSON strings, particularly for converting Python-style booleans and handling special characters.

## License

This project is licensed under the ISC License. See the LICENSE file for more details.

## How to Use

1. **Installation Instructions:** Follow the steps under "Installation" to set up the project.
2. **Configuration:** Adjust the `.env` file according to your environment.
3. **Run the Project:** Start the server using `npm start`.
4. **Explore the API:** Use the provided endpoints to interact with the booking data.
