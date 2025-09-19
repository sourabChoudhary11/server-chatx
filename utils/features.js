import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import streamifier from "streamifier";
import { jwtSecret } from "../constants/env.js";
import { colorize } from "./colorize.js";
import { getSocketMembers } from "./helper.js";


export const connectDb = (uri) => {
    mongoose.connect(uri, {
        dbName: "ChatX"
    }).then(data => {
        console.log(colorize("🔗Connect MongoDb Atlas ", "cyan"), colorize(data.connection.host, "green"));
    }).catch(err => {
        console.log('⛔', colorize(err, "red"))
    });
}

export const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "none",
    secure: true,
    httpOnly: true
}

export const sendTokenAndResponse = (res, statusCode, user, message) => {
    const token = jwt.sign({ _id: user._id }, jwtSecret)

    return res.status(statusCode).cookie("auth_token", token, cookieOptions).json({
        success: true,
        user,
        message
    });
}

export const emitEvent = (req, event, users, data) => {
    const io = req.app.get("io");
    const members = getSocketMembers(users);
    io.to(members).emit(event, data);
}

export const uploadFilesToCloudinary = async (files = []) => {

    const arrayPromise = files.map(({ buffer }) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "ChatX", resource_type: "auto" },
                (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                }
            );
            streamifier.createReadStream(buffer).pipe(stream);
        });
    })

    try {
        const results = await Promise.all(arrayPromise);
        const formattedResults = results.map(({ public_id, secure_url }) => ({
            public_id, url: secure_url
        }))
        return formattedResults;
    } catch (error) {
        console.log(error);
        throw new Error("Error Uploading Files To Cloudinary");
    }
}

export const deleteFilesFromCloudinary = async (public_ids) => {
    const arrayPromise = public_ids.map((public_id) => {
        return cloudinary.uploader.destroy(public_id, {
            invalidate: true,
        });
    })

    try {
        await Promise.all(arrayPromise);
    } catch (error) {
        console.log(error);
        throw new Error("Error Deleting Files From Cloudinary");
    }
}