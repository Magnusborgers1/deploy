const bcrypt = require('bcrypt');

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid credentials.' });
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii').split(':');

  let test1 = credentials[0] === 'admin' ;
  let test2 = bcrypt.compareSync(credentials[1], 'P4ssword');

//   const saltRounds = 10;
//   var password = "P4ssword";
  
//   bcrypt.genSalt(saltRounds, function(err, salt) {
//     bcrypt.hash(password, salt, function(err, hash) {
//               // Store hash in database here
//               console.log(hash);
//      });
//   });
  

//   bcrypt.hash('P4ssword', '', function(err, hash) {
//     // returns hash
//     console.log(hash);
//   });
  if (credentials[0] === 'admin' && bcrypt.compareSync(credentials[1], '$2b$10$onLEZMCYav1i8/9M//T4puCtaUOj4gJAZMkbb6rXzOJx5E2INmMD.')) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Invalid credentials.' });
  }
};

module.exports = authenticateAdmin;