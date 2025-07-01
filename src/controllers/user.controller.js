import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { response } from "express";

const registerUser = asyncHandler( async (req, res) =>{
    // Steps -------->
    // 1. Get User Detail from Frontend
    // 2. Validation - not empty
    // 3. Check if user Already Exist : check by Username, Email
    // 4. Check For images , Check For Avtar
    // 5. If Image Available -->  upload them to Cloudinary , Check Avtar
    // 6. Create user Object --> Create entry in DB (DB call)
    // 7. Remove Password & Refresh Token feild From Response
    // 8. check For User Creation (Is response Coming) 
    // 9. --> return Response

    // 1. Get User Detail from Frontend
    const {username, email, fullName, password} = req.body
    console.log("UserName: ", username);

    // 2. Validation - not empty
    if (
        [username, email, fullName, password].some((field)=>{
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All Feilds are required")
    }
    
    // 3. Check if user Already Exist : check by Username, Email
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    
    if (existedUser) {
        throw new ApiError(409, "User with email or Username already Existed")
    }

    // 4. Check For images , Check For Avtar
    const avtarLocalPath = req.files?.avtar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avtar File Is Required")
    }

    // 5. If Image Available -->  upload them to Cloudinary , Check Avtar
    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avtar) {
        throw new ApiError(400, "Avtar File Is Required")
    }

    // 6. Create user Object --> Create entry in DB (DB call)
    const user = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        password,
        email
    })

    // 7. Remove Password & Refresh Token feild From Response
    const createdUser = await user.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check For User Creation (Is response Coming) 
    if (createdUser) {
        throw new ApiError(500, "Something Went Wrong while registering the user")
    }

    // 9. --> return Response
    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully!")
    )
    
})

export {registerUser}