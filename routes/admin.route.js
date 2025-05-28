const app = require("express").Router();
const Course = require("../models/course.model");
const path = require("path");
const User = require("../models/user.model");
const logger = require("../utils/logger");

function titleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Serve static files from exports directory
app.use(
  "/exports",
  require("express").static(path.join(__dirname, "../public/exports"))
);

app.post("/create", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  logger.request("POST", "/admin/create", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth("ADMIN_ACCESS", clientIP, false, "Invalid secret key");
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Course creation endpoint");

  try {
    // Check if request body is an array (bulk creation) or single object
    const isArray = Array.isArray(req.body);
    const courses = isArray ? req.body : [req.body];

    logger.info(
      `Processing ${courses.length} course(s) - Bulk operation: ${isArray}`
    );

    const results = [];
    const errors = [];

    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];

      logger.debug(
        `Processing course ${i + 1}/${courses.length}:`,
        courseData.courseCode
      );

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
            error: "Course already exists",
          });
          continue;
        }

        // Create and save new course
        const course = new Course(courseData);
        const savedCourse = await course.save();
        logger.success(
          `Course created: ${savedCourse.courseCode} (${savedCourse.courseName})`
        );
        logger.database("CREATE", "courses", `${savedCourse.courseCode}`);

        results.push({
          index: i,
          courseCode: savedCourse.courseCode,
          status: "created",
        });
      } catch (courseError) {
        logger.error(
          `Failed to create course ${courseData.courseCode || "unknown"}:`,
          courseError.message
        );
        errors.push({
          index: i,
          courseCode: courseData.courseCode || "unknown",
          error: courseError.message,
        });
      }
    } // Log final results
    logger.info(
      `Course creation completed - Success: ${results.length}, Errors: ${errors.length}`
    ); // Broadcast course count update if any courses were created
    if (results.length > 0) {
      req.broadcastCourseCount();
      if (req.broadcastCourseStatistics) {
        req.broadcastCourseStatistics();
      }
    }

    // Return appropriate response
    if (errors.length === 0) {
      logger.success(`All ${results.length} courses created successfully`);
      logger.request("POST", "/admin/create", clientIP, 200);
      return res.status(200).json({
        message: isArray
          ? `${results.length} courses created successfully`
          : "Course created successfully",
        created: results,
      });
    } else if (results.length === 0) {
      logger.warn("No courses were created - All operations failed");
      logger.request("POST", "/admin/create", clientIP, 400);
      return res.status(400).json({
        message: "No courses were created",
        errors: errors,
      });
    } else {
      logger.warn(
        `Partial success - ${results.length} created, ${errors.length} failed`
      );
      logger.request("POST", "/admin/create", clientIP, 207);
      return res.status(207).json({
        message: `${results.length} courses created, ${errors.length} failed`,
        created: results,
        errors: errors,
      });
    }
  } catch (error) {
    logger.error("Critical error in course creation:", error);
    logger.request("POST", "/admin/create", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

// Reset all data
app.post("/reset/all", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  logger.request("POST", "/admin/reset/all", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for reset endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Reset all endpoint accessed");
  try {
    await Course.deleteMany({});
    await User.deleteMany({});

    logger.success("All courses and users deleted successfully");
    logger.database("DELETE", "courses", "All courses deleted");
    logger.database("DELETE", "users", "All users deleted"); // Broadcast course count update (should be 0)
    req.broadcastCourseCount();
    if (req.broadcastCourseStatistics) {
      req.broadcastCourseStatistics();
    }

    logger.request("POST", "/admin/reset/all", clientIP, 200);
    return res
      .status(200)
      .send("All courses and users have been reset successfully.");
  } catch (error) {
    logger.error("Error during reset operation:", error);
    logger.request("POST", "/admin/reset/all", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

// Reset only courses
app.post("/reset/courses", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  logger.request("POST", "/admin/reset/courses", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for reset endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth(
    "ADMIN_ACCESS",
    clientIP,
    true,
    "Reset courses endpoint accessed"
  );
  try {
    await Course.deleteMany({});

    logger.success("All courses deleted successfully");
    logger.database("DELETE", "courses", "All courses deleted"); // Broadcast course count update (should be 0)
    req.broadcastCourseCount();
    if (req.broadcastCourseStatistics) {
      req.broadcastCourseStatistics();
    }

    logger.request("POST", "/admin/reset/courses", clientIP, 200);
    return res.status(200).send("All courses have been reset successfully.");
  } catch (error) {
    logger.error("Error during course reset operation:", error);
    logger.request("POST", "/admin/reset/courses", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

// Reset only users
app.post("/reset/users", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  logger.request("POST", "/admin/reset/users", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for reset endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Reset users endpoint accessed");

  try {
    await User.deleteMany({});
    logger.success("All users deleted successfully");
    logger.database("DELETE", "users", "All users deleted");
    logger.request("POST", "/admin/reset/users", clientIP, 200);
    return res.status(200).send("All users have been reset successfully.");
  } catch (error) {
    logger.error("Error during user reset operation:", error);
    logger.request("POST", "/admin/reset/users", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/users", async (req, res) => {
  const clientIP = req.ip;

  logger.request("GET", "/admin/users", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for users endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Users data access");

  try {
    const users = await User.find({});
    logger.database("READ", "users", `Count: ${users.length}`);

    if (users.length === 0) {
      logger.warn("No users found in the database");
      logger.request("GET", "/admin/users", clientIP, 200);
      return res.status(200).send(`
            <tr>
                <td colspan="6" class="border px-4 py-2 text-center">--</td>
            </tr>
            `);
    }

    // Format users data as HTML table rows for htmx
    const tableRows = users
      .map(
        (user) => `
            <tr>
                <td class="border px-4 py-2">${user._id}</td>
                <td class="border px-4 py-2">${titleCase(user.name)}</td>
                <td class="border px-4 py-2">${user.email}</td>
                <td class="border px-4 py-2">${(
                  user.registerId || "N/A"
                ).toUpperCase()}</td>
            <td class="border px-4 py-2">${(
              user.department || "N/A"
            ).toUpperCase()}</td>
            <td class="border px-4 py-2">${(
              user.optedCourse || "N/A"
            ).toUpperCase()}</td>
            </tr>
        `
      )
      .join("");
    console.log(users);

    // Helper function to convert string to title case

    logger.success("Users data formatted and sent successfully");
    logger.request("GET", "/admin/users", clientIP, 200);
    return res.status(200).send(tableRows);
  } catch (error) {
    console.error("Error fetching users:", error);
    logger.error("Error fetching users:", error);
    logger.request("GET", "/admin/users", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/users/csv", async (req, res) => {
  const clientIP = req.ip;

  logger.request("POST", "/admin/users/csv", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for users CSV endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Users CSV data access");

  try {
    const users = await User.find({});
    logger.info(`Retrieved ${users.length} users from database`);
    logger.database("READ", "users", `Count: ${users.length}`);

    if (users.length === 0) {
      logger.warn("No users found in the database");
      logger.request("POST", "/admin/users/csv", clientIP, 200);
      return res
        .status(200)
        .send(
          '<button class="px-4 py-2 bg-gray-200 text-gray-600">No users to export</button>'
        );
    }

    // Generate unique filename with timestamp
    const filename = `users_${Date.now()}.csv`;
    const filePath = path.join(__dirname, "../public/exports", filename);

    // Ensure exports directory exists
    const dir = path.dirname(filePath);
    if (!require("fs").existsSync(dir)) {
      require("fs").mkdirSync(dir, { recursive: true });
    }

    // Create CSV content
    const headers = [
      "ID",
      "Name",
      "Email",
      "Register ID",
      "Department",
      "Opted Course",
    ];
    const csvHeader = headers.join(",") + "\n";

    const csvRows = users
      .map((user) => {
        return [
          user._id,
          `"${user.name}"`,
          `"${user.email}"`,
          `"${user.registerId}"`,
          `"${user.department.toUpperCase() || "N/A"}"`,
          `"${user.optedCourse || "N/A"}"`,
        ].join(",");
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // Write users data to CSV file
    require("fs").writeFileSync(filePath, csvContent);

    // Generate download link as a button
    const downloadButton = `
            <a href="/admin/exports/${filename}" download>
                <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Download Users Data (CSV)
                </button>
            </a>
        `;

    logger.success("Users data exported to CSV file successfully");
    logger.request("POST", "/admin/users/csv", clientIP, 200);
    return res.status(200).send(downloadButton);
  } catch (error) {
    logger.error("Error exporting users:", error);
    logger.request("POST", "/admin/users/csv", clientIP, 500);
    return res
      .status(500)
      .send(
        '<button class="px-4 py-2 bg-red-500 text-white">Export Failed</button>'
      );
  }
});

// Get course statistics
app.post("/courses", async (req, res) => {
  const clientIP = req.ip;

  logger.request("POST", "/admin/courses", clientIP);

  if (req.headers.authorization !== process.env.SECRETKEY) {
    logger.auth(
      "ADMIN_ACCESS",
      clientIP,
      false,
      "Invalid secret key for courses endpoint"
    );
    return res.status(401).send("Unauthorized");
  }

  logger.auth("ADMIN_ACCESS", clientIP, true, "Course statistics data access");

  try {
    const courses = await Course.find({});
    logger.info(`Retrieved ${courses.length} courses from database`);
    logger.database("READ", "courses", `Count: ${courses.length}`);

    if (courses.length === 0) {
      logger.warn("No courses found in the database");
      logger.request("POST", "/admin/courses", clientIP, 200);
      return res.status(200).send(`
            <tr>
                <td colspan="7" class="border px-4 py-2 text-center">No courses available</td>
            </tr>
            `);
    }

    // Format courses data as HTML table rows for htmx
    const tableRows = courses
      .map(
        (course) => `
            <tr id="course-row-${course.courseCode}">
                <td class="border px-4 py-2">${course.courseCode.toUpperCase()}</td>
                <td class="border px-4 py-2">${titleCase(
                  course.courseName
                )}</td>
                <td class="border px-4 py-2">${course.offeringDepartment.toUpperCase()}</td>
                <td class="border px-4 py-2" id="seats-${course.courseCode}">${
          course.seatsAvailable
        }</td>
                <td class="border px-4 py-2" id="enrolled-${
                  course.courseCode
                }">${course.enrolledStudents.length}</td>
                <td class="border px-4 py-2" id="total-capacity-${
                  course.courseCode
                }">${
          course.seatsAvailable + course.enrolledStudents.length
        }</td>
                <td class="border px-4 py-2">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${(
                          (course.enrolledStudents.length /
                            (course.seatsAvailable +
                              course.enrolledStudents.length)) *
                          100
                        ).toFixed(1)}%"></div>
                    </div>
                    <span class="text-xs text-gray-600" id="percentage-${
                      course.courseCode
                    }">${(
          (course.enrolledStudents.length /
            (course.seatsAvailable + course.enrolledStudents.length)) *
          100
        ).toFixed(1)}%</span>
                </td>
            </tr>
        `
      )
      .join("");

    logger.success("Course statistics data formatted and sent successfully");
    logger.request("POST", "/admin/courses", clientIP, 200);
    return res.status(200).send(tableRows);
  } catch (error) {
    logger.error("Error fetching courses:", error);
    logger.request("POST", "/admin/courses", clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  logger.request("GET", "/admin/", clientIP);
  logger.info("Serving admin dashboard");

  try {
    res.sendFile(path.join(__dirname, "../index.html"));
    logger.success("Admin dashboard served successfully");
    logger.request("GET", "/admin/", clientIP, 200);
  } catch (error) {
    logger.error("Error serving admin dashboard:", error);
    logger.request("GET", "/admin/", clientIP, 500);
    res.status(500).send("Error loading admin dashboard");
  }
});

module.exports = app;
