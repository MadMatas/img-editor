import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { removeBackground } from "@imgly/background-removal";
import cors from "cors";
import { fileURLToPath } from "url";



const app = express();
const port = 3300;

// Enable CORS for local development
app.use(cors());

// Serve front-end (optional)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

// Configure multer for uploads
const upload = multer({ dest: "uploads/" });

// POST endpoint to remove background
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    const inputPath = path.join(process.cwd(), req.file.path);

    // Run IMG.LY background removal
    const outputBuffer = await removeBackground(inputPath);

    // Delete the uploaded file
    fs.unlinkSync(inputPath);

    // Return the resulting image
    res.setHeader("Content-Type", "image/png");
    res.send(outputBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Background removal failed");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
