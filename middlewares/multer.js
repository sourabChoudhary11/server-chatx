import multer from "multer";

const upload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5 
    }
});

const singleUpload =(fieldName)=> upload.single(fieldName);

const multipleUpload = upload.array("file", 5);

export {
    singleUpload,
    multipleUpload
}