import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { initDB } from "./db.js";
import { router as signupRoute } from "./routes/signup.js";
import { router as recoveryRoute } from "./routes/recovery.js";
import { router as peerRoute } from "./routes/peer.js";
import { router as home } from "./routes/home.js";
import { router as auth } from "./routes/auth.js";


const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", auth);
app.use("/home", home);
app.use("/signup", signupRoute);
app.use("/recover", recoveryRoute);
app.use("/peer", peerRoute);

// Start Server
const PORT = process.env.PORT || 5000;

initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Backend running on port", PORT);
    });
});
