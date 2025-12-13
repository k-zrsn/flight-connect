// index.js

require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));



// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);



// Get flight data from Supabase
app.get('/flights', async(req, res) => {
    console.log('Received GET request for /flights');

    const {data, error} = await supabase.from('flights').select();

    if (error) {
        console.log('Error fetching flight data:', error);
        res.status(500);
        res.send(error);
    } else {
        res.send(data);
    }
});

app.post('/flights', (req, res) => {
    console.log('Received flight data:', req.body);
    res.send(req.body);
});



// Start the server
app.listen(port, () => {
    console.log('App is available on port: ', port);
});