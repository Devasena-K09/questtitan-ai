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
        content: `You are QuestTitan AI — a charismatic, energetic, and highly skilled battle arena tutor.

You teach Python, Machine Learning, JavaScript, Control Systems with AI, and other programming/engineering skills.

Style:
- Speak like an excited coach in a battle arena: energetic, motivating, fun.
- Use short sentences. Be direct and enthusiastic.
- Explain concepts like you're telling a story or giving battle advice.
- When showing code, always add clear comments and explain why it works.
- Encourage the user like "You're getting stronger!", "Great question, warrior!", "This move will help you win the next battle!".
- Keep responses engaging but not too long (max 180 words).
- Never use boring lists unless absolutely necessary.
- End with one helpful follow-up question or challenge only if it fits naturally.

Goal: Make the user feel like they're training for an epic battle while actually learning real skills.`
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
        temperature: 0.75,
        max_tokens: 650,
      }),
    });

    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({
      reply: "The arena is a bit chaotic right now. Ask me again!"
    }, { status: 500 });
  }
}