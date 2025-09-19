import { ALERT, NEW_ATTACHMENTS, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHAT } from "../constants/event.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { deleteFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { getSocketMembers, sendResponse } from "../utils/helper.js";
import { ErrorHandler } from "../utils/utility.js";

const createGroup = TryCatch(async (req, res) => {

    const {
        name,
        members
    } = req.body;

    const allMembers = [...members, req.userId]

    await Chat.create({
        name,
        groupChat: true,
        creator: req.userId,
        members: allMembers
    })

    emitEvent(req, ALERT, allMembers, `Welcome to ${name}`);
    emitEvent(req, REFETCH_CHAT, members, `Welcome to ${name}`);

    sendResponse(res, 201, { message: "Group Created Successfully" });
})

const getMyChats = TryCatch(async (req, res) => {

    const chats = await Chat.find({ members: req.userId }).populate("members", "name avatar");

    const transformChats = chats.map(({ _id, name, groupChat, members }) => {

        const otherMember = members.find(member => member._id.toString() !== req.userId.toString());

        return {
            _id,
            groupChat,
            name: groupChat ? name : otherMember.name,
            avatar: groupChat ? members.slice(0, 3).map(member => member.avatar.url) : [otherMember.avatar.url],
            members: members.filter(member => member._id.toString() !== req.userId.toString()).map(member => member._id)
        }
    })

    res.status(200).json({
        chats: transformChats
    })
})

const getMyGroups = TryCatch(async (req, res) => {
    const chats = await Chat.find({ creator: req.userId }).populate("members", "name avatar");

    const groups = chats.map(({ _id, name, groupChat, members }) => ({
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
    }));

    sendResponse(res, 200, { groups });
})

const addMembers = TryCatch(async (req, res, next) => {

    const { chatId, members } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 404));
    if (chat.creator.toString() !== req.userId.toString()) return next(new ErrorHandler("Only Group Admin Can Add", 403));

    const allNewMembersPromise = members.map(m => User.findById(m, "name"));

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers.filter(m => !chat.members.includes(m._id.toString()));

    chat.members.push(...uniqueMembers.map(m => m._id));

    if (chat.members.length > 100) return next(new ErrorHandler("Group Members Limit Reached", 400));

    await chat.save();

    const allUsersName = uniqueMembers.map(m => m.name).join(",");

    emitEvent(req, ALERT, chat.members, `${allUsersName} has been added to the group`);
    emitEvent(req, REFETCH_CHAT, chat.members);

    sendResponse(res, 200, { message: "Members Added Successfully" });
})

const removeMember = TryCatch(async (req, res, next) => {
    const { chatId, userId } = req.body;

    const [chat, userThatWillBeRemove] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name"),
    ]);

    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 404));
    if (chat.creator.toString() !== req.userId.toString()) return next(new ErrorHandler("Only Group Admin Can Add", 403));

    if (chat.members.length <= 3) return next(new ErrorHandler("Group Must Have At Least 3 Members", 400));

    const allChatMembers = chat.members;

    chat.members = chat.members.filter(m => m.toString() !== userId.toString());

    await chat.save();

    emitEvent(req, ALERT, chat.members, `${userThatWillBeRemove.name} has been removed from the group`);
    emitEvent(req, REFETCH_CHAT, allChatMembers);

    sendResponse(res, 200, { message: "Member Removed Successfully" });

})

const leaveGroup = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 404));

    const remainingMembers = chat.members.filter(m => m.toString() !== req.userId.toString());

    if (remainingMembers.length < 3) return next(new ErrorHandler("Group Must Have At Least 3 Members", 404));

    if (chat.creator.toString() === req.userId.toString()) {
        const randomMember = Math.floor(Math.random() * remainingMembers.length)
        chat.creator = remainingMembers[randomMember];
    }

    chat.members = remainingMembers;

    const user = await User.findById(req.userId, "name");

    await chat.save();

    emitEvent(req, ALERT, chat.members, `user ${user.name} has left the group`);

    sendResponse(res, 200, { message: "Leave Group Successfully" });

});

const sendAttachments = TryCatch(async (req, res, next) => {

    const { chatId } = req.body;
    const chat = await Chat.findById(chatId);
    const user = await User.findById(req.userId, "name");
    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

    const files = req.files || [];

    const attachments = await uploadFilesToCloudinary(files);

    const messageDb = {
        content: "",
        attachments,
        sender: user._id,
        chat: chatId
    }

    const message = await Message.create(messageDb);

    const realTimeMessage = {
        ...messageDb,
        sender: {
            _id: user._id,
            name: user.name
        }
    }

    emitEvent(req, NEW_MESSAGE, chat.members, { message: realTimeMessage, chatId })

    sendResponse(res, 200, { message })
});

const getChatDetails = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    if (req.query.populate === "true") {
        const chat = await Chat.findById(id).populate("members", "name avatar").lean();
        if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

        chat.members = chat.members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url
        }));

        sendResponse(res, 200, { chat })
    } else {
        const chat = await Chat.findById(id);
        if (!chat) return next(new ErrorHandler("Chat Not Found", 404));
        sendResponse(res, 200, { chat })
    }
});

const renameGroup = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

    if (chat.creator.toString() !== req.userId.toString()) return next(new ErrorHandler("Only Group Admin Can Rename Group", 403));

    chat.name = name;

    await chat.save();

    emitEvent(req, REFETCH_CHAT, chat.members);

    sendResponse(res, 200, { message: "Group Rename Successfully" });
})

const deleteChat = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

    if (chat.groupChat && chat.creator.toString() !== req.userId.toString()) return next(new ErrorHandler("Only Group Admin Has Access", 403));

    if (!chat.groupChat && !chat.members.includes(req.userId)) return next(new ErrorHandler("Only Group Admin Has Access", 403));

    const messagesWithAttachments = await Message.find({ chat: id, attachements: { $ne: [] } });

    const public_ids = [];

    messagesWithAttachments.forEach(({ attachments }) => {
        attachments.forEach(({ public_id }) => {
            public_ids.push(public_id);
        })
    })

    await Promise.all([
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({ chat: id })
    ])

    emitEvent(req, REFETCH_CHAT, chat.members);
    sendResponse(res, 200, { message: "Chat Deleted Successfully" })

});

const getMessages = TryCatch(async (req, res, next) => {

    const { id } = req.params;
    const { page } = req.query;

    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

    if (!chat.members.includes(req.userId)) return next(new ErrorHandler("You are not a member of the group", 400));

    const resultPerPage = 20;
    const skip = (page - 1) * resultPerPage;

    const [messages, totalMessages] = await Promise.all([
        Message.find({ chat: id }).sort({ createdAt: -1 }).skip(skip).limit(resultPerPage).populate("sender", "name").lean(),
        Message.countDocuments({ chat: id })
    ])

    const totalPages = Math.ceil(totalMessages / resultPerPage);

    sendResponse(res, 200, {
        messages: messages.reverse(),
        totalPages,
    })
});

export {
    addMembers, createGroup, deleteChat, getChatDetails, getMessages, getMyChats,
    getMyGroups, leaveGroup, removeMember, renameGroup, sendAttachments
};
