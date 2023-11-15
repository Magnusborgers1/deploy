const express = require('express');
const router = express.Router();
const { dynamoDB, tableName } = require('../db');
const authenticateAdmin = require('../authenticate');

// Endpoint to add participant
router.post('/add', (req, res) => {
  const participantData = req.body;
  const { email, firstname, lastname, dob, active, work, home } = participantData;

  if (!email || !firstname || !lastname || !dob || !active || !work || !home) {
    return res.status(400).json({ error: 'Incomplete participant data. All fields are required.' });
  }

  const params = {
    TableName: tableName,
    Item: participantData,
  };

  dynamoDB.put(params, (error) => {
    if (error) {
      console.error('Error inserting participant into the database:', error);
      return res.status(500).json({ error: 'Failed to insert participant into the database.' });
    }

    res.json({ message: 'Participant added successfully' });
  });
});

// Endpoint to get all participants
router.get('/', (req, res) => {
  const params = {
    TableName: tableName,
  };

  dynamoDB.scan(params, (error, data) => {
    if (error) {
      console.error('Error fetching participants from the database:', error);
      return res.status(500).json({ error: 'Failed to fetch participants from the database.' });
    }

    const participants = data.Items || [];
    res.json({ participants });
  });
});



module.exports = router;
