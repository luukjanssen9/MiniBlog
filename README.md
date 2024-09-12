# MiniBlog

## Table of Contents
- [Project Description](#project-description)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Project Description

Before starting Miniblog, the primary goals were to develop a full-stack web application from scratch, focusing on enhancing both frontend and backend development skills using modern technologies such as Node.js, MySQL, and Handlebars. A key objective was to implement user authentication and authorization through Google OAuth, gaining valuable experience in managing secure user sessions. Another aim was to design a responsive user interface, ensuring the platform could adapt seamlessly across various devices, all while maintaining a clean, modern aesthetic. The project also involved creating a scalable relational database to manage user data, profiles, and posts, while incorporating full-text search functionality to allow users to quickly find relevant content. Furthermore, building the application with scalability in mind was essential to ensure it could handle multiple users and larger data sets without sacrificing performance. Lastly, deploying the application on a cloud platform would make it production-ready, giving real-world users access while supporting potential traffic. These goals helped guide the project’s direction, making it a strong showcase of both technical skills and the ability to build a user-friendly, scalable platform.

## Features

- User authentication (Google Login)
- User-generated posts with search functionality
- Profile page for individual user content
- Real-time updates through AJAX requests
- Post filtering and search functionality
- Integration with MySQL backend
- Responsive design

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Handlebars (Templating)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: Google OAuth
- **Version Control**: Git, GitHub
- **API**: EmojiAPI

## Getting Started

### Prerequisites

Ensure that you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL](https://www.mysql.com/)
- Git

You will also need a Google Cloud Project with OAuth 2.0 credentials set up for Google Sign-In. You can follow [this guide](https://developers.google.com/identity/sign-in/web/sign-in) to set it up.

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/yourprojectname.git
   \`\`\`
   
2. Navigate to the project directory:
   \`\`\`bash
   cd yourprojectname
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

4. Set up the environment variables. Create a `.env` file in the root directory:
   \`\`\`bash
   touch .env
   \`\`\`
   
   Add the following:
   \`\`\`env
   CLIENT_ID=your-google-client-id
    CLIENT_SECRET=your-google-client-secret
    REDIRECT_URL=your-google-oauth-redirect-url
    EMOJI_KEY=your-emoji-api-key

   \`\`\`

5. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

6. Access the application at `http://localhost:3000`.

## Usage

Once the app is running:

1. Navigate to the homepage to either log in using Google OAuth or browse publicly available posts.
2. Use the search bar to filter posts by keywords.
3. Visit your profile page to view your personal posts and account information.
4. Create new posts using the "New Post" button on the dashboard or profile page.

## Project Structure

Here's a brief overview of the project's folder structure:

```
├── public/              # Static assets (CSS, JavaScript, Images)
├── views/               # Handlebars templates
│   ├── layouts/         # Layout files
│   ├── partials/        # Reusable components
├── .env                 # Environment variables (not included in the repo)
├── package.json         # NPM package file
├── populatedb.js        # Script to populate database
├── showdb.js            # Script to show database for debugging
└── server.js            # Entry point for the Node.js server
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
"""
