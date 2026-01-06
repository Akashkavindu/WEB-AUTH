const mongoose = require('mongoose');

// MongoDB URI එක (Vercel Settings වල Environment Variable එකක් ලෙස පසුව ඇතුළත් කරන්න)
const MONGO_URI = process.env.MONGODB_URL;

const SettingsSchema = new mongoose.Schema({
    id: String,
    password: { type: String, default: 'not_set' },
    botName: String,
    ownerName: String,
    prefix: String,
    autoRead: String,
    autoTyping: String,
    autoStatusSeen: String,
    autoStatusReact: String,
    readCmd: String,
    autoVoice: String
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    // CORS Settings (Netlify එකට access දීමට)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (mongoose.connection.readyState !== 1) await mongoose.connect(MONGO_URI);

    const { id, password } = req.body;

    try {
        const user = await Settings.findOne({ id: id });

        if (!user) return res.status(404).json({ error: "User not found!" });
        if (user.password === "not_set") return res.status(401).json({ error: "Please set a password via Bot first! (.settings)" });
        if (user.password !== password) return res.status(401).json({ error: "Invalid Password!" });

        // Password හරි නම් user settings යවන්න
        return res.status(200).json({ success: true, settings: user });

    } catch (e) {
        return res.status(500).json({ error: "Database Error" });
    }
}