import express from "express";
import { addMembers, createGroup, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, removeMember, renameGroup, sendAttachments } from "../controllers/chat.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { multipleUpload } from "../middlewares/multer.js";
import { validateAddMembersReq, validateChatIdReq, validateCreateGroupReq, validateRemoveMemberReq, validateRenameGroupReq, validateSendAttachmentsReq } from "../middlewares/validator.js";

const app = express.Router();

app.use(isAuthenticated);

app.post("/new", validateCreateGroupReq,createGroup);
app.get("/my", getMyChats);
app.get("/my/groups", getMyGroups);
app.put("/add-members", validateAddMembersReq,addMembers);
app.delete("/remove-member", validateRemoveMemberReq,removeMember);
app.delete("/leave/:id", validateChatIdReq,leaveGroup);
app.post("/message", multipleUpload, validateSendAttachmentsReq,sendAttachments);
app.get("/message/:id", validateChatIdReq,getMessages);
app.route("/:id").get(validateChatIdReq,getChatDetails).put(validateRenameGroupReq,renameGroup).delete(validateChatIdReq,deleteChat);

export default app;