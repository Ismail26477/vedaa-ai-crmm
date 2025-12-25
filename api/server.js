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
let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing")
    }
    const db = await mongoose.connect(process.env.MONGODB_URI)
    isConnected = !!db.connections[0].readyState
    console.log("[v0] MongoDB connected")
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
      tip: "Please check your MONGODB_URI in Vercel environment variables.",
    })
  }
})

connectDB()

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
