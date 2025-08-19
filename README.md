URL Shortener Project

This is a simple URL Shortener application built with a React (Vite) frontend and a Node.js + Express backend.
The application allows users to shorten long URLs and manage them easily.

Preview of the project: Click here to view screenshot

     

Running the Project Locally
1. Clone the Repository
git clone https://github.com/Chaiudbbhd/22KD1A0548.git
cd 22KD1A0548

2. Run the Backend

Navigate to the backend folder:

cd question2_backend


Install dependencies:

npm install


Start the server:

node server.js


The backend will run on:

http://localhost:5000


You can test backend APIs in Postman:

POST → http://localhost:3001/api/shorten

GET → http://localhost:3001/api/stats

3. Run the Frontend

Open a new terminal and navigate to the frontend folder:

cd Q1_Frontend/frontend


Install dependencies:

npm install


Start the frontend:

npm run dev


The frontend will run on:

http://localhost:3000/5173

Testing

Start the backend using node server.js.

Start the frontend using npm run dev.

Open a browser at http://localhost:5173/3000.

Try entering a URL to shorten and check if the backend responds correctly.

Technologies Used

Frontend: React, Vite

Backend: Node.js, Express

Storage: Local file system (for demo purposes)
