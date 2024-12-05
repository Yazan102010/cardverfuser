// Import necessary packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load environment variables

// Declare the 'app' object
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Ensure JSON parsing is enabled for POST requests

const PORT = process.env.PORT || 4000;

// Connect to MongoDB using environment variable for URI
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Define the Profile Schema
const profileSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate usernames
        trim: true // Removes extra whitespace
    },
    name: String,
    jobTitle: String,
    profileImage: String,
    headerImage: String,
    phone: String,   // Add phone field
    email: String,   // Add email field
    isVerified: {
        type: Boolean,
        default: false,
    }, socialLinks: {
        website: String,  // Add website link
        instagram: String,
        facebook: String,
        telegram: String,
        tiktok: String,
        youtube: String,
        whatsapp: String,
        maps: String,
        snapchat: String,
    },
});

const Profile = mongoose.model("Profile", profileSchema);

// Routes

// Create a new profile
app.post("/api/save-profile", async (req, res) => {
    const { username, name, jobTitle, profileImage, headerImage, phone, email, isVerified, socialLinks } = req.body;
    if (!username || username.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long." });
    }

    // Generate a profile key based on the name (slug format)
    const profileKey = username.toLowerCase().replace(/\s+/g, '-'); // Convert spaces to hyphens

    const existingProfile = await Profile.findOne({ username });
    if (existingProfile) {
        return res.status(400).json({ message: "Username is already taken." });
    }

    const newProfile = new Profile({
        username,
        name,
        jobTitle,
        profileImage,
        headerImage,
        phone,
        email,
        isVerified,
        socialLinks,
    });

    try {
        const savedProfile = await newProfile.save();
        res.status(201).json({ message: "Profile saved successfully", profileKey });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Profile key or username already exists." });
        }
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
app.get("/ping", (req, res) => {
    res.send("Server is awake!");
});

// Get all profiles
app.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find();
        res.status(200).json(profiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a profile by unique name (profileKey)
app.get("/:profileKey", async (req, res) => {
    const profileKey = req.params.profileKey;
    console.log("Received profile request for username:", profileKey);  // Log the incoming request

    try {
        const profile = await Profile.findOne({ username: profileKey });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile); // Send the profile data as JSON
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error });
    }
});

app.get('/profile/:profileKey', async (req, res) => {
    const profileKey = req.params.profileKey;

    try {
        const profile = await Profile.findOne({ profileKey });

        if (profile) {
            res.json({
                username: profile.username,
                isVerified: profile.isVerified,  // Boolean value
                // other fields...
            });
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a profile by name
app.delete("/api/profiles/:profileKey", async (req, res) => {
    const { profileKey } = req.params;

    try {
        const profile = await Profile.findOneAndDelete({
            username: new RegExp(`^${profileKey.replace('-', ' ')}$`, 'i')
        });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a profile by profileName (fetching from database now)
app.get('/profile/:profileusername', async (req, res) => {
    const { profileusername } = req.params;

    try {
        // Fetch profile data from the database based on profileName
        const profile = await Profile.findOne({ username: new RegExp(`^${profileusername.replace('-', ' ')}$`, 'i') });

        if (profile) {
            res.json(profile);  // Return the profile data as JSON
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Update an existing profile by name (or profile key)
// Update profile by profile key
app.put("/api/update-profile/:profileKey", async (req, res) => {
    const profileKey = req.params.profileKey;  // Get the profileKey from the URL params
    const { username, name, jobTitle, profileImage, headerImage, phone, email, isVerified, socialLinks } = req.body;

    try {
        // Perform the update operation on the profile
        const updatedProfile = await Profile.findOneAndUpdate(
            { username: new RegExp(`^${profileKey}$`, "i") },  // Search by profileKey
            { username, name, jobTitle, profileImage, headerImage, phone, email, isVerified, socialLinks },
            { new: true } // This returns the updated profile
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Send the updated profile back in the response
        res.status(200).json(updatedProfile);
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
