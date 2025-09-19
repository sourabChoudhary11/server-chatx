import dns from "dns";
import { ErrorHandler } from "../utils/utility.js";

const validateEmail = (email, next)=>{
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return next(new ErrorHandler("Invalid Email", 400));
    dns.resolveMx(email.split("@")[1], (err, addrs) => {
        if (err || !addrs.length) {
            return next(new ErrorHandler("Email Domain Not Valid"), 400);
        }
        next();
    });
}
export const validateRegisterReq = (req, res, next) => {
    let errors = [];
    const { name,email,password,bio } = req.body;
    if(!name) errors.push("name");
    if(!email) errors.push("email");
    if(!password) errors.push("password");
    if(!bio) errors.push("bio");
    if(!req.file) errors.push("avatar");

    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`,400));
    validateEmail(email,next)
};

export const validateLoginReq = (req, res, next) => {
    let errors = [];
    const { email,password } = req.body;
    if(!email) errors.push("email");
    if(!password) errors.push("password");

    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);
    next();
};

export const validateCreateGroupReq = (req, res, next) => {
    let errors = [];
    const { name,members } = req.body;
    if(!name) errors.push("name");
    if(!members) errors.push("members");
    
    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);

    if((typeof members) === "string" || (members.length<2 || members.length>100)) return next(new ErrorHandler("Members Must Be 2-100"), 400);

    next();
};

export const validateAddMembersReq = (req, res, next) => {
    let errors = [];
    const { chatId,members } = req.body;
    if(!chatId) errors.push("chatId");
    if(!members) errors.push("members");
    
    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);

    if((typeof members) === "string" || (members.length<1 || members.length>97)) return next(new ErrorHandler("Members Must Be 1-97"), 400);

    next();
};

export const validateRemoveMemberReq = (req, res, next) => {
    let errors = [];
    const { chatId, userId } = req.body;
    if(!chatId) errors.push("chatId");
    if(!userId) errors.push("userId");
    
    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);

    next();
};

export const validateChatIdReq = (req, res, next) => {
    if(!req.params.id) return next(new ErrorHandler("provide chatId"), 400);
    next();
};

export const validateSendAttachmentsReq = (req, res, next) => {
    let errors = [];
    if(!req.body.chatId) errors.push("chatId");
    const files = req.files;
    if(files.length<1) errors.push("attachment");

    if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);

    if(files.length>5) return next(new ErrorHandler("Attachments Must Be 1-5"), 400);
    next();
};

export const validateRenameGroupReq = (req, res, next) => {
    let errors = [];
    if(!req.params.id) errors.push("chatId");
    if(!req.body.name) errors.push("name");

     if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);
    next();
};

export const validateSendRequestReq = (req, res, next) => {
    if(!req.body.receiverId) return next(new ErrorHandler("provide receiverId"), 400);
    next();
};

export const validateAcceptRequestReq = (req, res, next) => {
     let errors = [];
     const {requestId, accept} = req.body;
    if(!requestId) errors.push("requestId");
    if(typeof accept==="undefined") errors.push("accept");

     if(errors.length>0) return next(new ErrorHandler(`provide ${errors.join(", ")}`), 400);

     if((typeof accept) !== "boolean") return next(new ErrorHandler("Accept Must Be Boolean"), 400);
    
    next();
};

export const validateAdminLoginReq = (req, res, next) => {
    if(!req.body.secretKey) return next(new ErrorHandler("provide secret key"), 400);
    next();
};






