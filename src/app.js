import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

// Cors configuration -->
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))

app.use(cookieParser())

// Express Configuration --->

// Parses incoming JSON requests
app.use(express.json({limit: "16kb"}));
// Parses URL-encoded data (like form submissions)
app.use(express.urlencoded({ extended: true, limit: "16kb"}));
// Serves static files (like images, CSS, JS) from the public directory.
app.use(express.static("public"))


// Routes here Import - Route Segrigate

import router from "./routes/user.routes.js"


// Routes Declaration
// - Here use()  middleware used Bcz the Router and Controller are seperate from this file
app.use("/api/v1/users", router);

// URL EXAMPLE:    http://localhost:8000/api/v1/users/register


export { app }