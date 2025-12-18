// schedules.js

let allFlights = [];
let map;
let flightMarker = null;
let sortByDelay = false;
let selectedFlightId = null;
let progressInterval = null;



function scrollToHelp() {
    const element = document.getElementById('helpContainer');
    element.scrollIntoView();
}

function formatTime(ts) {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString()
}


// Loading screen functions
function setProgress(percent, text) {
    if (percent !== null) {
        document.getElementById('progressFill').style.width = `${percent}%`;
        // document.getElementById('planeIcon').style.left = `${percent}%`;
    }

    if (text) {
        document.getElementById('progressText').innerText = text;
    }
}


function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('loading-exit');
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('loading-exit');
    }, 350);
}


function showLoading() {
    const overlay = document.getElementById('loadingOverlay');

    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    const fill = document.getElementById('progressFill');
    fill.style.width = '0%';

    overlay.style.display = 'flex';
    setProgress(0, 'Starting…');
}


function smoothProgress(target, speed = 40) {
    const fill = document.getElementById('progressFill');
    //const plane = document.getElementById('planeIcon');

    let current = parseFloat(fill.style.width) || 0;
    if (current >= target) return;

    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    //plane.classList.add('plane-moving');

    const step = 0.15;

    progressInterval = setInterval(() => {
        const diff = target - current;
        current += Math.max(diff * 0.08, step);

        if (current >= target) {
            current = target;
            clearInterval(progressInterval);
            progressInterval = null;

            //plane.classList.remove('plane-moving');
        }

        fill.style.width = current.toFixed(1) + '%';

        const clamped = Math.min(current, 98);
        //plane.style.left = clamped + '%';

    }, speed);
}




// Cache and schedule creation functions
/*
async function createCache() {
    await fetch('/cache-flights', { method: 'POST' });
}
*/

async function loadSchedules() {
    try {
        const response = await fetch('/flights');
        const result = await response.json();

        allFlights = result.data || [];
        applyFiltersAndSort();

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


// Map and table rendering functions
function renderFlights(flights) {
    const tableBody = document.querySelector('#timeTable tbody');
    tableBody.innerHTML = '';

    flights.forEach(flight => {
        const hasLiveData =
            flight.live_latitude !== null &&
            flight.live_longitude !== null;


        const row = document.createElement('tr');
        row.style.cursor = 'pointer';


        if (hasLiveData) {
            row.classList.add('live-flight');
        }

        row.addEventListener('click', () => {
            document
                .querySelectorAll('#timeTable tr')
                .forEach(r => r.classList.remove('active-flight'));

            selectedFlightId = flight.id;

            row.classList.add('active-flight');
            loadPassengers(flight.id);
            showFlightOnMap(flight);
        });

        row.innerHTML = `
            <td>
                <span class="tooltip" data-tooltip="${flight.airline_name || 'Unknown airline'}">
                    ${flight.flight_iata || 'N/A'}
                </span>
                ${
                    hasLiveData
                        ? '<span class="live-badge">LIVE</span>'
                        : ''
                }
            </td>

            <td>
                <span class="tooltip" data-tooltip="${flight.departure_airport_full || flight.departure_airport}">
                    ${flight.departure_airport || 'N/A'}
                </span>
            </td>

            <td>
                <span class="tooltip" data-tooltip="${flight.arrival_airport_full || flight.arrival_airport}">
                    ${flight.arrival_airport || 'N/A'}
                </span>
            </td>

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
                    <th>Ticket Status</th>
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
                <td>
                    ${p.ticket_reissued
                        ? '<span class="badge reissued">Reissued</span>'
                        : '—'}
                </td>
            `
            tbody.appendChild(row)
        })

        container.appendChild(table)

    } catch (err) {
        console.error('Failed to load passengers:', err)
    }
}

function initializeMap() {
    map = L.map('flightMap').setView([20, 0], 1);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    console.log('Map initialized', map);
}

function showFlightOnMap(flight) {
    if (
        flight.live_latitude === null ||
        flight.live_longitude === null
    ) {
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

function applyFiltersAndSort() {
    const term = document.getElementById('flightSearch')?.value.toLowerCase() || '';
    const liveOnly = document.getElementById('liveOnlyToggle')?.checked;

    let result = [...allFlights];

    if (term) {
        result = result.filter(f =>
            f.flight_iata?.toLowerCase().includes(term) ||
            f.departure_airport?.toLowerCase().includes(term) ||
            f.arrival_airport?.toLowerCase().includes(term)
        );
    }

    if (liveOnly) {
        result = result.filter(f =>
            f.live_latitude !== null &&
            f.live_longitude !== null
        );
    }

    if (sortByDelay) {
        result.sort(
            (a, b) => Number(b.arrival_delay || 0) - Number(a.arrival_delay || 0)
        );
    }

    renderFlights(result);
}



// Event listeners
document.addEventListener('DOMContentLoaded', async () => {

    // Show loading
    showLoading();
    setProgress(0, 'Initializing map…');

    try {
        initializeMap();
        smoothProgress(40, 300);

        setProgress(null, 'Loading flight data…');
        await loadSchedules();
        smoothProgress(85, 300);

        smoothProgress(100, 20);
        setTimeout(hideLoading, 350);

    } catch (err) {
        console.error(err);
        setProgress(100, 'Failed to load');
        setTimeout(hideLoading, 600);
    }

    // Search input
    const flightSearch = document.getElementById('flightSearch');
    if (flightSearch) {
        flightSearch.addEventListener('input', applyFiltersAndSort);
    }

    // Sort by delay button
    const sortDelayButton = document.getElementById('sortDelay');
    if (sortDelayButton) {
        sortDelayButton.addEventListener('click', () => {
            sortByDelay = !sortByDelay;

            sortDelayButton.textContent = sortByDelay
                ? 'Sort by Delay *'
                : 'Sort by Delay';

            applyFiltersAndSort();
        });

    }

    // Refresh data button
    const refreshButton = document.getElementById('refreshDataButton');

    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            refreshButton.disabled = true;

            try {
                showLoading();
                setProgress(0, 'Getting flight data…');
                smoothProgress(70, 975);

                // Hit Aviationstack + Supabase
                await fetch('/cache-flights', { method: 'POST' });


                setProgress(null, 'Reloading schedules…');
                smoothProgress(80, 5);

                // Reload from Supabase
                await loadSchedules();


            setProgress(null, 'Finalizing…');
            smoothProgress(95, 5);

            setTimeout(() => {
                setProgress(100, 'Done!');
                hideLoading();
            }, 600);

                } catch (err) {
                    console.error('Refresh failed:', err);
                    setProgress(100, 'Refresh failed');
                    setTimeout(hideLoading, 700);

                } finally {
                    refreshButton.disabled = false;
                }
            });
}


    // Live flights only toggle
    const liveOnlyToggle = document.getElementById('liveOnlyToggle');

    if (liveOnlyToggle) {
        liveOnlyToggle.addEventListener('change', applyFiltersAndSort);
    }
});

document.getElementById('reissueTickets')
    .addEventListener('click', async () => {

    if (!selectedFlightId) {
        alert('Select a flight first');
        return;
    }

    if (!confirm('Reissue tickets for all unchecked passengers?')) return;

    const response = await fetch(
        `/flights/${selectedFlightId}/reissue-tickets`,
        { method: 'POST' }
    );

    const result = await response.json();

    alert(result.message || result.error || 'Unknown error');

    // Reload passengers to show updated status
    loadPassengers(selectedFlightId);
});
