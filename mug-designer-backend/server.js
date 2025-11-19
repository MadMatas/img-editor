import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { removeBackground } from "@imgly/background-removal-node";

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // memory storage for Buffer

app.use(cors());

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    console.log("🔍 Received file:", req.file.originalname, req.file.mimetype);

    const buffer = req.file.buffer; // multer gives you a Buffer
    const resultBuffer = await removeBackground(buffer, { inputFormat: "png" });

    res.set("Content-Type", "image/png");
    res.send(resultBuffer);
  } catch (err) {
    console.error("❌ Background removal error:", err);
    res.status(500).send("Background removal failed");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
