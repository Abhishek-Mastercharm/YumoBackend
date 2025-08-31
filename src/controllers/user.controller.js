import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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
    if ([username, email, fullName, password].some(field => !field || field.trim() === ""))
    {
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
    if (!(username || email)) { 
        throw new ApiError(400, "Username or Email is required")        
    }

    // 3. find the user
    const user = await User.findOne({
        $or: [
        username ? { username } : null,
        email ? { email } : null
        ].filter(Boolean)   // Filter() remove nulls or falsy values
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

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
            $unset:{
                refreshToken: 1 //THis remove the feild from the document
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
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(
        new apiResponse(200,{},"User Logged Out")
    )

})

// Refresh access token ka end point
const refreshAccessToken = asyncHandler( async (req, res) =>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Request")
    }

    // Decorded Token Milega isse
    try {
        const decordedToken =  jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decordedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== User?.refreshToken) {
            throw new ApiError(401,"User Refresh Token is Expired or Used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", newRefreshToken, options)
        .json(
            new apiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) =>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Password Changed Successfully"
        )
    )
})

const getCurrentUser = asyncHandler( async (req, res) =>{
    return res
    .status(200)
    .json(200, req.user ,"Current user fetched Successfully")
})

const updateAccountDetail = asyncHandler( async (req, res) =>{
    console.log("\Account detail received: ", req.body);
    const {fullName,email} = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All Fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "User Account Detail is updated successfully")
    )
})

const updateUserAvtar = asyncHandler( async (req, res) =>{
    console.log("\nFile received: ", req.file);

    const avtarLocalPath = req.file?.path
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avatar File is missing")
    }   

    const avtar = await uploadOnCloudinary(avtarLocalPath)
    
    if (!avtar.url) {
        throw new ApiError(400, "Error while uploading Avtar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avtar : avtar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Avatar Image is updated successfully")
    )
})

const updateUserCoverImage = asyncHandler( async (req, res) =>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is missing")
    }   

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Cover Image is updated successfully")
    )
})

const getUserChannelProfile = asyncHandler( async (req, res) =>{
    const {username} = req.params
    
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {   
                        if: {$in: [User?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                coverImage: 1,
                avtar: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnot exists")
    }

    return res
    .status(200)
    .json(200, channel[0], "User channel fetched successfully")
})

const getWatchHistory = asyncHandler( async (req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videoes",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avtar: 1
                                    }
                                }
                            ]
                        }   
                    },
                    {
                        $addFields: {
                            owner: {
                                // Now the owner object are easily accessed
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "WatchHistory fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}