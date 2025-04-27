// require('dotenv').config({path: './env'});

import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './env'
});

// ConnectDB call Here
connectDB()
.then(()=>{
    
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at PORT: ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("MONGO db Connection Failed !!",error)
    throw error
})






















/*
import express from 'express';
const app = express;
 
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on((error)=>{
            console.error("Error:",error)
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on PORT ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error:",error)
        throw error
    }
})();
*/