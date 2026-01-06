const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://zanta-md:Akashkavindu12345@cluster0.iw4vklq.mongodb.net/?appName=Cluster0";

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
    alwaysOnline: String,
    readCmd: String,
    autoVoice: String
}, { collection: 'settings' }); // ඔයාගේ collection name එක 'settings' නිසා

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGO_URI);
    }

    const { id, password, action, settings } = req.body;

    try {
        const user = await Settings.findOne({ id: id });

        if (!user) return res.status(404).json({ error: "User not found!" });

        // --- 1. ලොගින් පරීක්ෂාව ---
        if (action === "login") {
            if (user.password === "not_set") return res.status(401).json({ error: "Please set a password first!" });
            if (user.password !== password) return res.status(401).json({ error: "Invalid Password!" });
            return res.status(200).json({ success: true, settings: user });
        }

        // --- 2. සෙටින්ග්ස් අප්ඩේට් කිරීම ---
        if (action === "updateSettings") {
            // ආරක්ෂාවට දැනට localStorage එකේ තියෙන Password එකත් එවන්න පුළුවන්, 
            // නැත්නම් දැනට මේ සරල ක්‍රමය පාවිච්චි කරමු.
            const updated = await Settings.findOneAndUpdate(
                { id: id },
                { $set: settings },
                { new: true }
            );
            return res.status(200).json({ success: true, settings: updated });
        }

        return res.status(400).json({ error: "Invalid Action!" });

    } catch (e) {
        return res.status(500).json({ error: "Database Error: " + e.message });
    }
}
