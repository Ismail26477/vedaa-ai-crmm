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
  console.warn("⚠️ MONGODB_URI environment variable is not set")
  console.warn("Please add MONGODB_URI to your Vercel environment variables")
  // Don't exit - let server start and return helpful errors
} else {
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
    })
}

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/leads", leadRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/call-logs", callLogRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/settings", settingsRoutes)

app.get("/api/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  const hasMongoUri = !!process.env.MONGODB_URI

  res.json({
    status: "ok",
    message: "Server is running",
    database: mongoStatus,
    mongodbConfigured: hasMongoUri,
    nodeEnv: process.env.NODE_ENV || "not-set",
  })
})

app.get("/api/setup-check", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState
  const hasMongoUri = !!process.env.MONGODB_URI

  if (!hasMongoUri) {
    return res.status(400).json({
      error: "MONGODB_URI is not configured",
      message: "Please add MONGODB_URI environment variable to Vercel project settings",
      steps: [
        "1. Go to your Vercel project dashboard",
        "2. Click Settings > Environment Variables",
        "3. Add MONGODB_URI with your MongoDB connection string",
        "4. Redeploy your application",
      ],
    })
  }

  if (mongoStatus !== 1) {
    return res.status(400).json({
      error: "MongoDB is not connected",
      message: "Server is running but cannot connect to MongoDB",
      mongoStatus: mongoStatus,
      mongoStatusName: ["disconnected", "connecting", "connected", "disconnecting"][mongoStatus],
    })
  }

  res.json({
    status: "ready",
    message: "All systems configured and connected",
    database: "connected",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
