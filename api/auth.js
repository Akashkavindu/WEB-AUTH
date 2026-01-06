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
    readCmd: String,
    autoVoice: String
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGO_URI);
    }

    const { id, password, action, newSettings } = req.body;

    try {
        const user = await Settings.findOne({ id: id });

        if (!user) return res.status(404).json({ error: "User not found!" });

        // --- 1. ලොගින් පරීක්ෂාව (Login Logic) ---
        if (action === "login") {
            if (user.password === "not_set") return res.status(401).json({ error: "Please set a password via Bot first!" });
            if (user.password !== password) return res.status(401).json({ error: "Invalid Password!" });
            return res.status(200).json({ success: true, settings: user });
        }

        // --- 2. සෙටින්ග්ස් වෙනස් කිරීම (Update Logic) ---
        if (action === "update") {
            // මෙතනදී Password එකත් එවන්න ඕනේ ආරක්ෂාවට
            if (user.password !== password) return res.status(401).json({ error: "Unauthorized update!" });

            const updated = await Settings.findOneAndUpdate(
                { id: id },
                { $set: newSettings },
                { new: true, lean: true }
            );
            return res.status(200).json({ success: true, settings: updated });
        }

    } catch (e) {
        return res.status(500).json({ error: "Database Error: " + e.message });
    }
}
