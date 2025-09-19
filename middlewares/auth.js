import jwt from "jsonwebtoken";
import { adminSecretKey, jwtSecret } from "../constants/env.js";
import { ErrorHandler } from "../utils/utility.js";
import { User } from "../models/user.js";

const isAuthenticated = (req, res, next) => {
    const { auth_token } = req.cookies;
    if (!auth_token) return next(new ErrorHandler("Login First", 401));
    const token = jwt.verify(auth_token, jwtSecret);
    req.userId = token._id;
    next();
}

const isAdmin = (req, res, next) => {
    const { auth_admin_token } = req.cookies;

    if (!auth_admin_token) return next(new ErrorHandler("Admin Access Only", 401));

    const adminKey = jwt.verify(auth_admin_token, jwtSecret);
    const isMatch = adminKey === adminSecretKey;

    if (!isMatch) return next(new ErrorHandler("Admin Access Only", 401));
    next();
}

const socketAuthenticator = async (err,socket,next)=>{
try {
    if(err) return next(err);
    
    const token = socket.request.cookies.auth_token;

    if(!token) return next(new ErrorHandler("Please Login First", 401));

    const decodedToken = jwt.verify(token, jwtSecret);
    const user = await User.findById(decodedToken._id);
    if(!user) return next(new ErrorHandler("Please Login First", 401));
    socket.user = user;

    next();
} catch (error) {
    return next(new ErrorHandler("Please Login First", 401)) 
}
}

export {
    isAdmin, isAuthenticated, socketAuthenticator
};
