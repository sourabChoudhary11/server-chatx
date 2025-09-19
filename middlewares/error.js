import { nodeENV } from "../constants/env.js";

const TryCatch = (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (err) {
        next(err);
    }
}

const errorMiddeware = (err, req, res, next) => {
    err.statusCode ||= 500;

    err.message ||= "Internal Server Error";

    if (err.code === 11000) {
        const error = Object.keys(err.keyPattern).join(", ");
        err.message = `${error} is already in use`;
        err.statusCode = 400;
    }

    if (err.name === "CastError") {
        err.message = `Invalid format of ${err.path}`;
        err.statusCode = 400;
    }

    res.status(err.statusCode).json({
        status: false,
        message: err.message
    })
}

export {
    errorMiddeware, TryCatch
};
