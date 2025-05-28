const app = require("express").Router();
const AdminSettings = require("../models/admin-settings.model");
const logger = require("../utils/logger");

// Get allowed status - public endpoint
app.get("/allowed", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  logger.request("GET", "/allowed", clientIP);

  try {
    const settings = await AdminSettings.getSettings();
    const currentTime = new Date();
    const allowedTime = new Date(settings.allowedDateTime);
    
    const isAllowed = settings.isEnabled && currentTime >= allowedTime;
    
    logger.info(`Access check - Current: ${currentTime.toISOString()}, Allowed: ${allowedTime.toISOString()}, Result: ${isAllowed}`);
    logger.request("GET", "/allowed", clientIP, 200);
      res.json({
      allowed: isAllowed,
      currentTime: currentTime.toISOString(),
      allowedDateTime: allowedTime.toISOString(),
      isEnabled: settings.isEnabled
    });
  } catch (error) {
    logger.error("Error checking allowed status:", error);
    logger.request("GET", "/allowed", clientIP, 500);    res.status(500).json({
      allowed: false,
      error: "Internal server error"
    });
  }
});

module.exports = app;
