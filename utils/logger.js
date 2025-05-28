const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, ...args) {
    const timestamp = this.getTimestamp();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  writeToFile(level, formattedMessage) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);
    
    try {
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, ...args) {
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // Always log to console
    switch (level.toLowerCase()) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.log(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }

    // Write to file
    this.writeToFile(level, formattedMessage);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  success(message, ...args) {
    this.log('success', message, ...args);
  }

  // Method to log HTTP requests
  request(method, path, ip, statusCode = null) {
    const message = statusCode 
      ? `${method} ${path} - ${ip} - Status: ${statusCode}`
      : `${method} ${path} - ${ip}`;
    this.info(message);
  }

  // Method to log authentication attempts
  auth(action, ip, success = true, details = '') {
    const level = success ? 'info' : 'warn';
    const status = success ? 'SUCCESS' : 'FAILED';
    this.log(level, `AUTH ${action} - ${ip} - ${status}`, details);
  }

  // Method to log database operations
  database(operation, collection, details = '') {
    this.info(`DB ${operation.toUpperCase()} - ${collection}`, details);
  }
}

// Create and export a singleton instance
const logger = new Logger();
module.exports = logger;
