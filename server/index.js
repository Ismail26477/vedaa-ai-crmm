import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import leadRoutes from "./routes/leads.js"
import callerRoutes from "./routes/callers.js"
import authRoutes from "./routes/auth.js"
import activityRoutes from "./routes/activities.js"
import callLogRoutes from "./routes/callLogs.js"
import dashboardRoutes from "./routes/dashboard.js"
import reportsRoutes from "./routes/reports.js"
import settingsRoutes from "./routes/settings.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set")
  process.exit(1)
}

mongoose
  .connect(MONGODB_URI, {
    dbName: "crm_database",
  })
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully")

    try {
      const Caller = (await import("./models/Caller.js")).default
      const adminExists = await Caller.findOne({ email: "admin@gmail.com" })

      if (!adminExists) {
        await Caller.create({
          username: "admin",
          name: "Admin User",
          email: "admin@gmail.com",
          phone: "+91 98765 43213",
          password: "admin123",
          role: "admin",
          status: "active",
        })
        console.log("✅ Default admin user created successfully")
      } else {
        console.log("✅ Admin user already exists")
      }
    } catch (err) {
      console.error("Error setting up default admin:", err.message)
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message)
    console.error("Please check your MONGODB_URI in environment variables")
    // Don't exit immediately - allow server to start and show error on login
  })

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/leads", leadRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/call-logs", callLogRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/settings", settingsRoutes)

// Health check
app.get("/api/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  res.json({
    status: "ok",
    message: "Server is running",
    database: mongoStatus,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
