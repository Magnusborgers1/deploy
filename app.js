require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateAdmin = require('./authenticate');  
const participantsRoutes = require('./routes/participants');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE_NAME;

// Middleware for authentication
app.use('/participants', authenticateAdmin); 

// Import and use participantsRoutes
app.use('/participants', participantsRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
