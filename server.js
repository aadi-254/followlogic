
const express = require('express');
const app = express();
const PORT = 3000;
const mysql = require('mysql2');
const cors = require('cors'); // To allow cross-origin requests

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

//- ---------------- connection ------------------------- - //

// Create a connection to the database
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aditya.254',
    database: 'follow'
});

// Connect to the database once when the server starts
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to the database");
});

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.htm'); // Adjust the path as necessary
});

//- ---------------- sign up ------------------------- - //

// Handle form submission
app.post('/submit', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.name;

    // Define your SQL query to insert a new user
    const insertSql = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;

    // Execute the insert query
    con.query(insertSql, [email, username, password], function (err, insertResult) {
        if (err) {
            console.error("Error inserting data: ", err);
            return res.status(500).send("Error inserting data"); // Send an error response
        }
        console.log('Inserted new user with ID:', insertResult.insertId);
        res.send(`User  ${username} with email ${email} has been registered. Please LOG IN to open account`);
    });
});

// - ------------- log in -------------- - //

// Handle form submission
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
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

        // Check if the provided password matches the stored password
        if (user.password === password) {
            // Successful login

            // Send the account page to the user
            res.sendFile(__dirname + '/public/account.htm');

            // Route to fetch followers and following data
            // Assuming you have the following database structure
            // followers (follower_id, followed_id) -> Mapping of which user follows which other user
            // users (user_id, username, email, password)

            app.get('/users', (req, res) => {
                const userId = user.user_id; // Just an example, you would get the userId from session or JWT

                // Query to get followers
                const followersQuery = `
        SELECT u.username FROM users u
        INNER JOIN followers f ON u.user_id = f.follower_id
        WHERE f.followed_id = ?;
    `;

                // Query to get following
                const followingQuery = `
        SELECT u.username FROM users u
        INNER JOIN followers f ON u.user_id = f.followed_id
        WHERE f.follower_id = ?;
    `;

                // Fetch followers
                con.query(followersQuery, [userId], (err, followersResults) => {
                    if (err) {
                        console.error('Error fetching followers:', err);
                        return res.status(500).json({ error: 'Error fetching followers' });
                    }

                    // Fetch following
                    con.query(followingQuery, [userId], (err, followingResults) => {
                        if (err) {
                            console.error('Error fetching following:', err);
                            return res.status(500).json({ error: 'Error fetching following' });
                        }

                        // Send back both followers and following data
                        // res.json({
                        //     followers: followersResults.map(f => f.username),
                        //     following: followingResults.map(f => f.username)
                        // });


                        // Initialize empty arrays for followers and following(you can also do above mapping)
                        let followers = [];
                        let following = [];

                        // Loop through followersResults and extract the usernames
                        for (let i = 0; i < followersResults.length; i++) {
                            followers.push(followersResults[i].username);
                        }

                        // Loop through followingResults and extract the usernames
                        for (let i = 0; i < followingResults.length; i++) {
                            following.push(followingResults[i].username);
                        }

                        // Send the response with the arrays of followers and following
                        res.json({
                            followers: followers,
                            following: following
                        });

                    });
                });
            });


        } else {
            // Invalid password
            return res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
