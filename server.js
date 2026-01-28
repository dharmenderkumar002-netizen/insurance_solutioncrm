import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, "frontend")));

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/index.html"));
});

// Serve HTML files
app.get("*.html", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", req.path));
});

// Fallback to index.html for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend/index.html"));
});

const PORT = process.env.PORT || 3003;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
}

export default app;

