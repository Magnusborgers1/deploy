const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const participantsRoutes = require('./routes/participants');
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
app.use(bodyParser.json());
app.use('/participants', authenticateAdmin);
app.use('/participants', participantsRoutes);

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE_NAME;



  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });