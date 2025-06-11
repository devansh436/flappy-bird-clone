const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI;
let client, db, collection;
async function connectDB() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('flappy_bird');
        collection = db.collection('user_data');
        console.log('Connected to database.'); 
    }
}
async function closeConnection() {
    if (client) {
        await client.close();
        console.log('Connection closed.');
    }
}
// Read all records
async function getAllUserData() {
    let result;
    try {
        await connectDB();
        result = await collection.find({}).toArray();
        return result;
    } catch (err) {
        console.log(err);
        return [];
    }
}
// Read a particular record
async function getUserData(userID) {
    let result;
    try {
        await connectDB();
        result = await collection.find({ user_id : userID }).toArray();
        return result;
    } catch (err) {
        console.log(err);
        return [];
    }
}

// Create record
async function createUser(user) {
    let result;
    try {
        await connectDB();
        result = await collection.insertOne({
            user_id:  user.userID, 
            password: user.password,
            avg_score: 0,
            total_flap_count: 0,
            total_games_played: 0,
            highest_score: 0, 
            longest_session: 0,
            total_time_played: 0,
            total_score: 0,
        });
        return result;
    } catch(err) {
        console.log(err);
    }
}

// Update record    
async function updateUserData(user) {
    let result;
    try {
        await connectDB();
        console.log(user);
        const userRecord = await collection.findOne({ user_id: user.userID });

        const prevHighScore = userRecord.highest_score;
        const prevSessionLength = userRecord.longest_session;
        const totalGamesPlayed = userRecord.total_games_played + 1;
        const newHighScore = Math.max(prevHighScore, user.score);
        const newTotalScore = userRecord.total_score + user.score;
        const newAvgScore = Math.round((newTotalScore / totalGamesPlayed) * 100) / 100; 
        const newFlapCount = userRecord.total_flap_count + user.flapCount;
        const _longestSession = Math.max(prevSessionLength, user.sessionLength);
        const totalTimePlayed =  userRecord.total_time_played + user.timePlayed; 

        result = await collection.updateOne({ user_id: user.userID }, { $set: { 
            avg_score: newAvgScore,
            total_flap_count: newFlapCount,
            total_games_played: totalGamesPlayed,
            highest_score: newHighScore, 
            longest_session: _longestSession,
            total_time_played: totalTimePlayed,
            total_score: newTotalScore
        }});
        return result;
    } catch (err) {
        console.log(err);
    }
    return [];
}

module.exports = {
    createUser, getUserData, getAllUserData, updateUserData
};
