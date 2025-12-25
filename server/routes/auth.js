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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    let caller = await Caller.findOne({ email: email })

    if (!caller) {
      caller = await Caller.findOne({ username: email })
    }

    if (!caller) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

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
    console.error("Login error:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

router.post("/setup-admin", async (req, res) => {
  try {
    await ensureDefaultAdmin()
    res.json({ message: "Admin setup checked/completed" })
  } catch (error) {
    console.error("Setup error:", error)
    res.status(500).json({ message: "Setup error", error: error.message })
  }
})

export default router
