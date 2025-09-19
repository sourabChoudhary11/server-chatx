import express from "express";
import { adminLogin, adminLogout, getAdminData, getChats, getDashboardStats, getMessages, getUsers } from "../controllers/admin.js";
import { isAdmin } from "../middlewares/auth.js";
import { validateAdminLoginReq } from "../middlewares/validator.js";

const app = express.Router();


app.post("/verify", validateAdminLoginReq, adminLogin);
app.get("/logout", adminLogout);

app.use(isAdmin)

app.get("/", getAdminData)

app.get("/users", getUsers);
app.get("/chats", getChats);
app.get("/messages", getMessages)


app.get("/stats", getDashboardStats)

export default app;