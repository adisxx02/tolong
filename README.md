# Tambakaji Pharmacy Hub

This project consists of a frontend built with React/Vite and a backend built with Node.js/Express.

## Project Structure

- `/frontend` - React/Vite frontend application
- `/backend` - Node.js/Express backend API

## Setup & Running

### Quick Start for Windows Users

Double-click the `start-all.bat` file in the root directory to start both backend and frontend servers in separate windows.

### Option 1: Run Both Services Concurrently

1. Make sure both frontend and backend dependencies are installed:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Start both servers concurrently from the frontend directory:
   ```
   cd frontend
   npm run dev:all
   ```
   The backend will run on http://localhost:5000 and the frontend on http://localhost:8080

### Option 2: Run Services Separately

#### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm run dev
   ```
   The backend will run on http://localhost:5000

   For Windows users, you can also double-click the `start.bat` file in the backend directory.

#### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```
   The frontend will run on http://localhost:8080

## Database

The application uses MongoDB Atlas for data storage. The connection string is configured in the backend's `.env` file.

## API Proxy

The frontend proxies all `/api` requests to the backend server, so you don't need to worry about CORS issues during development.

## Windows Users

For Windows users who experience issues with the concurrently script, you can run both servers in separate terminal windows:

1. In the first terminal window:
   ```
   cd backend
   npm run dev
   ```

2. In the second terminal window:
   ```
   cd frontend
   npm run dev
   ``` 