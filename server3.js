// const mysql = require('mysql2');

// let con = mysql.createConnection({
//     host: '127.0.0.1',
//     user: 'root',
//     password: 'Aditya.254',
//     database: 'follow'
// });

// con.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected to the database");
//     //there is in databse there is two table, student and course where i am choosing student

//     // Define your SQL query here
//     const sql = 'SELECT * FROM followers WHERE follower_id=2'; // Replace with your actual table name

//     con.query(sql, function(err, result) {
//         if (err) { 
//             console.error("There is an error: ", err);
//             return;
//         }

//     // data come in json formate...[{ data1 },{ data2 },...]
//         console.log(result[0]); //this line print first data;
        
//         for(let i=0;i<result.length;i++){
//             console.log("Result: ", result[i].followed_id);
//         }
//     });

//     // End the connection
//     con.end();
// });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // To allow cross-origin requests

const app = express();
const PORT = 4000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Create a MySQL connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Aditya.254',
    database: 'follow'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database');
});

// Route to fetch data
app.get('/users', (req, res) => {
    const sql = 'SELECT username FROM users WHERE user_id INTO (SELECT followe_id FROM followers WHERE follower_id=2)'; // Adjust the query as needed
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching data');
        }
        res.json(results); // Send the results as JSON
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
