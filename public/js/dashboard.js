// dashboard.js



// REMEMBER TO CHANGE FETCH URLs



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



window.onload = () => {
    getTopDelays(); getFlightStatusChart();
};