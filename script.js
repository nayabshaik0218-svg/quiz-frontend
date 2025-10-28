const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // 🚨 Required for the CSP fix
require('dotenv').config(); 

const app = express();

// --- Configuration Variables ---
// ⚠️ IMPORTANT: Ensure 3000 is your correct port
const PORT = process.env.PORT || 3000;

// 1. Define the specific frontend URLs (origins) you want to allow.
const allowedOrigins = [
    // Your deployed Vercel frontends
    'https://quiz-frontend-amber-nu.vercel.app', 
    'https://quiz-frontend-je9pf40rp-nayabshaik0218-svgs-projects.vercel.app',
    'https://quiz-frontend-owct8ed66-nayabshaik0218-svgs-projects.vercel.app',
    
    // Your local development environments
    'http://localhost:3001', 
    'http://localhost:5173', 
    'http://localhost:3000' 
];

// --- 🔒 Content Security Policy (CSP) Fix via Helmet ---
// This is the workaround to allow your frontend's string evaluation (unsafe-eval).
// NOTE: This should be removed once you successfully refactor your frontend code!
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // CRITICAL LINE: Allows execution of code from strings in the browser
      scriptSrc: ["'self'", "'unsafe-eval'"], 
      // Allows styles to be embedded in HTML (common in development)
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Allows connection back to your specific backend URL
      connectSrc: ["'self'", "https://quiz-backend-git-main-nayabshaik0218-svgs-projects.vercel.app"],
      imgSrc: ["'self'", "data:"],
    },
  })
);


// --- CORS Configuration (Fixes Access-Control issue) ---
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., Postman, server-to-server)
        if (!origin) return callback(null, true); 
        
        // Check if the origin is in our allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        
        return callback(null, true);
    },
    
    // Allows all common methods
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    
    // CRITICAL for sending cookies/authentication headers
    credentials: true,
    
    // Status for a successful OPTIONS preflight request
    optionsSuccessStatus: 204 
};

// Apply the configured CORS middleware globally to ALL routes
app.use(cors(corsOptions));


// --- General Middleware ---
app.use(express.json()); // To parse incoming JSON requests
// If you use form data, you may need app.use(express.urlencoded({ extended: true }));


// --- Database Connection (Add your database setup code here) ---
// Example: require('./config/db');


// --- Routes ---

// The main questions route your frontend fetches from
app.get('/api/questions', (req, res) => {
    
    // Send back some dummy data (or actual data from your database)
    res.json([
        {
            topic: "Placeholder",
            question: "Did the backend CORS and CSP issue get fixed?",
            choices: ["Yes", "No", "Maybe", "I hope so"],
            answer: "Yes",
        },
        {
            topic: "Networking",
            question: "Which code fixed the PathError?",
            choices: ["The Helmet middleware", "The updated CORS config", "The frontend script.js fix", "All of the above"],
            answer: "All of the above",
        }
    ]);
});

// Add your other routes (login, register, etc.) here...


// --- Server Listener ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Allowed frontend origins:', allowedOrigins);
});
