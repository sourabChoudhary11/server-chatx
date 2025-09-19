import bcrypt from "bcrypt";
import { NEW_REQUEST, REFETCH_CHAT } from "../constants/event.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { User } from "../models/user.js";
import { cookieOptions, emitEvent, sendTokenAndResponse, uploadFilesToCloudinary } from "../utils/features.js";
import { sendResponse } from "../utils/helper.js";
import { ErrorHandler } from "../utils/utility.js";

const login = TryCatch(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("invalid email or password", 401));

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return next(new ErrorHandler("invalid email or password", 401));

    sendTokenAndResponse(res, 200, user, `Welcome back, ${user.name}`);
})

const register = TryCatch(async (req, res) => {
    const {
        name,
        email,
        password,
        bio,
    } = req.body;


    const result = await uploadFilesToCloudinary([req.file]);

    const avatar = {
        public_id: result[0].public_id,
        url: result[0].url
    }

    const user = await User.create({
        name,
        email,
        password,
        bio,
        avatar
    })
    sendTokenAndResponse(res, 201, user, "User Created Successfully");
})

const getUserProfile = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.userId);
    if (!user) return next(new ErrorHandler("User Not Found", 404));
    sendResponse(res, 200, { user })
})

const deleteUser = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return next(new ErrorHandler("User Not Found", 404));
    sendResponse(res, 200, { message: "User Delete Successfully" })
})

const search = TryCatch(async (req, res) => {
    const { name = "" } = req.query;

    const chats = await Chat.find({ groupChat: false, members: req.userId });
    const uniqueUsers = new Set([...chats.flatMap(c => c.members), req.userId]);
    const myFriends = Array.from(uniqueUsers);

    const allUsersExceptMeMyFriends = await User.find({
        _id: { $nin: myFriends },
        name: { $regex: name, $options: "i" }
    });
    const users = allUsersExceptMeMyFriends.map(({ _id, name, avatar }) => ({
        _id, name, avatar: avatar.url
    }))
    sendResponse(res, 200, { users });
})

const sendRequest = TryCatch(async (req, res, next) => {
    const { receiverId } = req.body;

    const request = await Request.findOne({
        $or: [
            {
                sender: req.userId,
                receiver: receiverId
            },
            {
                sender: receiverId,
                receiver: req.userId
            }
        ]
    });

    if (request) return next(new ErrorHandler("Request Already Sent", 400))

    await Request.create({
        sender: req.userId,
        receiver: receiverId,
    });

    emitEvent(req, NEW_REQUEST, [receiverId]);

    sendResponse(res, 201, { message: "Request Sent Successfully" });
})

const acceptRequest = TryCatch(async (req, res, next) => {
    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId).populate("sender", "name").populate("receiver", "name");

    if (!request) return next(new ErrorHandler("Request Not Found", 400));

    if (request.receiver._id.toString() !== req.userId.toString()) return next(new ErrorHandler("Not Allowed To Accept Request", 403));

    if (!accept) {
        await request.deleteOne();
        return sendResponse(res, 200, { mesage: "Friend Request Rejected" })
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`
        }),
        request.deleteOne()
    ]);

    emitEvent(req, REFETCH_CHAT, members);

    sendResponse(res, 200, {
        message: "Friend Request Accepted",
        senderId: request.sender._id
    });
})

const getNotifications = TryCatch(async (req, res) => {

    const requests = await Request.find({ receiver: req.userId }).populate("sender", "name avatar");

    const myRequests = requests.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url
        }
    }))

    sendResponse(res, 200, { requests: myRequests });
})

const getFriends = TryCatch(async (req, res, next) => {

    const chatId = req.query.chatId;

    const myFriends = await Chat.find({
        groupChat: false,
        members: req.userId
    }).populate("members", "name avatar");

    const friends = myFriends.map(({ members }) => {
        const { _id, name, avatar } = members.find(member => member._id.toString() !== req.userId.toString());

        return ({
            _id, name, avatar: avatar.url
        })
    })

    if (chatId) {
        const chat = await Chat.findById(chatId);
        if (!chat) return next(new ErrorHandler("Chat Not Found", 400));
        const availableFriends = friends.filter(friend => !chat.members.includes(friend._id));
        sendResponse(res, 200, { friends: availableFriends });
    } else {
        sendResponse(res, 200, { friends });
    }

})

const logout = TryCatch(async (req, res) => {
    res.cookie("auth_token", "", {
        ...cookieOptions,
        maxAge: 0
    })
    sendResponse(res, 200, { message: "Logout Successfully" });
})

export { acceptRequest, deleteUser, getFriends, getNotifications, getUserProfile, login, logout, register, search, sendRequest };

