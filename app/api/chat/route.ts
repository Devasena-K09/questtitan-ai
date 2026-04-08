import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({ reply: "API key not configured." }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    const hasCodeBlock = message.includes('```python') || message.includes('```');

    // Improved detection for code execution
    if (hasCodeBlock || lowerMessage.includes("run this") || lowerMessage.includes("execute") || message.trim().startsWith('print') || message.includes('for ') || message.includes('def ')) {

      let code = message.trim();

      // Extract code from markdown block if present
      if (message.includes('```python')) {
        code = message.split('```python')[1]?.split('```')[0]?.trim() || code;
      } else if (message.includes('```')) {
        code = message.split('```')[1]?.split('```')[0]?.trim() || code;
      }

      try {
        const { stdout, stderr } = await execPromise(`python -c "${code.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
          timeout: 4000
        });

        const output = (stdout || stderr || "Code ran successfully with no output").trim();

        const reply = `✅ **Code executed successfully!**\n\n**Output:**\n\`\`\`\n${output}\n\`\`\``;

        return NextResponse.json({ reply });

      } catch (execError: any) {
        const errorMsg = execError.stderr || execError.message || "Execution error";
        const reply = `❌ **Code execution failed:**\n\`\`\`\n${errorMsg}\n\`\`\`\n\nTry fixing the indentation or syntax.`;
        return NextResponse.json({ reply });
      }
    }

    // Normal AI Tutor response
    const messages = [
      {
        role: "system",
        content: `You are QuestTitan AI — a friendly, patient AI Tutor for Python and ML.

Rules:
- Use simple, clear English.
- Use short sentences and bullet points.
- Be encouraging and positive.
- Show clean code with comments.
- Keep responses short (under 150 words).
- If the user pastes code, you can say "I can run this for you" but the system will handle execution.`
      },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.65,
        max_tokens: 650,
      }),
    });

    if (!groqResponse.ok) throw new Error("Groq error");

    const data = await groqResponse.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({
      reply: "Sorry, I had trouble processing that. Please try again."
    }, { status: 500 });
  }
}