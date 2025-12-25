import express from "express"
import Caller from "../models/Caller.js"
import mongoose from "mongoose"

const router = express.Router()

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error("[v0] MongoDB not connected. Status:", mongoose.connection.readyState)
      return res.status(503).json({
        message: "Database connection error. Please check MONGODB_URI in environment variables.",
        error: "database_not_connected",
      })
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    console.log("[v0] Login attempt for:", email)

    let caller = await Caller.findOne({ email: email })

    if (!caller) {
      console.log("[v0] Email not found, trying username:", email)
      caller = await Caller.findOne({ username: email })
    }

    if (!caller) {
      console.log("[v0] No user found with email or username:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Simple password check (in production, use bcrypt)
    if (caller.password !== password) {
      console.log("[v0] Password mismatch for user:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    console.log("[v0] Login successful for:", email)

    res.json({
      id: caller._id,
      username: caller.username,
      name: caller.name,
      email: caller.email,
      phone: caller.phone,
      role: caller.role,
      status: caller.status,
    })
  } catch (error) {
    console.error("[v0] Login error:", error.message)
    console.error("[v0] Error stack:", error.stack)
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    })
  }
})

export default router
