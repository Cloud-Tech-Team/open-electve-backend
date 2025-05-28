const app = require("express").Router();
const Course = require("../models/course.model");
const path = require('path');
const User = require("../models/user.model");
const logger = require("../utils/logger");

// Serve static files from exports directory
app.use('/exports', require('express').static(path.join(__dirname, '../public/exports')));

app.post("/create", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  logger.request('POST', '/admin/create', clientIP);
  
  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth('ADMIN_ACCESS', clientIP, false, 'Invalid secret key');
    return res.status(401).send("Unauthorized");
  }

  logger.auth('ADMIN_ACCESS', clientIP, true, 'Course creation endpoint');

  try {
    // Check if request body is an array (bulk creation) or single object
    const isArray = Array.isArray(req.body);
    const courses = isArray ? req.body : [req.body];
    
    logger.info(`Processing ${courses.length} course(s) - Bulk operation: ${isArray}`);
    
    const results = [];
    const errors = [];

    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      
      logger.debug(`Processing course ${i + 1}/${courses.length}:`, courseData.courseCode);
      
      try {
        // Check if course already exists
        const existingCourse = await Course.findOne({
          courseCode: courseData.courseCode,
        });
        
        if (existingCourse) {
          logger.warn(`Course already exists: ${courseData.courseCode}`);
          errors.push({
            index: i,
            courseCode: courseData.courseCode,
            error: "Course already exists"
          });
          continue;
        }

        // Create and save new course
        const course = new Course(courseData);
        const savedCourse = await course.save();
        logger.success(`Course created: ${savedCourse.courseCode} (${savedCourse.courseName})`);
        logger.database('CREATE', 'courses', `${savedCourse.courseCode}`);
        
        results.push({
          index: i,
          courseCode: savedCourse.courseCode,
          status: "created"
        });
        
      } catch (courseError) {
        logger.error(`Failed to create course ${courseData.courseCode || 'unknown'}:`, courseError.message);
        errors.push({
          index: i,
          courseCode: courseData.courseCode || "unknown",
          error: courseError.message
        });
      }
    }

    // Log final results
    logger.info(`Course creation completed - Success: ${results.length}, Errors: ${errors.length}`);

    // Return appropriate response
    if (errors.length === 0) {
      logger.success(`All ${results.length} courses created successfully`);
      logger.request('POST', '/admin/create', clientIP, 200);
      return res.status(200).json({
        message: isArray ? `${results.length} courses created successfully` : "Course created successfully",
        created: results
      });
    } else if (results.length === 0) {
      logger.warn('No courses were created - All operations failed');
      logger.request('POST', '/admin/create', clientIP, 400);
      return res.status(400).json({
        message: "No courses were created",
        errors: errors
      });
    } else {
      logger.warn(`Partial success - ${results.length} created, ${errors.length} failed`);
      logger.request('POST', '/admin/create', clientIP, 207);
      return res.status(207).json({
        message: `${results.length} courses created, ${errors.length} failed`,
        created: results,
        errors: errors
      });
    }

  } catch (error) {
    logger.error('Critical error in course creation:', error);
    logger.request('POST', '/admin/create', clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/users", async (req, res) => {
    const clientIP = req.ip;
    
    logger.request('GET', '/admin/users', clientIP);
    
    if (req.headers.authorization !== process.env.SECRETKEY) {
        logger.auth('ADMIN_ACCESS', clientIP, false, 'Invalid secret key for users endpoint');
        return res.status(401).send("Unauthorized");
    }
    
    logger.auth('ADMIN_ACCESS', clientIP, true, 'Users data access');
    
    try {
        const users = await User.find({});
        logger.info(`Retrieved ${users.length} users from database`);
        logger.database('READ', 'users', `Count: ${users.length}`);
        
        if (users.length === 0) {
            logger.warn('No users found in the database');
            logger.request('GET', '/admin/users', clientIP, 200);
            return res.status(200).send(`
            <tr>
                <td colspan="6" class="border px-4 py-2 text-center">--</td>
            </tr>
            `);
        }

        // Format users data as HTML table rows for htmx
        const tableRows = users.map(user => `
            <tr>
                <td class="border px-4 py-2">${user._id}</td>
                <td class="border px-4 py-2">${user.name}</td>
                <td class="border px-4 py-2">${user.email}</td>
                <td class="border px-4 py-2">${user.registerId}</td>
                <td class="border px-4 py-2">${user.department || 'N/A'}</td>
                <td class="border px-4 py-2">${user.optedCourse || 'N/A'}</td>
            </tr>
        `).join('');
        
        logger.success('Users data formatted and sent successfully');
        logger.request('GET', '/admin/users', clientIP, 200);
        return res.status(200).send(tableRows);
    } catch (error) {
        logger.error('Error fetching users:', error);
        logger.request('GET', '/admin/users', clientIP, 500);
        return res.status(500).send("Internal Server Error");
    }
});


