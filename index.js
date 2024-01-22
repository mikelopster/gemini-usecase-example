const express = require("express")
const multer = require("multer")
const { imageChat, chatPrompt } = require("./gemini")
const app = express()

require("dotenv").config()

app.use(express.json())

// Setting project
const upload = multer({ storage: multer.memoryStorage() })

// POST API for getting data from body
app.post("/api/chat", async (req, res) => {
  const { chat } = req.body
  console.log("data", chat)
  const result = await chatPrompt(chat)
  res.json({ message: result })
})

// POST API for uploading file
app.post("/api/upload", upload.single("myfile"), async (req, res) => {
  const file = req.file
  const { chat } = req.body
  if (!file) {
    return res.status(400).send("No file uploaded.")
  }

  if (!chat) {
    return res.status(400).send("No chat.")
  }

  const fileData = file.buffer.toString("base64")
  const fileMimetype = file.mimetype

  const result = await imageChat(chat, fileData, fileMimetype)

  res.json({
    message: "File uploaded successfully",
    result,
  })
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
