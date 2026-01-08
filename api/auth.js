const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://zanta-md:Akashkavindu12345@cluster0.iw4vklq.mongodb.net/test?retryWrites=true&w=majority";

const connectToDatabase = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(MONGO_URI);
};

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
}, { collection: 'settings', strict: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    // ඉතා වැදගත්: Headers සියල්ලම මෙතැනදී set කරනවා
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Browser එකෙන් මුලින්ම එවන්නේ OPTIONS request එක. ඒක මෙතනින්ම නතර කරලා 200 යවන්න ඕනේ.
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        await connectToDatabase();
        const { id, password, action, settings } = req.body;

        const user = await Settings.findOne({ id: id });
        if (!user) return res.status(404).json({ success: false, error: "User not found!" });

        if (user.password !== password) {
            return res.status(401).json({ success: false, error: "Invalid Password!" });
        }

        if (action === "login") {
            return res.status(200).json({ success: true, settings: user });
        }

        if (action === "updateSettings") {
            await Settings.updateOne({ id: id }, { $set: settings });
            return res.status(200).json({ success: true, message: "Updated!" });
        }

    } catch (e) {
        console.error("API Error:", e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
}
