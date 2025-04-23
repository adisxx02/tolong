# Tambakaji Pharmacy Hub

A comprehensive pharmacy management system with inventory tracking, order management, and user authentication.

## Project Overview

Tambakaji Pharmacy Hub is a full-stack web application designed to manage pharmacy operations efficiently. It consists of a React frontend and Node.js backend with MongoDB as the database.

### Features

- **Medicine Management**: Add, update, delete and track medicine inventory
- **Order Processing**: Create, manage and fulfill customer orders
- **User Authentication**: Secure login and role-based access control
- **Reports & Analytics**: Generate reports on sales and inventory
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS & shadcn/ui for styling
- React Router for navigation
- React Query for data fetching
- PDF generation for reports

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- RESTful API architecture

## Local Development Setup

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- Git

### Setting Up the Backend

1. Clone the repository:
```bash
git clone <repository-url>
cd tolong/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file based on .env.example:
```bash
cp .env.example .env
```

4. Update the .env file with your MongoDB URI and JWT secret.

5. Start the development server:
```bash
npm run dev
```

### Setting Up the Frontend

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file based on .env.example:
```bash
cp .env.example .env
```

4. Update the .env file with your backend API URL.

5. Start the development server:
```bash
npm run dev
```

6. To run both frontend and backend concurrently:
```bash
npm run dev:all
```

## Deployment Instructions

### Backend Deployment on Railway

1. Create a Railway account at [railway.app](https://railway.app)

2. Install Railway CLI:
```bash
npm i -g @railway/cli
```

3. Login to Railway:
```bash
railway login
```

4. Initialize a new Railway project in the backend directory:
```bash
cd backend
railway init
```

5. Provision a MongoDB database:
```bash
railway add
```
Select MongoDB from the options.

6. Add environment variables to your Railway project:
```bash
railway variables set MONGO_URI=<your-mongodb-uri> JWT_SECRET=<your-jwt-secret> CORS_ORIGIN=<your-frontend-url>
```

7. Deploy the backend:
```bash
railway up
```

8. Once deployed, get your backend URL:
```bash
railway domain
```

### Frontend Deployment on Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)

2. Install Vercel CLI:
```bash
npm i -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Navigate to the frontend directory and deploy:
```bash
cd ../frontend
vercel
```

5. During the deployment process, Vercel will prompt you to configure project settings.

6. Set the environment variable for your backend API:
```bash
vercel env add VITE_API_URL
```
Enter your Railway backend URL with '/api' at the end.

7. Re-deploy with the environment variables:
```bash
vercel --prod
```

## Project Structure

```
/backend
  /config       # Database configuration
  /controllers  # Request handlers
  /middleware   # Express middleware
  /models       # MongoDB models
  /routes       # API routes
  server.js     # Entry point

/frontend
  /public       # Static files
  /src
    /components # UI components
    /contexts   # React contexts
    /hooks      # Custom hooks
    /layouts    # Page layouts
    /lib        # Utilities and API
    /pages      # Application pages
    /utils      # Helper functions
    main.tsx    # Entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

