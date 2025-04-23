# Tambakaji Pharmacy Hub Setup Guide

This application consists of a frontend (React) and a backend (Node.js/Express). To make it work properly, you need to run both parts.

## Prerequisites

- Node.js installed
- MongoDB Atlas account (or MongoDB installed and running locally)

## Setup

1. **Configure MongoDB Connection**

   Edit the `.env` file in the `server` directory to point to your MongoDB instance:

   ```
   MONGO_URI=mongodb+srv://admin:admin@farmasitaji.hrxqmpf.mongodb.net/tambakaji-pharmacy
   JWT_SECRET=tambakaji-secret-key
   PORT=5000
   ```

   If you're using a local MongoDB instance, you can replace the connection string with:
   ```
   MONGO_URI=mongodb://localhost:27017/tambakaji-pharmacy
   ```

2. **Start the Backend Server**

   Open a terminal/command prompt and run:

   ```
   cd server
   node server.js
   ```

   Alternatively, on Windows, you can double-click the `start.bat` file in the server directory.

   You should see messages:
   - "Server running on port 5000"
   - "MongoDB connected successfully"

3. **Start the Frontend**

   Open a new terminal/command prompt and run:

   ```
   npm run dev
   ```

   This will start the frontend application on port 8080.

4. **Access the Application**

   Open your web browser and go to:
   ```
   http://localhost:8080
   ```

## Troubleshooting

If you're having issues saving data:

1. **Make sure both servers are running** - You need both the backend (port 5000) and frontend (port 8080) running at the same time.

2. **Check MongoDB connection** - Verify that MongoDB is running and the connection string in `.env` is correct.

3. **Check browser console for errors** - Open your browser's developer tools (F12) and look for any errors in the console.

4. **API errors** - If you see 404 or 500 errors, it typically means the backend server isn't running or there's an issue with your MongoDB connection.

## Running in Production

For production, you should build the frontend:

```
npm run build
```

This will create optimized files in the `dist` directory that can be served by a web server. 