// index.js

require('dotenv').config();
const express = require('express');
const path = require("path");
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');



// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));



// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);



// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/schedules', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'schedules.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});



// API routes


app.get('/flights', async (req, res) => {
    const { data, error } = await supabase
        .from('flights')
        .select();
        //.order('departure_time', { ascending: false })
        //.limit(100); // most recent 100 flights

    if (error) return res.status(400).json({ error });
    res.json({ data });
});




// Fetch data from AviationStack API
async function fetchFlights() {
    const res = await fetch(''); // REMEMBER TO CHANGE FETCH URL

    const data = await res.json();
    return data.data;
}

async function cacheFlights() {
    const flights = await fetchFlights();
    console.log('Fetched Flights:', flights);

    const formattedFlights = flights.map(f => ({
        flight_iata: f.flight.iata,
        flight_number: f.flight.number,
        departure_airport: f.departure.iata,
        arrival_airport: f.arrival.iata,
        departure_time: f.departure.scheduled,
        arrival_time: f.arrival.scheduled,
        arrival_delay: f.arrival.delay,
        flight_status: f.flight_status
    }));

    const { data, error } = await supabase
        .from('flights')
        .upsert(formattedFlights, { onConflict: 'flight_iata' });

    if (error) console.error('Error caching flights:', error);
    else console.log('Flights cached successfully');
}



// Write endpoitnt to trigger caching
app.post('/cache-flights', async (req, res) => {
    try {
        await cacheFlights()
        res.json({ message: 'Flights cached successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to cache flights' })
    }
})















/* Export app
*/
module.exports = app;


/* Local testing
app.listen(port, () => {
    console.log('App is available on port:', port);
});
*/
