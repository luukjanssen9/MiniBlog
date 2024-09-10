# MiniBlog

### A fun blog website where you can post about anything you want!

This project is a mini blog website where users can create posts similar to Twitter. It features a homepage, a login page with Google authentication for a seamless sign-in experience, and a profile page to manage posts. The backend is powered by Node.js with Handlebars as the templating engine and MySQL handling data storage. Additionally, a search bar allows users to easily find posts based on keywords, enhancing user interaction and engagement.

## Backend:

### Server.js:

This file contains the main configuration and setup of the blog website. It sets up the server using Express.js and integrates various key components like Handlebars for templating, Google OAuth 2.0 for user authentication, and SQLite3 for database interactions. The application also supports session management using express-session, along with custom middleware to handle user login states. Additionally, it includes helper functions for database queries, user registration, and post handling, as well as utility features like generating avatars for new users.

### database.db, showdb.js, populatedb.js:

The project consists of three key files: showdb.js, populatedb.js, and database.db, all of which work together to manage and display a SQLite database. The showdb.js script connects to the database.db file and checks for the existence of the users and posts tables, logging their contents or appropriate messages if no data is found. Meanwhile, populatedb.js is responsible for initializing the database by creating these tables if they don't already exist and populating them with sample data if the database is empty. The actual data is stored in database.db, which contains two primary tables: users, storing user information such as usernames and Google IDs, and posts, holding blog posts with details like titles, content, and timestamps. Together, these components handle database setup, population, and content display for the blog application.

## Frontend:

The frontend of this project is structured using Handlebars templates and corresponding CSS files to ensure consistency and style across different pages. The main.handlebars and styles.css files are responsible for managing the header and footer, providing a unified layout across all pages. For user authentication, the googleLogout.handlebars and loginWithGoogle.handlebars templates, along with the loginLogoutRegister.css and loginRegister.css stylesheets, handle the logout and login pages, respectively. The profile page is managed by profile.handlebars and profile.css, allowing users to view and edit their profile information. Lastly, the homepage is designed using home.handlebars and styled with home.css, offering a welcoming landing page for users. These files together define the visual and interactive aspects of the blog application's user interface.
