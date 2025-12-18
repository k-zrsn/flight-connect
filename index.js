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



// Root routes
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



// Functions 
/// Fetch data from AviationStack API
async function fetchFlights() {
    try {



        const res = await fetch('http://localhost:3001/v1/flights'); // REMEMBER TO CHANGE TO AVIATIONSTACK API

        


        const data = await res.json();

        if (!data || !data.data || !Array.isArray(data.data)) {
            console.error('Invalid API response:', data);
            return [];
        }

        return data.data;
    } catch (err) {
        console.error('Failed to fetch flights:', err);
        return [];
    }
}

/// Cache fetched data to Supabase
async function cacheFlights() {
    const flights = await fetchFlights();
    console.log('Fetched flights:', flights);

    const formattedFlights = flights.map((f, index) => {
    const flight = {
        flight_iata: f.flight?.iata || `UNKNOWN_${index}`,
        flight_number: f.flight?.number || 'N/A',

        departure_airport: f.departure?.iata || 'N/A',
        arrival_airport: f.arrival?.iata || 'N/A',

        departure_airport_full: f.departure?.airport || null,
        arrival_airport_full: f.arrival?.airport || null,
        airline_name: f.airline?.name || null,

        departure_time: f.departure?.scheduled || null,
        arrival_time: f.arrival?.scheduled || null,
        arrival_delay: f.arrival?.delay || 0,
        flight_status: f.flight_status || 'unknown',
    };


    if (f.live?.latitude != null && f.live?.longitude != null) {
        flight.live_latitude = f.live.latitude;
        flight.live_longitude = f.live.longitude;
        flight.live_updated = f.live.updated;
    }

    return flight;
}); 

    // Remove duplicates based on flight_iata
    const uniqueFlights = Array.from(
        new Map(formattedFlights.map(f => [f.flight_iata, f])).values()
    );

    // Upsert and return full rows with IDs
    const { data: upsertedFlights, error } = await supabase
        .from('flights')
        .upsert(uniqueFlights, { onConflict: 'flight_iata', returning: 'representation' });

    if (error) {
        console.error('Error caching flights:', error);
        return [];
    }

    // console.log(`Cached ${upsertedFlights.length} flights`);
    return upsertedFlights;
}

/// Random passenger generator
function generatePassengers(flightId, count = 20) {
    const firstNames = [
        'Virgil', 'Samantha', 'Noah', 'Noel', 'Virginia', 'Kurt', 'Carol', 'Brandon', 'Bethany', 'Ernie', 'Phoebe', 'Lenny', 'Jessica', 'Allen', 'Ginger', 'Dale', 'Molly', 'Trevor', 'Diana', 'Gloria', 'Evan', 'Tina', 'Russell', 'Melanie', 'Curtis', 'Yvonne', 'Leonard', 'Chelsea', 'Derek', 'Suzanne', 'Shawn', 'Cynthia', 'Randall', 'Lori', 'Barry', 'Kristin', 'Alexander', 'Jill', 'Francis', 'Erica', 'Mitchell', 'Becky', 'Calvin', 'Holly', 'Clayton', 'Monica', 'Shane', 'Jasmine', 'Jamie', 'Natalie', 'Phillip', 'Sabrina', 'Marcus', 'Rosemary', 'Dustin', 'Kelsey', 'Trevor', 'Leah', 'Geoffrey', 'Carmen', 'Shaun', 'Casey', 'Darryl', 'Angelica', 'Jared', 'Margaret', 'Anmol'
    ];
    const lastNames = [
        'Smith', 'Johnson', 'Lee', 'Garcia', 'Brown', 'Sanchez', 'Terry', 'Freeman', 'Owens', 'Young', 'Preston', 'Brooks', 'Castillo', 'Carson', 'Dallas', 'Fleming', 'Hodges', 'Nolan', 'Brock', 'Hunt', 'Ramos', 'Maldonado', 'Farmer', 'Huang', 'Nixon', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Rojas', 'Hanson', 'Johnston', 'Stevenson', 'Dean', 'Gilbert', 'Garner', 'Sutton', 'Greene', 'Burke', 'Haynes', 'Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace', 'Woods', 'Coleman', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald'
    ];

    return Array.from({ length: count }).map(() => ({
        first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
        last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
        checked_in: Math.random() > 0.15,
        ticket_reissued: false,
        flight_id: flightId
    }));
}

