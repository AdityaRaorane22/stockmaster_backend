const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function test() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    const email = "test" + Date.now() + "@example.com";
    console.log("Creating user with email:", email);

    const user = new User({
      name: "Test User",
      email: email,
      password: "password123"
    });

    await user.save();
    console.log("User created successfully:", user._id);
    
    console.log("Testing password match...");
    const isMatch = await user.matchPassword("password123");
    console.log("Password match:", isMatch);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
