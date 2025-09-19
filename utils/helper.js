import { usersSocketIds } from "../constants/socket.js";

const sendResponse = (res, statusCode, data)=>{
    return res.status(statusCode).json({
        success: true,
        ...data
    });
};

const getSocketMembers = (members)=> {
    return members.map((member) => usersSocketIds.get(member.toString()));
}


export {
    sendResponse,
    getSocketMembers
}