const port = process.env.PORT;
const mongoURI = process.env.MONGO_URI;
const adminSecretKey = process.env.ADMIN_SECRET_KEY;
const jwtSecret = process.env.JWT_SECRET;
const nodeENV = process.env.NODE_ENV;
const clientURL = process.env.CLIENT_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const apiKey = process.env.CLOUDINARY_API_KEY;

export {
    nodeENV,
    port,
    mongoURI,
    adminSecretKey, 
    jwtSecret,
    clientURL,
    cloudName,
    apiSecret,
    apiKey
}