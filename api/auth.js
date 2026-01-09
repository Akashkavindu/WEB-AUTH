const mongoose = require('mongoose');
const axios = require('axios'); // ✅ Signal එක යැවීමට axios අවශ්‍යයි

const MONGO_URI = "mongodb+srv://zanta-md:Akashkavindu12345@cluster0.iw4vklq.mongodb.net/test?retryWrites=true&w=majority";

const connectToDatabase = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(MONGO_URI);
};

// ✅ Auto Reply support එක සහිත Schema එක
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
    autoVoice: String,
    autoReply: { type: String, default: 'false' },
    autoReplies: { type: Array, default: [] } // [{keyword: 'hi', reply: 'hello'}]
}, { collection: 'settings', strict: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: "Method not allowed" });

    try {
        await connectToDatabase();
        const { id, password, action, settings, botUrl } = req.body; 

        const user = await Settings.findOne({ id: id });
        if (!user) return res.status(404).json({ success: false, error: "User not found!" });
        if (user.password !== password) return res.status(401).json({ success: false, error: "Invalid Password!" });

        if (action === "login") {
            return res.status(200).json({ success: true, settings: user });
        }

        if (action === "updateSettings") {
            // 1. Database එක Update කිරීම
            await Settings.updateOne({ id: id }, { $set: settings });

            // 2. ✅ බොට්ගේ RAM එක Update කිරීමට Signal එක යැවීම
            if (botUrl) {
                try {
                    // බොට්ගේ URL එකට GET request එකක් යවනවා id එකත් එක්ක
                    await axios.get(`${botUrl.replace(/\/$/, "")}/update-cache?id=${id}`);
                } catch (err) {
                    console.error("⚠️ Bot cache update failed (Offline)");
                }
            }

            return res.status(200).json({ success: true, message: "Settings Updated & Cache Synced!" });
        }

    } catch (e) {
        console.error("API Error:", e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
}
