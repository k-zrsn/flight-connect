// dashboard.js

let progressInterval = null;


async function getTopDelays() {
    try {
        const response = await fetch('/flights');
        const result = await response.json();

        const flights = result.data || [];

        const topDelays = flights
            .sort(
                (a, b) =>
                    Number(b.arrival_delay || 0) -
                    Number(a.arrival_delay || 0)
            )
            .slice(0, 5);

        console.log('Top 5 Delayed Flights:', topDelays);

        const tableBody = document.querySelector('#majorDelaysTable tbody');
        tableBody.innerHTML = '';

        topDelays.forEach(flight => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${flight.flight_iata || 'N/A'}</td>
                <td>${flight.departure_airport || 'N/A'}</td>
                <td>${flight.arrival_airport || 'N/A'}</td>
                <td>${Number(flight.arrival_delay || 0)} min</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading top delays:', err);
    }
}


async function getFlightStatusChart() {
    const ctx = document.getElementById('flightStatusChart').getContext('2d');

    try {
        const response = await fetch('/flights');
        const result = await response.json();
        const flights = result.data || [];

        let onTime = 0, delayed = 0, cancelled = 0, diverted = 0;

        flights.forEach(flight => {
            const status = flight.flight_status;
            const delay = Number(flight.arrival_delay || 0);

            if (status === 'cancelled') {
                cancelled++;
            } else if (status === 'diverted') {
                diverted++;
            } else if (delay > 0) {
                delayed++;
            } else {
                onTime++;
            }
        });

        if (window.flightStatusChartInstance) {
            window.flightStatusChartInstance.destroy();
        }

        window.flightStatusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Delayed', 'Cancelled', 'Diverted'],
                datasets: [{
                    label: 'Flight Status Distribution',
                    data: [onTime, delayed, cancelled, diverted],
                    backgroundColor: [
                        'rgba(128, 255, 99, 1)',
                        'rgba(235, 217, 54, 1)',
                        'rgba(255, 86, 86, 1)',
                        'rgba(98, 79, 242, 1)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Flight Status Distribution (Latest Flights)'
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error loading flight status chart:', err);
    }
}


// Refresh data button
document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refreshDataButton');

    if (!refreshButton) return;

    refreshButton.addEventListener('click', async () => {
        refreshButton.disabled = true;

        try {
            showLoading();
            setProgress(0, 'Getting flight data…');
            smoothProgress(70, 975);

            // Hit Aviationstack + Supabase
            await fetch('/cache-flights', { method: 'POST' });

            setProgress(null, 'Refreshing dashboard…');
            smoothProgress(85, 5);

            // Reload dashboard data
            await getTopDelays();
            await getFlightStatusChart();

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
});




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
    overlay.style.display = 'flex';
    setProgress(0, 'Starting refresh…');
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

document.addEventListener('DOMContentLoaded', () => {
    getTopDelays();
    getFlightStatusChart();
});

