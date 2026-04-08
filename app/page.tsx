'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'quests'>('chat');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi! Ready to level up your skills?\n\nAsk me anything about Python or ML, or switch to Quests to earn XP." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [xp, setXp] = useState(1240);
  const [level, setLevel] = useState(7);
  const [streak, setStreak] = useState(12);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);

  // Load saved progress
  useEffect(() => {
    const savedXp = localStorage.getItem('questtitan_xp');
    const savedLevel = localStorage.getItem('questtitan_level');
    const savedStreak = localStorage.getItem('questtitan_streak');
    const savedQuests = localStorage.getItem('questtitan_completed_quests');

    if (savedXp) setXp(parseInt(savedXp));
    if (savedLevel) setLevel(parseInt(savedLevel));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedQuests) setCompletedQuests(JSON.parse(savedQuests));
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('questtitan_xp', xp.toString());
    localStorage.setItem('questtitan_level', level.toString());
    localStorage.setItem('questtitan_streak', streak.toString());
    localStorage.setItem('questtitan_completed_quests', JSON.stringify(completedQuests));
  }, [xp, level, streak, completedQuests]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, history: messages }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, connection issue. Try again." }]);
    }
    setIsLoading(false);
  };

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(?:python)?\n?/, '').replace(/```$/, '').trim();
        return (
          <div key={index} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl my-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {code}
          </div>
        );
      }
      return <p key={index} className="mb-3 leading-relaxed">{part}</p>;
    });
  };

  const completeQuest = (questXp: number, questName: string) => {
    if (completedQuests.includes(questName)) return;

    const newXp = xp + questXp;
    setXp(newXp);
    setCompletedQuests(prev => [...prev, questName]);

    if (newXp >= level * 300) {
      setLevel(prev => prev + 1);
    }

    alert(`🎉 Quest Completed!\n\n"${questName}"\n+${questXp} XP\n\nGreat work! Keep building your skills.`);
  };

  const isQuestCompleted = (questName: string) => completedQuests.includes(questName);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-white/10 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl shadow-2xl">
              ⚔️
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tighter">QuestTitan AI</h1>
              <p className="text-xs text-zinc-500 -mt-1">Skill Development Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm">
            <div>Level <span className="font-semibold text-violet-400">{level}</span></div>
            <div>{xp} XP</div>
            <div>🔥 {streak} streak</div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 flex border-t border-white/10">
          <button onClick={() => setActiveTab('chat')} className={`px-10 py-4 font-medium ${activeTab === 'chat' ? 'border-b-2 border-violet-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
            AI Tutor
          </button>
          <button onClick={() => setActiveTab('quests')} className={`px-10 py-4 font-medium ${activeTab === 'quests' ? 'border-b-2 border-violet-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
            Quests
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h1 className="text-6xl font-semibold tracking-tighter leading-none mb-8">
                Learn with Confidence
              </h1>
              <p className="text-xl text-zinc-400">
                Your AI Tutor is here to explain concepts clearly and run your code live.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden h-[700px] flex flex-col">
                <div className="px-8 py-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-950">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl">🤖</div>
                  <div>
                    <div className="font-semibold">AI Tutor</div>
                    <div className="text-emerald-400 text-sm">Code Execution • Step-by-step guidance</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] p-6 rounded-3xl ${msg.role === 'user' ? 'bg-violet-600' : 'bg-zinc-800 border border-zinc-700'}`}>
                        {formatMessage(msg.content)}
                      </div>
                    </div>
                  ))}
                  {isLoading && <div className="bg-zinc-800 p-6 rounded-3xl">Thinking...</div>}
                </div>

                <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                  <div className="flex gap-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask a question or paste code to run..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-3xl px-7 py-4 focus:border-violet-500"
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-violet-600 hover:bg-violet-700 px-10 rounded-3xl font-medium disabled:opacity-50">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Improved Quests Tab
          <div>
            <div className="mb-12">
              <h2 className="text-5xl font-semibold tracking-tighter">Learning Quests</h2>
              <p className="text-zinc-400 mt-3">Build real skills. Earn XP. Track your progress.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Python Quest */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-emerald-400 uppercase text-sm tracking-widest font-medium">Module 1</div>
                    <h3 className="text-3xl font-semibold mt-2">Python Fundamentals</h3>
                  </div>
                  <div className="text-5xl">🐍</div>
                </div>

                <div className="space-y-6">
                  {[
                    { id: "hello", title: "Print Hello World", xp: 50 },
                    { id: "forloop", title: "Master For Loops", xp: 50 },
                    { id: "calculator", title: "Simple Calculator", xp: 50 }
                  ].map((q) => (
                    <div key={q.id} className={`p-6 rounded-2xl border flex justify-between items-center ${isQuestCompleted(q.title) ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700'}`}>
                      <div>
                        <p className="font-medium">{q.title}</p>
                        <p className="text-sm text-zinc-500">+{q.xp} XP</p>
                      </div>
                      <button 
                        onClick={() => completeQuest(q.xp, q.title)}
                        disabled={isQuestCompleted(q.title)}
                        className={`px-8 py-3 rounded-2xl text-sm font-medium ${isQuestCompleted(q.title) ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                      >
                        {isQuestCompleted(q.title) ? '✓ Completed' : 'Complete'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ML Quest */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 relative">
                <div className="absolute top-6 right-6 text-amber-400 text-sm font-medium">COMING SOON</div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-amber-400 uppercase text-sm tracking-widest font-medium">Module 2</div>
                    <h3 className="text-3xl font-semibold mt-2 text-zinc-400">Machine Learning Basics</h3>
                  </div>
                  <div className="text-5xl opacity-40">🧠</div>
                </div>
                <p className="text-zinc-500">Unlock after completing Python Fundamentals</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}