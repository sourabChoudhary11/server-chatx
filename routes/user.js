import express from "express";
import { acceptRequest, deleteUser, getFriends, getNotifications, getUserProfile, login, logout, register, search, sendRequest } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { validateAcceptRequestReq, validateLoginReq, validateRegisterReq, validateSendRequestReq } from "../middlewares/validator.js";
import { User } from "../models/user.js";

const app = express.Router();

app.delete("/empty", async (req,res,next)=>{
   await User.deleteMany({});
   const users = await User.find({});
   res.status(200).json({
    users
   });
});

app.post("/register", singleUpload("avatar"), validateRegisterReq, register);

app.post("/login", validateLoginReq,login);

app.get("/logout", logout);

app.get("/profile", isAuthenticated, getUserProfile);

app.get("/search", isAuthenticated, search);

app.post("/send-request", isAuthenticated, validateSendRequestReq, sendRequest);

app.delete("/accept-request", isAuthenticated, validateAcceptRequestReq, acceptRequest);

app.get("/notifications", isAuthenticated, getNotifications);

app.get("/friends", isAuthenticated, getFriends);

app.route("/:id").delete(deleteUser);

export default app