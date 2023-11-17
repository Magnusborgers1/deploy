const express = require('express');
const router = express.Router();
// const { dynamoDB, tableName } = require('../db');
const authenticateAdmin = require('../authenticate');
const CyclicDB = require('@cyclic.sh/dynamodb');
const db = CyclicDB(process.env.CYCLIC_DB);
let participants = db.collection('participants');

// Endpoint to add participant
router.post('/add', async (req, res) => {
  console.log('Entered participants/add post call');
  const participantData = req.body;
  const { email, firstname, lastname, dob, active, work, home } = participantData;
let list = await participants.list();
  if (!email || !firstname || !lastname || !dob || !active || !work || !home) {
    return res.status(400).json({ error: 'Incomplete participant data. All fields are required.' });
  }

  await participants.set(email, {
    firstName: firstname,
    secondName: lastname,
    dob: dob
  });
  return res.end();

  dynamoDB.put(params, (error) => {
    if (error) {
      console.error('Error inserting participant into the database:', error);
      return res.status(500).json({ error: 'Failed to insert participant into the database.' });
    }

    return res.json({ message: 'Participant added successfully' });
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


// Endpoint to delete participant by email
router.delete('/:email', authenticateAdmin, (req, res) => {
  const emailToDelete = req.params.email;

  // Validate email
  if (!validateEmail(emailToDelete)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  const params = {
    TableName: tableName,
    Key: {
      email: emailToDelete,
    },
  };

  dynamoDB.delete(params, (error) => {
    if (error) {
      console.error('Error deleting participant from the database:', error);
      return res.status(500).json({ error: 'Failed to delete participant from the database.' });
    }

    res.json({ message: 'Participant deleted successfully' });
  });
});


router.put('/:email', authenticateAdmin, (req, res) => {
  const emailToUpdate = req.params.email;
  const updatedParticipantData = req.body;

  // Validate email format (kanskje forbedre?)
  if (!validateEmail(emailToUpdate)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  const params = {
    TableName: tableName,
    Key: {
      email: emailToUpdate,
    },
    UpdateExpression: 'SET firstname = :firstname, lastname = :lastname, dob = :dob, active = :active, work = :work, home = :home',
    ExpressionAttributeValues: {
      ':firstname': updatedParticipantData.firstname,
      ':lastname': updatedParticipantData.lastname,
      ':dob': updatedParticipantData.dob,
      ':active': updatedParticipantData.active,
      ':work': updatedParticipantData.work,
      ':home': updatedParticipantData.home,
    },
    ReturnValues: 'ALL_NEW',
  };

  dynamoDB.update(params, (error, data) => {
    if (error) {
      console.error('Error updating participant in the database:', error);
      return res.status(500).json({ error: 'Failed to update participant in the database.' });
    }

    res.json({ message: 'Participant updated successfully', updatedParticipant: data.Attributes });
  });
});


// Function to validate email format (kanskje forbedre?)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



console.log('added participant router');
module.exports = router;
