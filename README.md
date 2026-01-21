# ChatX — Real-Time Chat Application (Server)

This is the **backend server** for ChatX, a real-time chat application built with **Node.js, Express, and Socket.IO**.

The server handles:
✅ Real-time communication  
✅ Socket events for messaging  
✅ Connected clients and message flow

---

## 🚀 Features

- Real-time messaging with **Socket.IO**
- Express server
- Room & client connection handling
- Simple and scalable architecture

---

## 🧠 Tech Stack

**Backend:**  
Node, Express, MongoDB, Socket.IO, cloudinary

---

## 📦 Installation (Local Setup)

1. Clone this repository
 
git clone https://github.com/sourabChoudhary11/server-chatx.git


2. Install dependencies

cd server-chatx
npm install


3. Setup environment variables

Create a .env file with:

PORT = 5000
MONGO_URI = your_mongo_uri
ADMIN_SECRET_KEY = your_admin_secret_key
CLIENT_URL = your_client_url
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME = your_cloudinary_cloud_name
JWT_SECRET = your_jwt_secret


4. Start the server

npm run start

Your backend server should now be running at:

http://localhost:5000


