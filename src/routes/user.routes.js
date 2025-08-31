import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logOutUser, registerUser, updateAccountDetail, updateUserAvtar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";
import {verifyJwt} from "../middlewares/auth.middlewares.js"
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avtar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

// Secured Routes 
router.route("/logout").post(
    // Here Middleware Injected for Verify The User Logged In or Not using Auth middleware
    verifyJwt,
    logOutUser
)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJwt, changeCurrentPassword)

router.route("/current-user").get(verifyJwt, getCurrentUser)

// patch used because to prevent from all data to update
router.route("/update-account-detail").patch(verifyJwt, updateAccountDetail)

router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvtar)

router.route("/update-coverImage").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJwt, getUserChannelProfile)

router.route("/history").get(verifyJwt, getWatchHistory)


export default router;