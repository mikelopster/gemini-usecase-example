const express = require("express")
const multer = require("multer")
const { imageChat, chatPrompt, chatHistoryPrompt } = require("./gemini")
const app = express()

require("dotenv").config()

app.use(express.json())

// Setting project
const upload = multer({ storage: multer.memoryStorage() })

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index lower than the current element
    const j = Math.floor(Math.random() * (i + 1))

    // Swap elements at indices i and j
    ;[array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

// Case 1: summary to bullet
app.post("/api/summary", async (req, res) => {
  try {
    const { chat } = req.body
    const result = await chatHistoryPrompt(chat, [
      {
        role: "user",
        parts: `
          Summary this text that write in format of bullet points
          Example:
          - summary point 1
          - summary point 2
        `,
      },
      {
        role: "model",
        parts: "Please provide information",
      },
    ])

    const summaryBulletList = result.split("\n")

    res.json({ message: summaryBulletList })
  } catch (error) {
    console.log("error", error)
    res.status(400).json({ message: "sorry, cannot extract data." })
  }
})

// Case 2: generate choice from answer
app.post("/api/choice", async (req, res) => {
  try {
    const { question, answer } = req.body
    const chat = `Question: ${question}. Answer: ${answer}. Generate 3 Choices`
    const result = await chatHistoryPrompt(chat, [
      {
        role: "user",
        parts: `
          I have question and answer. Please generate 3 choices that related with answer (but it is incorrect answer).

          Example like this (follow this pattern for generate choices)
          Question : What is the red color?
          Answer: Apple

          AI should result like this (no more description like this)
          Generate 3 Choices:
          1. Banana
          2. Orange
          3. Grape
        `,
      },
      {
        role: "model",
        parts:
          "Please provide Question and Answer. I will give Generate 3 Choices for you.",
      },
    ])

    const pattern = /\d\.\s(.+?)(?=\n|$)/g

    // Extract matches
    let choices = [answer]
    let match
    while ((match = pattern.exec(result)) !== null) {
      choices.push(match[1].replace("*", ""))
    }

    choices = shuffleArray([...choices])

    res.json({ message: choices })
  } catch (error) {
    console.log("error", error)
    res.status(400).json({ message: "sorry, cannot extract data." })
  }
})

// Case 3: find location in image
app.post("/api/location", upload.single("myfile"), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).send("No file uploaded.")
    }

    const fileData = file.buffer.toString("base64")
    const fileMimetype = file.mimetype

    const location = (
      await imageChat(
        `
      what is the location in this image ? just answer location.
      Example answer: Asok Montri Road in Bangkok, Thailand
    `,
        fileData,
        fileMimetype
      )
    ).trim()

    res.json({
      location,
    })
  } catch (error) {
    console.log("error", error)
    res.status(400).json({ message: "sorry, cannot extract data." })
  }
})

// Case 4: OCR
app.post("/api/menu-extract", upload.single("myfile"), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).send("No file uploaded.")
    }

    const fileData = file.buffer.toString("base64")
    const fileMimetype = file.mimetype

    const result = await imageChat(
      `
      list menu in this receipt in this format
      - menu 1
      - menu 2
    `,
      fileData,
      fileMimetype
    )

    // Regex pattern to match the items
    const pattern = /-\s(.+?)(?=\n|$)/g

    // Extract matches
    const menus = []
    let match
    while ((match = pattern.exec(result)) !== null) {
      menus.push(match[1])
    }

    res.json({
      menus,
    })
  } catch (error) {
    console.log("error", error)
    res.status(400).json({ message: "sorry, cannot extract data." })
  }
})

// Normal Prompt
app.post("/api/chat", async (req, res) => {
  const { chat } = req.body
  const result = await chatPrompt(chat)
  res.json({ message: result })
})

// Case upload file and prompt
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

// History Prompt
app.post("/api/history", async (req, res) => {
  const { chat, history } = req.body
  const result = await chatHistoryPrompt(chat, history)
  res.json({ message: result })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})