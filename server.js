const http = require("http");
const express = require('express');
const app = express();
const server = http.createServer(app);  // Use the server for Socket.IO
const io = require('socket.io')(server);  // Initialize socket.io with the server
const PORT = 3000;
const mysql = require('mysql2');
const cors = require('cors');

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

            app.get('/users', (req, res) => { //request sended at http://localhost:3000/users
                const userId = user.user_id;

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
                            username: user.username,
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


//-----------searching process

// Route to serve the OtherAccount page after search
app.get('/otheraccount', (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).send('No username provided');
    }
    res.sendFile(__dirname + '/public/OtherAccount.htm'); // User profile page
});

// Handle search form submission (search for a username)
app.post('/search', (req, res) => {
    const username = req.body.search;

    // Validate input
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Define SQL query to fetch the user by username
    const searchSql = `SELECT * FROM users WHERE username=?`;

    con.query(searchSql, [username], (err, results) => {
        if (err) {
            console.error("Error executing search query: ", err);
            return res.status(500).send("Error executing search query");
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Redirect to the 'OtherAccount' page with the username
        res.redirect('/otheraccount?username=' + username);
    });
});

// Socket.io setup for real-time communication
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for 'requestUserData' event from client
    socket.on('requestUserData', (username) => {
        // Fetch user data from the database
        const userIdQuery = `SELECT user_id, username FROM users WHERE username=?`;
        
        con.query(userIdQuery, [username], (err, results) => {
            if (err) {
                socket.emit('error', 'Error fetching user data');
                return;
            }

            if (results.length === 0) {
                socket.emit('error', 'User not found');
                return;
            }

            const user = results[0];

            // Fetch followers and following data for this user
            const followersQuery = `
                SELECT u.username FROM users u
                INNER JOIN followers f ON u.user_id = f.follower_id
                WHERE f.followed_id = ?;
            `;
            const followingQuery = `
                SELECT u.username FROM users u
                INNER JOIN followers f ON u.user_id = f.followed_id
                WHERE f.follower_id = ?;
            `;
            con.query(followersQuery, [user.user_id], (err, followersResults) => {
                if (err) {
                    socket.emit('error', 'Error fetching followers');
                    return;
                }

                con.query(followingQuery, [user.user_id], (err, followingResults) => {
                    if (err) {
                        socket.emit('error', 'Error fetching following');
                        return;
                    }

                    // Send the data back to the client via socket
                    socket.emit('userData', {
                        username: user.username,
                        followers: followersResults.map(f => f.username),
                        following: followingResults.map(f => f.username)
                    });
                });
            });
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


