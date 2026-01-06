const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://zanta-md:Akashkavindu12345@cluster0.iw4vklq.mongodb.net/test?retryWrites=true&w=majority";

// Connection එක Cache කරන්න variable එකක්
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    // Timeout එක අඩු කරලා වේගයෙන් connect වෙන්න හදනවා
    cachedDb = await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 
    });
    return cachedDb;
}

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
}, { collection: 'settings' });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectToDatabase(); // වේගවත් connection එක

        const { id, password, action, settings } = req.body;
        const user = await Settings.findOne({ id: id });

        if (!user) return res.status(404).json({ success: false, error: "User not found!" });

        if (action === "login") {
            if (user.password !== password) return res.status(401).json({ success: false, error: "Invalid Password!" });
            return res.status(200).json({ success: true, settings: user });
        }

        if (action === "updateSettings") {
            const updated = await Settings.findOneAndUpdate(
                { id: id },
                { $set: settings },
                { new: true, lean: true }
            );
            return res.status(200).json({ success: true, settings: updated });
        }

    } catch (e) {
        console.error("DB Error:", e.message);
        return res.status(500).json({ success: false, error: "Server Busy. Try again!" });
    }
}
