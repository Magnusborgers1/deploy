const express = require('express');
const participantsRoutes = require('./participants');

const router = express.Router();

router.use('/participants', participantsRoutes);

module.exports = router;