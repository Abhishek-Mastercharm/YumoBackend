// Iss Middleware Ka Kam Hai ---> User Login Hai Ya nhi ye Auth.middleware.js se Pata lagega  (Authenticate User To check)

// Logout Route main iska use hoga 

import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

export const verifyJwt = asyncHandler( async(req, res, next)=>{
    // "authorization: Bearer <token>"
    
    // Req ke pass cookies ka access hai check in app.js
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        console.log("Token: ",token)
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decordedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decordedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            // TODO: discuss about Frontend
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})