const express = require('express');
const app = express();
const connectToDB = require('../db/db');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('../routes/auth.routes');
const interviewRouter = require('../routes/interview.routes');


app.use(
  cors({
    origin(origin, callback) {
      const isLocalOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
      const isDeployedFrontend = origin === "https://resumind-ai-frontend.onrender.com";

      if (!origin || isLocalOrigin || isDeployedFrontend) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

connectToDB();

app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRouter);

module.exports = app;