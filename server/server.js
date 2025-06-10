const express = require('express');
const cors = require('cors');
const path = require('path');
const { createUser, getUserData, updateUserData} = require('./db.js');

const port = 3000;
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// Get
app.get('/scores', async (req, res) => {
    try {
        const userID = req.query.userID;
        const result = await getUserData(userID);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch scores. '});
        console.log('GET error.');
    }
});
// Post
app.post('/scores', async(req, res) => {
    try {
        const result = await createUser(req.body);
        res.status(200).send({ message: 'User created.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to post scores.' });
        console.log('POST error');
    }
})

// Update
app.put('/scores', async(req, res) => {
    try {
        const result = await updateUserData(req.body);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update data.' });
        console.log('POST error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})