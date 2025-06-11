const express = require('express');
const cors = require('cors');
const path = require('path');
const { createUser, getUserData, getAllUserData, updateUserData} = require('./db.js');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// Get
app.get('/scores', async(req, res) => {
    try {
        const userID = req.query.userID;
        let result;
        if (userID) result = await getUserData(userID);
        else result = await getAllUserData();
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})