/// Fill passengers
async function fillPassengersForFlights() {
    const { data: flights, error } = await supabase
        .from('flights')
        .select('id, flight_iata');

    if (error) {
        console.error('Error fetching flights for passengers:', error);
        return;
    }

    if (!flights || flights.length === 0) {
        console.warn('No flights found for passenger generation');
        return;
    }

    for (const flight of flights) {
        if (!flight.id) {
            console.warn('Skipping flight with missing ID:', flight);
            continue;
        }

        const passengers = generatePassengers(flight.id, 30);

        const { error: deleteError } = await supabase
            .from('passengers')
            .delete()
            .eq('flight_id', flight.id);

        if (deleteError) {
            console.error(`Failed to delete passengers for flight ${flight.flight_iata}`, deleteError);
            continue;
        }

        const { error: insertError } = await supabase
            .from('passengers')
            .insert(passengers);

        if (insertError) {
            console.error(`Failed to insert passengers for flight ${flight.flight_iata}`, insertError);
        } else {
            console.log(`Inserted passengers for flight ${flight.flight_iata}`);
        }
    }
}

// Clear all passengers
async function clearPassengers() {
    const { error } = await supabase
        .from('passengers')
        .delete()
        .neq('id', 0);

    if (error) {
        console.error('Failed to clear passengers:', error);
    } else {
        console.log('All passengers deleted');
    }
}



// API endpoints
/// Cache flight schedules to Supabase
app.post('/cache-flights', async (req, res) => {
    try {
        await clearPassengers();
        await cacheFlights();
        await fillPassengersForFlights();

        res.json({ message: 'Flights and passengers cached successfully' });
    } catch (err) {
        console.error('Error in /cache-flights:', err);
        res.status(500).json({ error: 'Failed to cache flights and passengers' });
    }
});

/// Fill passengers for flights
app.post('/fill-passengers', async (req, res) => {
    try {
        await fillPassengersForFlights()
        res.json({ message: 'Passengers created successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to create passengers' })
    }
})

///  Get flight schedules from Supabase
app.get('/flights', async (req, res) => {
    const { data, error } = await supabase
        .from('flights')
        .select();
    //.order('departure_time', { ascending: false })
    //.limit(100); // most recent 100 flights

    if (error) return res.status(400).json({ error });
    res.json({ data });
});

/// Get passengers for a specific flight
app.get('/flights/:id/passengers', async (req, res) => {
    const { id } = req.params

    const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('flight_id', id)

    if (error) return res.status(500).json({ error })
    res.json({ data })
})

// Reissue tickets
app.post('/flights/:flightId/reissue-tickets', async (req, res) => {
    const { flightId } = req.params;

    try {

        const { data: passengers, error } = await supabase
            .from('passengers')
            .select('*')
            .eq('flight_id', flightId)
            .eq('checked_in', false)
            .eq('ticket_reissued', false);

        if (error) throw error;

        if (!passengers.length) {
            return res.json({ message: 'No passengers eligible for reissue' });
        }

        const updates = passengers.map(p => ({
            id: p.id,
            ticket_reissued: true
        }));

        const { error: updateError } = await supabase
            .from('passengers')
            .upsert(updates);

        if (updateError) throw updateError;

        res.json({
            message: `Reissued ${updates.length} tickets`,
            reissued_count: updates.length
        });

    } catch (err) {
        console.error('Reissue error:', err);
        res.status(500).json({ error: 'Failed to reissue tickets' });
    }
});



/* Export app
*/
module.exports = app;



/* Local testing
app.listen(port, () => {
    console.log('App is available on port:', port);
});
*/
