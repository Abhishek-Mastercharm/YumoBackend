import mongoose, {Schema} from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: [true,'UserName is Required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true,'Email is Required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: [true,'FullName is Required'],
        trim: true,
        index: true
    },
    avtar: {
        type: String,  // CLoudnary URL 
        required: [true,'Avtar is Required']
    },
    coverImage: {
        type: String
    },
    password: {
        type: String,
        required: [true,'Password is Required']
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    refreshToken: {
        type: String
    }
},
{timestamps: true}
);

// Pre middleware functions are executed one after another, when each middleware calls next.
userSchema.pre("save", async function (next) {
    // If the password is not Modifed (It is used for preventing the password is not changed everytime)
    if(!this.isModified("password")) return next()

    //  "Assault Hash Round" the number of iterations or steps performed during the hashing process.
    // if the Password is modified
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// ---->  custom method (WE can create it)

userSchema.methods.isPasswordCorrect = async function (password){
    // Use the Bcrypt for Comparing the password is correct or not
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        // payload
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        
        // expiry is always Written in Object
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    // RefreshToken have less Information
    return jwt.sign(
        // payload
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);