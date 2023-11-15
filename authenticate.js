const bcrypt = require('bcrypt');
const authenticateAdmin = (req, res, next) => {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid credentials.' });
    }
  
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii').split(':');
  
    if (credentials[0] === process.env.ADMIN_USERNAME && bcrypt.compareSync(credentials[1], process.env.ADMIN_PASSWORD)) {
      next(); 
    } else {
      res.status(401).json({ error: 'Unauthorized - Invalid credentials.' });
    }
  };