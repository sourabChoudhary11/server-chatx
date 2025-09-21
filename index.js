import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import express from "express";
import { createServer } from "http";
import https from "https";
import { Server } from "socket.io";
import { corsOptions } from "./constants/config.js";
import { apiKey, apiSecret, clientURL, cloudName, mongoURI, port } from "./constants/env.js";
import { CONNECT_USERS, NEW_MESSAGE, NEW_MESSAGE_ALERT, OFFLINE_USERS, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/event.js";
import { onlineUsers, usersSocketIds } from "./constants/socket.js";
import { socketAuthenticator } from "./middlewares/auth.js";
import { errorMiddeware } from "./middlewares/error.js";
import { Chat } from "./models/chat.js";
import { Message } from "./models/message.js";
import adminRoute from "./routes/admin.js";
import chatRoute from "./routes/chat.js";
import userRoute from "./routes/user.js";
import { connectDb } from "./utils/features.js";
import { getSocketMembers } from "./utils/helper.js";

https.globalAgent.options.family = 4;

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
})

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: corsOptions
});

connectDb(mongoURI);

app.set("io", io);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions))

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);


io.use((socket, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async (err) => await socketAuthenticator(err, socket, next)
    )
})

io.on("connection", async (socket) => {
    const user = socket.user;

    const chats = await Chat.find({groupChat:false, members:user._id}).lean();
    const friends = Array.from(new Set(chats.flatMap(({members})=>members).map(u=>u.toString())));
    
    socket.on(CONNECT_USERS, (userId)=>{
        usersSocketIds.set(userId, socket.id);

        const socketMembers = getSocketMembers(friends);
        socket.to(socketMembers).emit(CONNECT_USERS, userId);
    })

    socket.on(ONLINE_USERS, (onlineUser)=>{
        const socketMembers = getSocketMembers(friends);
        socket.to(socketMembers).emit(ONLINE_USERS, onlineUser);
    })

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const realTimeMessage = {
            _id: crypto.randomUUID(),
            sender: {
                _id: user._id,
                name: user.name
            },
            content: message,
            attachments: [],
            chat: chatId,
            createdAt: new Date().toISOString(),
        }

        const messageDb = {
            sender: user._id,
            content: message,
            chat: chatId
        }

        const membersSockets = getSocketMembers(members);

        io.to(membersSockets).emit(NEW_MESSAGE, {
            chatId,
            message: realTimeMessage
        });

        io.to(membersSockets).emit(NEW_MESSAGE_ALERT, { chatId });

        await Message.create(messageDb);
    })

    socket.on(START_TYPING, ({ chatId, members }) => {
        const socketMembers = getSocketMembers(members);
        socket.to(socketMembers).emit(START_TYPING, { chatId })
    })

    socket.on(STOP_TYPING, ({ chatId, members }) => {
        const socketMembers = getSocketMembers(members);
        socket.to(socketMembers).emit(STOP_TYPING, { chatId })
    })

    socket.on("disconnect", () => {
        const socketMembers = getSocketMembers(friends);
        socket.to(socketMembers).emit(OFFLINE_USERS, user._id.toString());

        usersSocketIds.delete(user._id.toString());
    });
})

app.use(errorMiddeware);

server.listen(port, () => {
    console.log("Listening at port", port);
});