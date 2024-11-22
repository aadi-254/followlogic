const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 4000;

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: false }));

// Create a connection to the database
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aditya.254',
    database: 'follow'
});

// Connect to the database once when the server starts
con.connect(err => {
    if (err) throw err;
    console.log("Connected to the database");
});

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.htm'); // Adjust the path as necessary
});


// - -------------    log in    -------------- - //
// Handle form submission
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and username are required' });
    }

    // Define your SQL query to fetch the user
    const selectSql = `SELECT * FROM users WHERE email=?`;

    // Execute the select query
    con.query(selectSql, [email], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Check if the provided username matches the stored username
        if (user.password === password) {
            // Successful login
            return res.status(200).json({ message: 'Login successful' });
        } else {
            // Invalid username
            return res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});