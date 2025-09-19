import jwt from "jsonwebtoken";
import { adminSecretKey, jwtSecret } from "../constants/env.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { cookieOptions } from "../utils/features.js";
import { sendResponse } from "../utils/helper.js";
import { ErrorHandler } from "../utils/utility.js";

const adminLogin = TryCatch(async (req, res, next) => {
    const secretKey = req.body.secretKey;

    const isMatch = secretKey === adminSecretKey;
    if(!isMatch) return next(new ErrorHandler("Invalid Admin Key",401));

    const token = jwt.sign(secretKey, jwtSecret);

    res.status(200).cookie("auth_admin_token", token,{
        ...cookieOptions,
        maxAge: 1000*60*15
    }).json({
        success: true,
        message: "Authenticated Successfully, Welcome BOSS"
    });
});

const adminLogout = TryCatch((req, res) => {

    res.status(200).cookie("auth_admin_token", "",{
        ...cookieOptions,
        maxAge: 0
    }).json({
        success: true,
        message: "Logout Successfully"
    });
});

const getAdminData = TryCatch((req, res, ) => {
    sendResponse(res,200,{admin:true});
});

const getUsers = TryCatch(async (req, res) => {
    const users = await User.find({});

    const transformedUsers = await Promise.all(
        users.map(async ({ _id, name, avatar, email }) => {

            const [friends, groups] = await Promise.all([
                Chat.countDocuments({ groupChat: false, members: _id }),
                Chat.countDocuments({ groupChat: true, members: _id })
            ])

            return ({
                _id,
                name,
                avatar: avatar.url,
                email,
                friends,
                groups
            })
        })
    );

    sendResponse(res, 200, { users: transformedUsers.reverse() })
});

const getChats = TryCatch(async (req, res) => {
    const chats = await Chat.find({}).populate(["members", "creator"], "name avatar");

    const transformedChats = await Promise.all(
        chats.map(async ({ _id, members, name, groupChat, creator }) => {
            const totalMessages = await Message.countDocuments({
                chat: _id
            });

            return {
                _id,
                name,
                groupChat,
                avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
                totalMembers: members.length,
                members: members.map(({ _id, avatar, name }) => ({
                    _id,
                    avatar: avatar.url,
                    name
                })),
                totalMessages,
                creator: {
                    name: creator?.name || "None",
                    avatar: creator?.avatar.url || ""
                }
            }
        })
    );

    sendResponse(res, 200, { chats: transformedChats.reverse() });
});

const getMessages = TryCatch(async (req, res) => {
    const messages = await Message.find({}).populate("sender", "name avatar").populate("chat", "groupChat");
    const transformedMessages = messages.map(({ _id, attachments, sender, content, chat,createdAt }) => ({
        _id,
        attachments,
        content,
        sender: {
            _id:sender._id,
            name: sender.name,
            avatar: sender.avatar.url
        },
        chat:chat._id,
        groupChat:chat.groupChat,
        createdAt
    }));


    sendResponse(res, 200, { messages: transformedMessages.reverse() });
});

const getDashboardStats = TryCatch(async (req, res) => {

    const [groupChatCount, usersCount, totalChatCount,messagesCount] = await Promise.all([
        Chat.countDocuments({groupChat:true}),
        User.countDocuments(),
        Chat.countDocuments(),
        Message.countDocuments()
    ]);

    const today = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate()-6);

    const last7DaysMessages = await Message.find({
        createdAt: {$gte:sevenDaysAgo, $lte: today}
    }).select("createdAt");

    let last7Days = new Array(7).fill(0);

    const dayInMiliSeconds = 1000*60*60*24;

    last7DaysMessages.forEach((message)=>{
        const indexApprox = (today.getTime()-(new Date(message.createdAt)).getTime())/dayInMiliSeconds;
        const index = Math.floor(indexApprox);
        last7Days[6-index]++;
    });

    const stats= {
        groupChatCount, 
        usersCount, 
        totalChatCount,
        messagesCount,
        last7Days
    }
    
    sendResponse(res,200,{
        stats
    })
});


export {
    adminLogin,
    adminLogout,
    getAdminData, getChats, getDashboardStats, getMessages, getUsers
};
