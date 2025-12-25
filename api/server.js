import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRoutes from "../server/routes/auth.js"
import callerRoutes from "../server/routes/callers.js"
import activityRoutes from "../server/routes/activities.js"
import analyticsRoutes from "../server/routes/analytics.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
let mongoConnecting = false
let cachedDb = null

const connectDB = async () => {
  // If already connected, return cached connection
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }

  // Prevent multiple simultaneous connection attempts
  if (mongoConnecting) {
    console.log("[v0] MongoDB connection already in progress, waiting...")
    // Wait for connection to complete
    for (let i = 0; i < 30; i++) {
      if (mongoose.connection.readyState === 1) {
        return cachedDb
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI not configured. " +
        "1. Go to https://mongodb.com/cloud/atlas (create free account) " +
        "2. Create a database cluster " +
        "3. Get connection string " +
        "4. Add to Vercel: Settings > Environment Variables > MONGODB_URI",
    )
  }

  try {
    mongoConnecting = true
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts)
    mongoConnecting = false
    console.log("[v0] MongoDB connected successfully")
    return cachedDb
  } catch (error) {
    mongoConnecting = false
    console.error("[v0] MongoDB connection failed:", error.message)
    throw error
  }
}

app.use(async (req, res, next) => {
  // Check if this is a health check or setup endpoint
  if (req.path === "/api/health" || req.path === "/api/setup") {
    return next()
  }

  try {
    await connectDB()
    next()
  } catch (error) {
    console.error("[v0] Database connection error:", error.message)
    // Don't crash - return helpful error to client
    return res.status(503).json({
      success: false,
      message: "Database not configured",
      error: error.message,
      setup: "Visit /api/setup for configuration instructions",
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1
  res.json({
    status: "ok",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

// Setup/diagnostics endpoint
app.get("/api/setup", (req, res) => {
  const hasMongoUri = !!process.env.MONGODB_URI
  res.json({
    environment: process.env.NODE_ENV || "production",
    mongoUri: hasMongoUri ? "✓ Configured" : "✗ Missing",
    databaseConnected: mongoose.connection.readyState === 1,
    instructions: hasMongoUri
      ? "MongoDB URI is set. Login should work now."
      : [
          "1. Create MongoDB Atlas account: https://mongodb.com/cloud/atlas",
          "2. Create free database cluster",
          "3. Get connection string (include password)",
          "4. Go to Vercel Dashboard > Settings > Environment Variables",
          "5. Add: MONGODB_URI = <your_connection_string>",
          "6. Redeploy project",
        ],
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/analytics", analyticsRoutes)

// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("[v0] Unhandled error:", err)
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  })
})

// Export for Vercel serverless
export default app