app.post("/users/csv", async (req, res) => {
    const clientIP = req.ip;
    
    logger.request('POST', '/admin/users/csv', clientIP);
    
    if (req.headers.authorization !== process.env.SECRETKEY) {
        logger.auth('ADMIN_ACCESS', clientIP, false, 'Invalid secret key for users CSV endpoint');
        return res.status(401).send("Unauthorized");
    }
    
    logger.auth('ADMIN_ACCESS', clientIP, true, 'Users CSV data access');
    
    try {
        const users = await User.find({});
        logger.info(`Retrieved ${users.length} users from database`);
        logger.database('READ', 'users', `Count: ${users.length}`);
        
        if (users.length === 0) {
            logger.warn('No users found in the database');
            logger.request('POST', '/admin/users/csv', clientIP, 200);
            return res.status(200).send('<button class="px-4 py-2 bg-gray-200 text-gray-600">No users to export</button>');
        }

        // Generate unique filename with timestamp
        const filename = `users_${Date.now()}.csv`;
        const filePath = path.join(__dirname, '../public/exports', filename);

        // Ensure exports directory exists
        const dir = path.dirname(filePath);
        if (!require('fs').existsSync(dir)) {
            require('fs').mkdirSync(dir, { recursive: true });
        }

        // Create CSV content
        const headers = ['ID', 'Name', 'Email', 'Register ID', 'Department', 'Opted Course'];
        const csvHeader = headers.join(',') + '\n';
        
        const csvRows = users.map(user => {
            return [
                user._id,
                `"${user.name}"`,
                `"${user.email}"`,
                `"${user.registerId}"`,
                `"${user.department || 'N/A'}"`,
                `"${user.optedCourse || 'N/A'}"`
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;

        // Write users data to CSV file
        require('fs').writeFileSync(filePath, csvContent);
        
        // Generate download link as a button
        const downloadButton = `
            <a href="/admin/exports/${filename}" download>
                <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Download Users Data (CSV)
                </button>
            </a>
        `;
        
        logger.success('Users data exported to CSV file successfully');
        logger.request('POST', '/admin/users/csv', clientIP, 200);
        return res.status(200).send(downloadButton);
    } catch (error) {
        logger.error('Error exporting users:', error);
        logger.request('POST', '/admin/users/csv', clientIP, 500);
        return res.status(500).send('<button class="px-4 py-2 bg-red-500 text-white">Export Failed</button>');
    }
});

app.get("/", (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    logger.request('GET', '/admin/', clientIP);
    logger.info('Serving admin dashboard');
    
    try {
        res.sendFile(path.join(__dirname, '../index.html'));
        logger.success('Admin dashboard served successfully');
        logger.request('GET', '/admin/', clientIP, 200);
    } catch (error) {
        logger.error('Error serving admin dashboard:', error);
        logger.request('GET', '/admin/', clientIP, 500);
        res.status(500).send("Error loading admin dashboard");
    }
});

module.exports = app;