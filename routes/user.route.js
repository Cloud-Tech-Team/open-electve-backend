const app = require("express").Router();
const User = require("../models/user.model");
const logger = require("../utils/logger");

app.post("/register", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  logger.request('POST', '/register', clientIP);
  logger.debug('Registration attempt with data:', req.body);
  
  try {
    const { name, email, registerId } = req.body;
    logger.info(`Registration attempt for email: ${email}, registerId: ${registerId}`);
    
    const existingUser = await User.findOne({ email: email });
    logger.database('READ', 'users', `Checking existence for email: ${email}`);
    
    if (existingUser) {
      logger.warn(`Registration failed - User already exists: ${email}`);
      logger.request('POST', '/register', clientIP, 412);
      res.sendStatus(412); // Precondition Failed - user already exists
      return;
    }
    
    logger.info(`Proceeding with user registration for: ${email}`);
    await userReg(name, email, registerId, res, clientIP);
  } catch (err) {
    logger.error('Error in user registration:', err);
    logger.request('POST', '/register', clientIP, 400);
    res.status(400).send(err);
  }
});

async function userReg(name, email, registerId, res, clientIP) {
  const department = email.substring(2, 4);
  logger.info(`Creating user with department: ${department} (extracted from email)`);
  
  const user = new User({
    name: name,
    email: email,
    registerId: registerId,
    department: department,
    optedCourse: null,
  });
  
  try {
    const savedUser = await user.save();
    logger.success(`User registered successfully: ${savedUser.email} (${savedUser.name})`);
    logger.database('CREATE', 'users', `${savedUser.email}`);
    logger.request('POST', '/register', clientIP, 200);
    res.status(200).send(savedUser); // Correctly send a 200 status and the saved user object
  } catch (err) {
    logger.error('Failed to save user to database:', err);
    logger.request('POST', '/register', clientIP, 400);
    res.status(400).send(err);
  }
}

module.exports = app;
