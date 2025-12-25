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
let cachedDb = null

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log("[v0] Using cached MongoDB connection")
    return cachedDb
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.error("[v0] CRITICAL: MONGODB_URI is missing from environment variables!")
      throw new Error("MONGODB_URI is not configured. Please add it to your Vercel Project Settings.")
    }

    // Set connection options for better stability in serverless
    const opts = {
      bufferCommands: false,
    }

    console.log("[v0] Connecting to MongoDB...")
    cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts)
    console.log("[v0] MongoDB connected successfully")
    return cachedDb
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error.message)
    throw error
  }
}

app.use(async (req, res, next) => {
  console.log(`[v0] ${req.method} ${req.url}`)

  try {
    await connectDB()
    next()
  } catch (error) {
    console.error("[v0] Request failed due to DB connection error:", error.message)
    res.status(500).json({
      message: "Database Connection Failed",
      error: error.message,
      actionRequired: "Go to Vercel Dashboard > Settings > Environment Variables and add MONGODB_URI",
    })
  }
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/analytics", analyticsRoutes)

// Fallback for /api routes not matched above
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` })
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Export for Vercel serverless
export default app
