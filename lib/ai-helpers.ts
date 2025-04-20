import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"

// Analyze sentiment of user message
export async function analyzeSentiment(text: string) {
  try {
    // For simple messages like "hey", return a default neutral sentiment
    if (text.trim().toLowerCase() === "hey" || text.length < 5) {
      return {
        mood: "neutral",
        confidence: 0.9,
        urgency: 1,
      }
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      prompt: `Analyze the sentiment of this banking customer message: "${text}"`,
      schema: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            enum: ["happy", "neutral", "concerned", "confused", "frustrated", "angry"],
            description: "The detected mood of the customer",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Confidence score of the sentiment analysis",
          },
          urgency: {
            type: "number",
            minimum: 1,
            maximum: 5,
            description: "How urgent the customer's issue seems (1-5)",
          },
        },
        required: ["mood", "confidence", "urgency"],
      },
    })

    return object
  } catch (error) {
    console.error("Error analyzing sentiment:", error)
    // Return a default value if there's an error
    return {
      mood: "neutral",
      confidence: 0.5,
      urgency: 1,
    }
  }
}

// Extract banking-specific entities from user message
export async function extractBankingEntities(text: string) {
  try {
    // For simple greetings or short messages, return empty array
    if (text.trim().toLowerCase() === "hey" || text.length < 5) {
      return []
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      prompt: `Extract banking-specific entities from this customer message: "${text}"`,
      schema: {
        type: "array",
        items: {
          type: "string",
          description: "Banking entity or concept mentioned in the text",
        },
        maxItems: 5,
      },
    })

    return object
  } catch (error) {
    console.error("Error extracting entities:", error)
    // Return an empty array if there's an error
    return []
  }
}

// Process document image for relevant information
export async function processDocumentImage(imageUrl: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Extract all relevant banking information from this document image.",
      images: [imageUrl],
    })

    return text
  } catch (error) {
    console.error("Error processing document image:", error)
    return "Unable to process the document image. Please try again or contact support."
  }
}

// Generate personalized response suggestions
export async function generateResponseSuggestions(
  userQuery: string,
  userHistory: string[],
  detectedEntities: string[],
) {
  try {
    // For simple greetings, return a default greeting suggestion
    if (userQuery.trim().toLowerCase() === "hey" || userQuery.length < 5) {
      return [
        {
          responseText: "Hello! How can I assist you with your banking needs today?",
          tone: "friendly",
          rationale: "Responding to a simple greeting with a friendly welcome",
        },
      ]
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      prompt: `
        Generate 3 personalized response suggestions for a banking assistant.
        Customer query: "${userQuery}"
        Customer history summary: "${userHistory.join(", ")}"
        Detected banking entities: ${detectedEntities.join(", ")}
      `,
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            responseText: {
              type: "string",
              description: "Suggested response text",
            },
            tone: {
              type: "string",
              enum: ["formal", "friendly", "empathetic", "direct"],
              description: "The tone of this response",
            },
            rationale: {
              type: "string",
              description: "Why this response might be appropriate",
            },
          },
          required: ["responseText", "tone", "rationale"],
        },
        minItems: 1,
        maxItems: 3,
      },
    })

    return object
  } catch (error) {
    console.error("Error generating response suggestions:", error)
    // Return a default suggestion if there's an error
    return [
      {
        responseText: "I understand your question. Let me help you with that.",
        tone: "friendly",
        rationale: "Generic helpful response when specific suggestions can't be generated",
      },
    ]
  }
}
