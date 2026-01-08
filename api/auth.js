const mongoose = require('mongoose');

// MongoDB URI
const MONGO_URI = "mongodb+srv://zanta-md:Akashkavindu12345@cluster0.iw4vklq.mongodb.net/test?retryWrites=true&w=majority";

// Connection එක හිරවෙන්නේ නැති වෙන්න cachedDb එක පාවිච්චි කරමු
let isConnected = false;

async function connectToDatabase() {
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return;
    }

    try {
        mongoose.set('strictQuery', true);
        const db = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // ඉතා වැදගත්: Connection එක එනකම් commands හිර කරන්නේ නැහැ
            serverSelectionTimeoutMS: 10000, // තත්පර 10කින් timeout වෙනවා
        });
        isConnected = db.connections[0].readyState === 1;
        console.log("New MongoDB connection established");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw new Error("Database Connection Error");
    }
}

// Schema එක අලුත් fields එක්කම (Validation Fail නොවෙන්න)
const SettingsSchema = new mongoose.Schema({
    id: { type: String, required: true, index: true },
    password: { type: String, default: 'not_set' },
    botName: String,
    ownerName: String,
    prefix: String,
    autoRead: { type: String, default: 'false' },
    autoTyping: { type: String, default: 'false' },
    autoStatusSeen: { type: String, default: 'false' },
    autoStatusReact: { type: String, default: 'false' },
    alwaysOnline: { type: String, default: 'false' },
    readCmd: { type: String, default: 'false' },
    autoVoice: { type: String, default: 'false' }
}, { collection: 'settings', versionKey: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    try {
        // 1. Database එකට Connect වීම
        await connectToDatabase();

        const { id, password, action, settings } = req.body;

        if (!id) return res.status(400).json({ success: false, error: "Bot ID is required!" });

        // 2. User කෙනෙක් ඉන්නවාදැයි බැලීම
        const user = await Settings.findOne({ id: id });

        if (!user) {
            return res.status(404).json({ success: false, error: "Bot ID not found in database!" });
        }

        // 3. Login Action
        if (action === "login") {
            if (user.password !== password) {
                return res.status(401).json({ success: false, error: "Incorrect Password!" });
            }
            return res.status(200).json({ success: true, settings: user });
        }

        // 4. Update Settings Action
        if (action === "updateSettings") {
            // Security: දැනට තියෙන password එක නිවැරදි නම් විතරක් update කරන්න දෙන්න
            if (user.password !== password) {
                return res.status(401).json({ success: false, error: "Auth Failed!" });
            }

            const updated = await Settings.findOneAndUpdate(
                { id: id },
                { $set: settings },
                { new: true, runValidators: true, lean: true }
            );

            if (!updated) throw new Error("Update failed at Database level");

            return res.status(200).json({ success: true, settings: updated });
        }

        return res.status(400).json({ success: false, error: "Invalid Action!" });

    } catch (e) {
        console.error("Critical API Error:", e.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server Error: " + e.message 
        });
    }
}
