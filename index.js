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
app.use(express.static(__dirname + '/public'));


// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);


// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});


// API routes
app.get('/flights', async (req, res) => {
    const { data, error } = await supabase.from('flights').select();

    if (error) {
        return res.status(500).json(error);
    }
    res.json(data);
});

app.post('/flights', (req, res) => {
    res.json(req.body);
});



/* Export app
*/
module.exports = app;


/* Local testing
app.listen(port, () => {
    console.log('App is available on port:', port);
});
*/
