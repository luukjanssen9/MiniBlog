const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const dbFileName = 'database.db';

async function initializeDB() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashedGoogleId TEXT,
            avatar_url TEXT,
            memberSince DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            username TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            likes INTEGER NOT NULL
        );
    `);

    // Check if there are any users in the database
    const existingUsers = await db.all('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
        // Sample data - Replace these arrays with your own data
        const users = [
            { username: 'user1', hashedGoogleId: 'hashedGoogleId1', avatar_url: '/images/u1.png', memberSince: '2024-01-01 12:00:00' },
            { username: 'user2', hashedGoogleId: 'hashedGoogleId2', avatar_url: '/images/u1.png', memberSince: '2024-01-02 12:00:00' }
        ];

        const posts = [
            { title: 'Game 1', content: 'This is the first game review', username: 'user1', timestamp: '2024-01-01 12:30:00', likes: 0 },
            { title: 'Game 2', content: 'This is the second game review', username: 'user2', timestamp: '2024-01-02 12:30:00', likes: 0 }
        ];

        // Insert sample data into the database
        await Promise.all(users.map(user => {
            return db.run(
                'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
                [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince]
            );
        }));

        await Promise.all(posts.map(post => {
            return db.run(
                'INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)',
                [post.title, post.content, post.username, post.timestamp, post.likes]
            );
        }));

        console.log('Database populated with initial data.');
    } else {
        console.log('Database already has initial data, skipping population.');
    }

    return db; // Add this line to return the db connection
}

module.exports = { initializeDB }; // Export the initializeDB function
