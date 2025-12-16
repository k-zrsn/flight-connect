// schedules.js

let allFlights = [];
let map;
let flightMarker = null;

function formatTime(ts) {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString()
}


// Loading screen functions
function setProgress(percent, text) {
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').innerText = text;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}


async function createCache() {
    await fetch('/cache-flights', { method: 'POST' });
}

async function loadSchedules() {
    try {
        const response = await fetch('/flights');
        const result = await response.json();

        allFlights = result.data || [];
        renderFlights(allFlights);

    } catch (err) {
        console.error('Failed to load schedules:', err);
    }
}

function getDelayClass(delay) {
    const d = Number(delay) || 0;
    if (d === 0) return 'delay-ontime';
    if (d < 15) return 'delay-minor';
    if (d < 60) return 'delay-moderate';
    return 'delay-severe';
}

function renderFlights(flights) {
    const tableBody = document.querySelector('#timeTable tbody');
    tableBody.innerHTML = '';

    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';

        row.addEventListener('click', () => {
            document
                .querySelectorAll('#timeTable tr')
                .forEach(r => r.classList.remove('active-flight'));

            row.classList.add('active-flight');
            loadPassengers(flight.id);
            showFlightOnMap(flight);
        });

        row.innerHTML = `
            <td>${flight.flight_iata || 'N/A'}</td>
            <td>${flight.departure_airport || 'N/A'}</td>
            <td>${flight.arrival_airport || 'N/A'}</td>
            <td>${formatTime(flight.departure_time)}</td>
            <td>${formatTime(flight.arrival_time)}</td>
            <td class="${getDelayClass(flight.arrival_delay)}">
                ${flight.arrival_delay || 0} min
            </td>
            <td>${flight.flight_status || 'unknown'}</td>
        `;

        tableBody.appendChild(row);
    });
}

async function loadPassengers(flightId) {
    try {
        const response = await fetch(`/flights/${flightId}/passengers`)
        const result = await response.json()
        const passengers = result.data

        const container = document.getElementById('passengersContainer')
        container.innerHTML = ''

        if (passengers.length === 0) {
            container.innerHTML = '<p>No passengers for this flight.</p>'
            return
        }

        const table = document.createElement('table')
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Checked In</th>
                </tr>
            </thead>
            <tbody></tbody>
        `

        const tbody = table.querySelector('tbody')

        passengers.forEach(p => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${p.first_name} ${p.last_name}</td>
                <td>${p.checked_in ? 'Yes' : 'No'}</td>
            `
            tbody.appendChild(row)
        })

        container.appendChild(table)

    } catch (err) {
        console.error('Failed to load passengers:', err)
    }
}

function initializeMap() {
    map = L.map('flightMap').setView([20, 0], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    console.log('Map initialized', map);
}

function showFlightOnMap(flight) {

    // todo: add location estimation if no live data

    if (!flight.live_latitude || !flight.live_longitude) {
        console.warn('No live data for flight', flight.flight_iata);
        return;
    }

    const lat = flight.live_latitude;
    const lon = flight.live_longitude;

    if (flightMarker) {
        map.removeLayer(flightMarker);
    }

    flightMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`
            <b>${flight.flight_iata}</b><br>
            Status: ${flight.flight_status}<br>
            LIVE DATA
        `)
        .openPopup();

    map.setView([lat, lon], 6);
    console.log('map:', map);
    console.log('lat/lon:', flight.live_latitude, flight.live_longitude);

}


// Event listeners
document.addEventListener('DOMContentLoaded', () => {

    const flightSearch = document.getElementById('flightSearch');
    if (flightSearch) {
        flightSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();

            const filteredFlights = allFlights.filter(f =>
                f.flight_iata?.toLowerCase().includes(term) ||
                f.departure_airport?.toLowerCase().includes(term) ||
                f.arrival_airport?.toLowerCase().includes(term)
            );

            renderFlights(filteredFlights);
        });
    }

    const sortDelayButton = document.getElementById('sortDelay');
    if (sortDelayButton) {
        sortDelayButton.addEventListener('click', () => {
            const sorted = [...allFlights].sort(
                (a, b) => Number(b.arrival_delay || 0) - Number(a.arrival_delay || 0)
            );

            renderFlights(sorted);
        });
    }

    const refreshButton = document.getElementById('refreshDataButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            try {
            setProgress(10, 'Refreshing flight data…');

            // Update cache (Aviationstack + Supabase)
            await fetch('/cache-flights', { method: 'POST' });

            setProgress(60, 'Reloading schedules…');

            await loadSchedules();

            setProgress(100, 'Done');
            setTimeout(hideLoading, 300);
        } catch (err) {
            console.error('Refresh failed:', err);
            setProgress(100, 'Refresh failed');
        }
    });
}});





//Page load
window.onload = async () => {
    try {
        setProgress(10, 'Initializing map…');
        initializeMap();

        setProgress(30, 'Loading flight data…');
        await loadSchedules(); 

        setProgress(60, 'Updating flight cache…');
        await fetch('/cache-flights', { method: 'POST' });

        setProgress(80, 'Reloading updated data…');
        await loadSchedules(); 

        setProgress(100, 'Done');
        setTimeout(hideLoading, 300);

    } catch (err) {
        console.error(err);
        setProgress(100, 'Failed to load data');
    }
};

