const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

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
app.set('views',  'views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
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
app.get('/', (req, res) => {
    console.log("get /");
    const allPosts = getPosts();
    const user = req.session.user;
    
    console.log("Posts length", posts.length, posts[0].username, posts[1].username);
    res.render('home', { posts: allPosts, user });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    console.log("get /register");
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    console.log("get /login");
    res.render('loginRegister', { 
        loginError: req.query.error,
    });
});
// Like route GET route is used for error response from login
//
// app.get('/like', (req, res) => {
//     const error = req.query.error;
//     res.render('partials/post', { error });
// });

// Error route: render error page
//
app.get('/error', (req, res) => {
    console.log("get /error");
    res.render('error');
});

// Additional routes that you must implement

app.get('/post/:id', (req, res) => {
    console.log("get /post", req.params.id);
    // Find the post by ID
    const post = posts.find(post => post.id === Number(req.params.id));
    // If the post was not found, render the error page
    if (!post) {
        res.render('error', { message: 'Post not found' });
        return;
    }

    // Render the post detail page with the post
    res.render('partials/post', { post });
});
//  make a post
app.post('/posts', (req, res) => {
    console.log("get /posts");
    addPost(req.body.title, req.body.content, req.session.user.username);
    res.redirect('/');
});
//  like a post
app.post('/like/:id', (req, res) => {
    console.log("get /like", req.params.id);
    updatePostLikes(req, res);
});
app.get('/profile', isAuthenticated, (req, res) => {
    console.log("get /profile");
    renderProfile(req, res);
});
app.get('/avatar/:username', (req, res) => {
    console.log("get /avatar/", req.params.username);
    handleAvatar(req, res);
});
app.post('/register', (req, res) => {
    console.log("post /register");
    registerUser(req, res);
});
app.post('/login', (req, res) => {
    console.log("post /login");
    loginUser(req, res);
});
app.get('/logout', (req, res) => {
    console.log("post /logout");
    logoutUser(req, res);
});
app.post('/delete/:id', isAuthenticated, (req, res) => {
    // TODO: Delete a post if the current user is the owner
    console.log("post /delete", req.params.id);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users

let users = [
    { id: 0, username: 'u1', avatarUrl: undefined, memberSince: '2024-01-01 08:00' },
    { id: 1, username: 'AnotherUser', avatarUrl: undefined, memberSince: '2024-01-02 09:00' },
];
let posts = [
    { id: 0, title: 'Sample Post', content: 'This is a sample post.', username: users[0].username, avatarUrl: `/avatar/${users[0].username}`, timestamp: '2024-01-01 10:00', likes: [] },
    { id: 1, title: 'Another Post', content: 'This is another sample post.', username: users[1].username, avatarUrl: `/avatar/${users[1].username}`, timestamp: '2024-01-02 12:00', likes: [] },
];

// Function to find a user by username
function findUserByUsername(username) {
    console.log("findUserByUsername, ", username);
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            return users[i];
        }
    }
    return undefined;
}

// Function to find a user by user ID
function findUserById(userId) {
    console.log("findUserByID, ", userId);
    for (let i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            return users[i];
        }
    }
    return undefined;
}

// Function to add a new user
function addUser(username, password) {
    console.log("addUser, ", username);
    const avatar = generateAvatar(username[0]);
    const avatarPath = path.join(__dirname, 'public', 'images', `${username}.png`);
    const user = {
        id: users.length,
        username: username,
        avatarUrl: `/images/${username}.png`,
        memberSince: new Date()
    };
    
    // Save the avatar to the file system
    fs.promises.writeFile(avatarPath, avatar)
        .then(() => {
            console.log('Avatar saved at', avatarPath);
            users.push(user);
        })
        .catch(err => {
            console.error('Error saving avatar:', err);
        });
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log("isAuthenticated, ", req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    console.log("registerUser, ", req.body.username);
    const username = req.body.username;
    //const password = req.body.password;
    if (findUserByUsername(username) !== undefined) {
        // username already exists
        res.redirect('/register?error=Username+already+exists');
    } else {
        // add the new user
        addUser(username);
        console.log("added");
        res.redirect('/login');
    }
}

// Function to login a user
function loginUser(req, res) {
    console.log("loginUser, ", req.body.username);
    const username = req.body.username;
    const user = findUserByUsername(username);

    if (user) {
        // Successful login
        req.session.userId = user.id;
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect('/');
    } else {
        // Invalid username or password
        res.redirect('/login?error=Invalid+username+or+password');
    }
}

// Function to logout a user
function logoutUser(req, res) {
    console.log("logoutUser, ", req.session.user.username);
    // req.session.destroy(err => {
    //     if (err) {
    //         console.error("Error destroying session: ", err);
    //         res.redirect('/error'); // Redirect to error page

    //     } else {
    //         res.clearCookie('connect.sid'); // Clear the session cookie
    //         res.redirect('/'); //Redirect to home page after successful logout
    //     }
    // });
    req.session.loggedId = false;
    req.session.user = {};
    req.session.userId = '';
    res.clearCookie('connect.sid');
    res.redirect('/');

}

// Function to render the profile page
function renderProfile(req, res) {
    console.log("renderProfile, ", req.session.user.username);
    const user = req.session.user;
    const userPosts = posts.filter(post => post.username === user.username);
    res.render('profile', { user, posts: userPosts });
}

// Function to update post likes
function updatePostLikes(req, res) {
    const postId = parseInt(req.params.id);
    const post = posts.find(post => post.id === postId);

    if (req.session.loggedIn) {
        if (!post.likes.includes(req.session.user.id)) {
            post.likes.push(req.session.user.id);
        } else {
            post.likes = post.likes.filter(userId => userId !== req.session.user.id);
        }
        res.json({ success: true, likes: post.likes });
    } else {
        res.json({ success: false, message: 'Not logged in' });
    }
}



// Function to handle avatar generation and serving
async function handleAvatar(req, res) {
    console.log("handleAvatar, ", req.params.username);
    const username = req.params.username;
    const user = findUserByUsername(username);

    if (user) {
        const avatarPath = path.join(__dirname, 'public', 'images', `${username}.png`);
        if (fs.existsSync(avatarPath)) {
            res.sendFile(avatarPath);
        } else {
            res.status(404).send('Avatar not found');
        }
    } else {
        res.status(404).send('User not found');
    }
}




// Function to get all posts, sorted by latest first
function getPosts() {
    console.log("getPosts");
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, username) {
    console.log("addPost, ", title, ", content, ", username);
    const user = findUserByUsername(username);
    const post = {
        id: posts.length,
        title: title,
        content: content,
        username: username,
        avatarUrl: user.avatarUrl,
        timestamp: new Date().toISOString(),
        likes: []
    };
    posts.push(post);
}



// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    console.log("generateAvatar, ");
    const avatarCanvas = canvas.createCanvas(width, height);
    const context = avatarCanvas.getContext('2d');

    const backgroundColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    const textColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    context.fillStyle = textColor;
    context.font = 'bold 50px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter.toUpperCase(), width / 2, height / 2);

    return avatarCanvas.toBuffer();
}