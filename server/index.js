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
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://ismail:ismail123@cluster0.t63ghmf.mongodb.net/?appName=Cluster0"

mongoose
  .connect(MONGODB_URI, {
    dbName: "crm_database",
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err))

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
  res.json({ status: "ok", message: "Server is running" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
