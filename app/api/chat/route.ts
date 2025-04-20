import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Extract the messages from the request
    const { messages } = await req.json()

    // Get the Groq API key from environment variables
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("Missing Groq API key")
      return NextResponse.json({ error: "Configuration error: Missing API key" }, { status: 500 })
    }

    console.log("Making request to Groq API")

    // Banking context to help guide the model
    const systemMessage = {
      role: "system",
      content: `You are a helpful, professional banking assistant for RBC (Royal Bank of Canada).
Provide accurate, concise answers to banking questions.
Use a friendly but professional tone.
If you're unsure about something, acknowledge it and suggest where the customer might find more information.
Focus on general banking information and avoid making specific claims about RBC's products or services unless explicitly stated in this context.
Never ask for or encourage sharing of sensitive information like account numbers, passwords, or PINs.

IMPORTANT FORMATTING INSTRUCTIONS:
- When using numbered lists (1, 2, 3), start each new numbered item on a new line
- When using bullet points, start each new bullet point on a new line
- Use paragraph breaks between different sections of your response
- Format your response for maximum readability with clear visual separation between points`,
    }

    // Add the system message to the beginning of the messages array
    const completionMessages = [systemMessage, ...messages]

    // Make a direct request to Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: completionMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Groq API error:", response.status, errorData)
      return NextResponse.json({ error: "Failed to get response from Groq", details: errorData }, { status: 500 })
    }

    const data = await response.json()
    console.log("Received response from Groq")

    // Process the response to ensure proper formatting
    let content = data.choices[0].message.content

    // Ensure numbered lists have proper line breaks (single line break, not double)
    content = content.replace(/(\d+\.\s+[^\n]+)(?=\s+\d+\.)/g, "$1\n")

    // Remove any extra indentation at the beginning of lines with numbers
    content = content.replace(/\n\s+(\d+\.\s+)/g, "\n$1")

    // Ensure bullet points have proper line breaks (single line break, not double)
    content = content.replace(/(•\s+[^\n]+)(?=\s+•)/g, "$1\n")
    content = content.replace(/(-\s+[^\n]+)(?=\s+-)/g, "$1\n")
    content = content.replace(/(\*\s+[^\n]+)(?=\s+\*)/g, "$1\n")

    // Add paragraph breaks between sections (not between list items)
    // This regex looks for lines that don't start with numbers or bullet points
    content = content.replace(/([^\n])(\n)(?!\s*(?:\d+\.|•|-|\*))/g, "$1\n\n")

    // Return the assistant's message with improved formatting
    return NextResponse.json({
      role: "assistant",
      content: content,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
