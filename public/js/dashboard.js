// dashboard.js

function getTopDelays() {
    fetch(`http://localhost:3001/v1/flights?min_delay_arr=1&access_key=c3e1530a346fbe1ce47204b80d03efca`)
    .then(response => response.json())
    .then(data => {
        const delays = data.data;
        const topDelays = delays
        .sort((a, b) => (b.arrival.delay || 0) - (a.arrival.delay || 0))
        .slice(0, 5);

        console.log('Top 5 Delayed Flights:', topDelays);

        const tableBody = document.querySelector('#majorDelaysTable tbody');
        tableBody.innerHTML = ''; // Clear previous rows

        topDelays.forEach(flight => {
            const row = document.createElement('tr');

            const flightCell = document.createElement('td');
            flightCell.textContent = flight.flight.iata || flight.flight.number || 'N/A';
            row.appendChild(flightCell);

            const originCell = document.createElement('td');
            originCell.textContent = flight.departure.iata || 'N/A';
            row.appendChild(originCell);

            const destinationCell = document.createElement('td');
            destinationCell.textContent = flight.arrival.iata || 'N/A';
            row.appendChild(destinationCell);

            const delayCell = document.createElement('td');
            delayCell.textContent = flight.arrival.delay || 0;
            row.appendChild(delayCell);

            tableBody.appendChild(row);
        });
    })
    .catch(error => console.error('Error fetching data:', error));
}


function getFlightStatusChart() {
    const ctx = document.getElementById('flightStatusChart');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
        labels: [
            'On Time',
            'Delayed',
            'Cancelled',
            'Diverted'
        ],
        datasets: [{
            label: 'My First Dataset',
            data: [300, 50, 100, 25],
            backgroundColor: [
                'rgba(128, 255, 99, 1)',
                'rgba(235, 217, 54, 1)',
                'rgba(255, 86, 86, 1)',
                'rgba(98, 79, 242, 1)'
            ],
            hoverOffset: 4
        }]
        }
    });
}

window.onload = () => {
    getTopDelays(); getFlightStatusChart();
};