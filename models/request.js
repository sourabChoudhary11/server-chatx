import mongoose, { Types } from "mongoose";

const { models, model, Schema } = mongoose;

const schema = new Schema({
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected"]
    },
    sender: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true
})

export const Request = models.Request || model("Request", schema);
