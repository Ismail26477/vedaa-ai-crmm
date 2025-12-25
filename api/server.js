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
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is not defined in environment variables")
      return
    }
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
  }
}

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
