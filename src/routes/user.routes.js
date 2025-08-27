import {Router} from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";
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



export default router;