import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path"; // Add this to resolve file paths
import authRouter from "./routes/auth.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Database Connection
const mongoURI = process.env.MONGODB_URL;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Authentication Routes
app.use("/api/auth", authRouter);

// User Management Routes
app.post("/api/add-user", async (req, res) => {
  const { name, email, phone, password, role, employeeId } = req.body;

  if (!name || !email || !phone || !password || !role || !employeeId) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      employeeId,
    });
    await newUser.save();

    res.status(201).json({ success: true, message: "User added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

// ✨ Serve Frontend (Vite Build)
const __dirname = path.resolve(); // Ensure correct directory path

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
