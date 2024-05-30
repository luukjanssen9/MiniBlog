const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const { initializeDB } = require('./populatedb');
const crypto = require('crypto');

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');
dotenv.config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

// Configure passport
passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`
}, (token, tokenSecret, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', 'views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: CLIENT_SECRET,              // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    res.locals.appName = 'MicroBlog';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    res.locals.user = req.session.user || {};
    res.set('Cache-Control', 'no-store');
    next();
});

app.use(express.static('public'));                 // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
app.get('/', async (req, res) => {
    const sort = req.query.sort || 'recent';
    const allPosts = await getPosts(sort);
    const user = req.session.user;

    res.render('home', { posts: allPosts, user, sort });
});

// register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    // res.render('loginRegister', { regError: req.query.error });
    res.redirect('/auth/google');
});

// redirect to Google's OAuth 2.0 server
app.get('/auth/google', (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
    res.redirect(url);
});

// handle OAuth server response
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);

    // get user identifier from token
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
    });
    const { sub: googleId } = ticket.getPayload();

    // hash id
    const hashedGoogleId = crypto.createHash('sha256').update(googleId).digest('hex');
    // check if the user exists in db
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM users WHERE hashedgoogleid = ?', [hashedGoogleId]);
    
    // User exists, set session variables and redirect to home 
    if (user) {
        req.session.userId = user.id;
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect('/');
    } else {
        res.redirect('/registerUsername');
    }

    await db.close();
});

app.get('/registerUsername', (req, res) => {
    res.render('registerUsername');
});

app.post('/registerUsername', async (req, res) => {
    const { username } = req.body;

    // check if username exists
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    // if username exists, re-render the form with an error message
    if (user) {
        res.render('registerUsername', { error: 'Username already exists' });
    } else {
        // else create a new user entry
        const { lastID } = await db.run('INSERT INTO users (username) VALUES (?)', [username]);

        // update session
        req.session.userId = lastID;
        req.session.loggedIn = true;

        // redirect to home
        res.redirect('/');
    }

    await db.close();
});

// login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginWithGoogle', { 
        loginError: req.query.error,
    });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.get('/post/:id', async (req, res) => {
    // Find the post by ID
    const post = await findPostById(req.params.id);
    // If the post was not found, render the error page
    if (!post) {
        res.render('error', { message: 'Post not found' });
        return;
    }

    // Render the post detail page with the post
    res.render('partials/post', { post });
});

//  make a post
app.post('/posts', async (req, res) => {
    await addPost(req.body.title, req.body.content, req.session.user.username);
    res.redirect('/');
});

//  like a post
app.post('/like/:id', async (req, res) => {
    await updatePostLikes(req, res);
});

app.get('/profile', isAuthenticated, async (req, res) => {
    await renderProfile(req, res);
});

app.get('/avatar/:username', (req, res) => {
    const avatarURL = path.join(__dirname, 'public', 'images', `${req.params.username}.png`);
    if (fs.existsSync(avatarURL)) {
        res.sendFile(avatarURL);
    } else {
        res.status(404).send('Avatar not found');
    }
});

app.post('/register', async (req, res) => {
    await registerUser(req, res);
});

app.post('/login', async (req, res) => {
    await loginUser(req, res);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/googleLogout');
    });
});

app.get('/googleLogout', (req, res) => {
    res.render('googleLogout');
});

app.delete('/delete/:id', isAuthenticated, async (req, res) => {
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const result = await db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
    await db.close();

    if (result.changes === 0) {
        res.status(400).end();
    } else {
        res.status(200).end();
    }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize the database:', err);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// Function to find a user by username
async function findUserByUsername(username) {
    // open database
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    // find user by username
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    await db.close();
    return user;
}

// Function to add a new user
async function addUser(username) {
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });

    const avatar = generateAvatar(username[0]);
    const avatarPath = path.join(__dirname, 'public', 'images', `${username}.png`);
    const avatarUrl = `/images/${username}.png`;
    const memberSince = new Date().toISOString();

    // Save the avatar to the file system
    await fs.promises.writeFile(avatarPath, avatar);

    // Insert the new user into the database
    await db.run(
        'INSERT INTO users (username, avatar_url, memberSince) VALUES (?, ?, ?)',
        [username, avatarUrl, memberSince]
    );

    await db.close();
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
async function registerUser(req, res) {
    const username = req.body.username;

    try {
        const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });

        const userExists = await db.get('SELECT 1 FROM users WHERE username = ?', [username]);

        if (userExists) {
            res.redirect('/register?error=Username+already+exists');
        } else {
            await addUser(username);
            res.redirect('/login');
        }

        await db.close();
    } catch (error) {
        console.error('Error registering user:', error);
        res.redirect('/register?error=An+error+occurred');
    }
}

// Function to login a user
async function loginUser(req, res) {
    const username = req.body.username;
    const user = await findUserByUsername(username);

    if (user) {
        req.session.userId = user.id;
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect('/');
    } else {
        res.redirect('/login?error=Invalid+username+or+password');
    }
}

// Function to render the profile page
async function renderProfile(req, res) {
    const user = req.session.user;
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const userPosts = await db.all(`
        SELECT posts.*, users.avatar_url 
        FROM posts 
        JOIN users ON posts.username = users.username 
        WHERE posts.username = ?
    `, [user.username]);
    await db.close();
    res.render('profile', { user, posts: userPosts });
}


// Function to update post likes
async function updatePostLikes(req, res) {
    const postId = parseInt(req.params.id);
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);

    if (req.session.loggedIn) {
        const likes = post.likes + 1;
        await db.run('UPDATE posts SET likes = ? WHERE id = ?', [likes, postId]);
        res.json({ success: true, likes });
    } else {
        res.json({ success: false, message: 'Not logged in' });
    }

    await db.close();
}

// Function to get all posts, sorted by latest first
async function getPosts(sort) {
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    let query = `
        SELECT posts.*, users.avatar_url 
        FROM posts 
        JOIN users ON posts.username = users.username 
    `;

    if (sort === 'likes') {
        query += `ORDER BY likes DESC, timestamp DESC`;
    } else {
        query += `ORDER BY timestamp DESC`;
    }

    const posts = await db.all(query);
    await db.close();
    return posts;
}

// Function to add a new post
async function addPost(title, content, username) {
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    await db.run('INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)', 
        [title, content, username, new Date().toISOString(), 0]);
    await db.close();
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    //  initialize canvas
    const avatarCanvas = canvas.createCanvas(width, height);
    const context = avatarCanvas.getContext('2d');

    //  set colors
    const backgroundColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    const textColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

    //  fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    //  fill letter
    context.fillStyle = textColor;
    context.font = 'bold 50px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter.toUpperCase(), width / 2, height / 2);

    return avatarCanvas.toBuffer();
}

// Function to find a post by ID
async function findPostById(id) {
    const db = await sqlite.open({ filename: 'database.db', driver: sqlite3.Database });
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [id]);
    await db.close();
    return post;
}
