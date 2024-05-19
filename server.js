const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');


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
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render('home', { posts, user });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { 
        loginError: req.query.error,
        });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.get('/post/:id', (req, res) => {
    // TODO: Render post detail page
});
app.post('/posts', (req, res) => {
    // TODO: Add a new post and redirect to home
    addPost(req.body.title, req.body.content, findUserById(req.session.userId));
    res.redirect('/');
});
app.post('/like/:id', (req, res) => {
    updatePostLikes(req, res);
});
app.get('/profile', isAuthenticated, (req, res) => {
    renderProfile(req, res);
});
app.get('/avatar/:username', (req, res) => {
    console.log("hereee");
    handleAvatar(req, res);
});
app.post('/register', (req, res) => {
    registerUser(req, res);
});
app.post('/login', (req, res) => {
    loginUser(req, res);
});
app.get('/logout', (req, res) => {
    logoutUser(req, res);
});
app.post('/delete/:id', isAuthenticated, (req, res) => {
    // TODO: Delete a post if the current user is the owner
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
    { id: 1, username: 'SampleUser', avatar_url: undefined, memberSince: '2024-01-01 08:00' },
    { id: 2, username: 'AnotherUser', avatar_url: undefined, memberSince: '2024-01-02 09:00' },
];
let posts = [
    { id: 1, title: 'Sample Post', content: 'This is a sample post.', user: users[0], timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 2, title: 'Another Post', content: 'This is another sample post.', user: users[1], timestamp: '2024-01-02 12:00', likes: 0 },
];

// Function to find a user by username
function findUserByUsername(username) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            return users[i];
        }
    }
    return undefined;
}

// Function to find a user by user ID
function findUserById(userId) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == userId) {
            return users[i];
        }
    }
    return undefined;
}

// Function to add a new user
function addUser(username, password) {
    let user = {
        id: users.length,
        username: username,
        // password: password,
        avatar_url: undefined,
        memberSince: new Date()
    };
    users.push(user);
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log(req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    const username = req.body.username;
    //const password = req.body.password;
    console.log("Attempting to register:", username);
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
    const username = req.body.username;
    const user = findUserByUsername(username);

    if (user) {
        // Successful login
        console.log("Logged in:", username);
        req.session.userId = user.id;
        req.session.loggedIn = true;
        req.session.user = user;
        req.session.save(err => {
            if (err) {
                // handle error
                console.log(err);
            } else {
                res.redirect('/');
            }
        });;
    } else {
        // Invalid username or password
        res.redirect('/login?error=Invalid+username+or+password');
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session: ", err);
            res.redirect('/error'); // Redirect to error page

        } else {
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.redirect('/'); //Redirect to home page after successful logout
        }
    });
}

// Function to render the profile page
function renderProfile(req, res) {
    const user = findUserById(req.session.userId);
    const userPosts = posts.filter(post => post.username === user.username);
    res.render('profile', { user, posts: userPosts });
}

// Function to update post likes
function updatePostLikes(req, res) { 
    //  get post from request params
    const postId = parseInt(req.params.id);
    const post = posts.find(post => post.id === postId);
    //  increment likes
    if (post) {
        post.likes += 1;
    }
    res.redirect(`/post/${postId}`);t
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    //  get username from request params
    const username = req.params.username;
    const user = findUserByUsername(username);
    console.log("Working on avatar for ", username);

    if (user) {
        //  generate avatar and send to client
        const avatar = generateAvatar(username[0]);
        res.contentType('image/png');
        res.send(avatar);
        // update user avatar_url
        user.avatar_url = `/avatar/${username}`;
    } else {
        res.status(404).send('User not found');
    }
}

// Function to get the current user from session
function getCurrentUser(req) {
    // TODO: Return the user object if the session user ID matches
}

// Function to get all posts, sorted by latest first
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, poster) {
    // make new post object
    let post = {
        id: posts.length + 1,
        title: title,
        content: content,
        user: poster,
        timestamp: new Date().toISOString(),
        likes: 0
    };
    //  add to post array
    posts.push(post);
    console.log("Pushed post", title, ": ", content, "to post array by", poster.username);
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    //  initialize canvas
    const avatarCanvas = canvas.createCanvas(width, height);
    const context = avatarCanvas.getContext('2d');

    // choose color scheme from letter
    const backgroundColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    const textColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

    // draw background color
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    // draw letter in the center
    context.fillStyle = textColor;
    context.font = 'bold 50px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter.toUpperCase(), width / 2, height / 2);

    // return avatar as PNG buffer
    return avatarCanvas.toBuffer();
}