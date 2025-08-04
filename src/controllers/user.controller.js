import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { response } from "express";

// Method For generate access and refresh token
const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        // store the refresh token in DB
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false})

        return {refreshToken, accessToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

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

    // 2. Validation - not empty
    if (
        [username, email, fullName, password].some((field)=>{
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All Feilds are required")
    }
    
    // 3. Check if user Already Exist : check by Username, Email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    
    if (existedUser) {
        throw new ApiError(409, "User with email or Username already Existed")
    }

    // 4. Check For images , Check For Avtar
    const avtarLocalPath = req.files?.avtar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
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
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check For User Creation (Is response Coming) 
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong while registering the user")
    }

    // 9. --> return Response
    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully!")
    )
    
})

const loginUser = asyncHandler(async (req, res)=>{
    // steps --> 

    // 1. req body -> data fetch
    // 2. username or email base access login
    // 3. find the user
    // 4. password check (if login have )
    // 5. access token and refresh token generate and send to user
    // 6. send token to cookies and response

    // 1. req body -> data fetch
    const {username, email, password} = req.body

    // 2. username or email base access login
    if (!username || !email) {
        throw new ApiError(400, "Username or Email is required")        
    }

    // 3. find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user) {
        throw  new ApiError(404, "User does not exist")
    }

    // 4. password check (if login have )
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw  new ApiError(404, "Invalid user Credentials")
    }

    // 5. access token and refresh token generate and send to user
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")

    // 6. send token to cookies and response 

    // Here cookies are secure that are only editable by server side not Frontend Side
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "User Logged In Successfully"
        )
    )

})

const logOutUser = asyncHandler( async (req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    // Cookies Clear 

    return res
    .status(200)
    .clearCookie("AccessToken", accessToken, options)
    .clearCookie("RefreshToken", refreshToken, options)
    .json(
        new apiResponse(200,{},"User Logged Out")
    )

})

export {
    registerUser,
    loginUser,
    logOutUser
}