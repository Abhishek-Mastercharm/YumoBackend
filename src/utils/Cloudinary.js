import {v2 as cloudinary} from "cloudinary";
import { log } from "console";
import fs from "fs";  // File system in Node Js

// Cloudinary Configuration Here
cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    }
);

// upload File on cloudinary
const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return "File is Not Present"

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File Successfull Uploaded
        console.log("File is Uploaded successfully", response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        // Remove the Locally saved temporary malicious files as the upload operation failed
        return null;
    }
}

export {uploadOnCloudinary};