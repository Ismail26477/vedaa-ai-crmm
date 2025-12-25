import express from "express"
import Caller from "../models/Caller.js"

const router = express.Router()

const ensureDefaultAdmin = async () => {
  try {
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
      console.log("✅ Default admin user created")
    }
  } catch (error) {
    console.error("Error creating default admin:", error)
  }
}

router.post("/login", async (req, res) => {
  try {
    // Ensure admin exists before login attempt
    await ensureDefaultAdmin()

    const { username, password, email } = req.body

    // Support both username and email parameters
    const identifier = email || username

    // Try to find by username or email
    const caller = await Caller.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    })

    if (!caller) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Simple password check (in production, use bcrypt)
    if (caller.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

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
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
