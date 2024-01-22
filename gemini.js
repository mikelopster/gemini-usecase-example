require("dotenv").config()

const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY)

const fileToGenerativePart = (imageData, mimeType) => {
  return {
    inlineData: {
      data: imageData,
      mimeType,
    },
  }
}

const imageChat = async (prompt, imageData, mimeType) => {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })
  const imageParts = [fileToGenerativePart(imageData, mimeType)]
  const result = await model.generateContent([prompt, ...imageParts])
  const response = await result.response
  const text = response.text()
  return text
}

const chatPrompt = async (prompt) => {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  return text
}

module.exports = {
  imageChat,
  chatPrompt
}