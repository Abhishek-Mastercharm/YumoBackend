import express, { urlencoded } from 'express';
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
app.use(express.urlencoded({limit: "16kb"}));
// Serves static files (like images, CSS, JS) from the public directory.
app.use(express.static("public"))


export { app }