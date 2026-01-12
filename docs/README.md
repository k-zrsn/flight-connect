
# FlightConnect

**For setup, architecture, API documentation, and development notes, see the
[Developer Manual](#developer-manual)**.

## Description
FlightConnect is a web-based flight operations dashboard designed to assist airline staff in managing flight schedules, delays, and passenger status efficiently. The application pulls flight data from an external aviation API, caches it in a backend database, and presents the information through an interactive, easy to read interface.

The system enables staff to quickly identify delayed flights, manage passengers, determine check-in status, and perform operational actions such as ticket reissuance. When available, real-time aircraft position data is displayed on an interactive map.


## Target Browsers and Platforms
FlightConnect is optimized for modern web browsers and desktop use.

**Supported browsers:**
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

**Mobile support:**
- Safari (iOS)
- Chrome (Android)

> **Note:** While the application is accessible on mobile devices, the interface is primarily designed for desktops used in airline operational settings.

--- 

# Developer Manual

## Audience
This is intended for future developers who will maintain or extend the FlightConnect system. For this application, developers should have general knowledge of web applications, JavaScript, REST APIs, and relational databases, but no prior familiarity with this project’s architecture or design decisions.

## System Design
FlightConnect follows a standard client–server architecture:

- **Frontend**
  - HTML, CSS, JavaScript
  - Leaflet for live flight map visualization
  - ChartJS for status chart
  - Dynamic tables and filtering

- **Backend**
  - Node.js with Express
  - RESTful API endpoints

- **Database**
  - Supabase (PostgreSQL)
  - Stores flight data and passenger records

- **External Services**
  - AviationStack API for flight and live tracking data

Flight data is periodically fetched from the external API, normalized, and cached in Supabase to minimize API usage and improve performance.


## Installation and Setup
### Prerequisites
- Node.js (v18 or higher)
- npm (bundled with Node.js)
- Supabase account
- AviationStack API key

### Installation Steps
1. Clone the project repository:
   ```
   git clone https://github.com/paduav/flight-connect
    ```

2. Install dependencies:
    ```
    npm install
    ```

3. Create .env file in project root:
    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_service_key
    AVIATIONSTACK_KEY=your_aviationstack_key
    AVIATIONSTACK_URL=your_aviationstack_url
    ```

### Running the application on a server
Local Development
```    
npm start
```

The app will be available at:
``` 
http://localhost:3000 
```

### Testing
Currently, automated tests have not been implemented. Manual testing was performed through:

- UI interaction

- API endpoint validation using browser DevTools and Insomnia

- Supabase table verification


## API Documentation
### POST /cache-flights
Fetches flight data from the external aviation API, normalizes the data, caches it in Supabase, and generates associated passenger records.
#### Purpose
- Refresh flight and passenger data
- Reset live tracking information

### GET /flights
Returns all cached flight records from Supabase
#### Example entry response 
```
  {
    flight_date: '2025-12-17',
    flight_status: 'scheduled',
    departure: {
      airport: 'Suvarnabhumi International',
      timezone: 'Asia/Bangkok',
      iata: 'BKK',
      icao: 'VTBS',
      terminal: null,
      gate: 'E3',
      delay: 58,
      scheduled: '2025-12-17T02:15:00+00:00',
      estimated: '2025-12-17T02:15:00+00:00',
      actual: '2025-12-17T03:13:00+00:00',
      estimated_runway: '2025-12-17T03:13:00+00:00',
      actual_runway: '2025-12-17T03:13:00+00:00'
    },
    arrival: {
      airport: 'Taiwan Taoyuan International (Chiang Kai Shek International)',
      timezone: 'Asia/Taipei',
      iata: 'TPE',
      icao: 'RCTP',
      terminal: '2',
      gate: 'D8',
      baggage: '8',
      scheduled: '2025-12-17T06:50:00+00:00',
      delay: 20,
      estimated: '2025-12-17T07:10:00+00:00',
      actual: null,
      estimated_runway: null,
      actual_runway: null
    },
    airline: { name: 'Turkish Airlines', iata: 'TK', icao: 'THY' },
    flight: {
      number: '9410',
      iata: 'TK9410',
      icao: 'THY9410',
      codeshared: [Object]
    },
    aircraft: { registration: null, iata: null, icao: null, icao24: '8990E7' },
    live: null
  },

```

### POST /fill-passengers
Fills random generated passengers from generatePassengers function into each flight record.

### GET /flights/:id/passengers
Returns all passengers associated with a specific flight.
#### Parameters
id = Flight ID

### POST /flights/:flightId/reissue-tickets
Reissues tickets for all passengers not checked-in for a given flight.
#### Response
```
{
  "message": "Reissued X tickets",
  "reissued_count": X
}
```


## Bugs and Limitations
- Current api fetch does not include enough data for status chart.
- Live flight data availability depends on the external aviation API (Basic tier limited).
- Passenger data is currently generated using mock data.
- Error handling for external API failures can be expanded.


## Development Roadmap
Planned improvements include:
- Add tooltips for major delays table
- Add plane type
- Converting larger delays from minutes into hours and minutes for major delays table
- Mobile support/responsiveness
- Full support for live tracking and enhanced visualization
- Improved logging and monitoring
- Staff roles
- Real passenger data integration
- Automated testing
