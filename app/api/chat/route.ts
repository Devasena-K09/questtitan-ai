import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({ reply: "API key not configured." }, { status: 400 });
    }

    const messages = [
      {
        role: "system",
        content: `You are QuestTitan AI, a friendly, clear, and highly capable AI tutor.

You can answer ANY question — technology trends, coding, career advice, world events, general knowledge, etc.

Response rules:
- Use short paragraphs (2-4 sentences max per paragraph).
- Use **bold** for important words or terms.
- Use bullet points when listing things.
- Speak naturally and conversationally, like a knowledgeable friend.
- Be encouraging and helpful.
- Keep total response concise and easy to read.
- Break complex topics into simple steps.
- Never write one long paragraph.

Goal: Make learning enjoyable and clear.`
      },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({
      reply: "Sorry, I had trouble processing that. Please try asking again."
    }, { status: 500 });
  }
}