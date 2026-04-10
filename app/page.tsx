'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hqdxvpucazoeapxuutkp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZHh2cHVjYXpvZWFweHV1dGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTQ0NzgsImV4cCI6MjA5MTI5MDQ3OH0.aRPvkKEEZnPwsZgE2zkZRF0MH6LGyXi9tCWKayxvnFY'
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'auth' | 'chat' | 'quests' | 'certificates'>('auth');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your versatile AI Tutor at QuestTitan AI.\n\nI can answer any question — technology, world events, career advice, coding, or general knowledge.\n\nAsk me anything!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [xp, setXp] = useState(1240);
  const [level, setLevel] = useState(7);
  const [streak, setStreak] = useState(12);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [currentBattle, setCurrentBattle] = useState<any>(null);
  const [battleAnswer, setBattleAnswer] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) setActiveTab('chat');
    });
  }, []);

  const handleAuth = async () => {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Check your email to confirm your account!");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('auth');
  };

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
      setMessages(prev => [...prev, { role: 'assistant', content: "The arena connection is unstable. Ask me again!" }]);
    }
    setIsLoading(false);
  };

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(?:python)?\n?/, '').replace(/```$/, '').trim();
        return (
          <div key={index} className="bg-black border border-cyan-500/50 p-6 rounded-3xl my-4 font-mono text-sm overflow-x-auto">
            {code}
          </div>
        );
      }
      return <p key={index} className="mb-3 leading-relaxed">{part}</p>;
    });
  };

  const startBattle = (questName: string, xpReward: number) => {
    const battles = {
      "Print your first message": { question: "Write Python code that prints exactly: 'Hello Arena!'", answer: "print", reward: xpReward },
      "Master For Loops": { question: "Write a for loop that prints numbers from 1 to 5, each on a new line.", answer: "for", reward: xpReward },
      "Build a simple calculator": { question: "Write a Python function named add that returns the sum of two numbers.", answer: "def", reward: xpReward }
    };

    setCurrentBattle({
      name: questName,
      ...battles[questName as keyof typeof battles]
    });
    setBattleAnswer('');
  };

  const submitBattleAnswer = () => {
    if (!currentBattle) return;

    if (battleAnswer.toLowerCase().includes(currentBattle.answer)) {
      const newXp = xp + currentBattle.reward;
      setXp(newXp);
      setCompletedQuests(prev => [...prev, currentBattle.name]);

      // Save certificate to Supabase
      const certId = 'CERT-' + Date.now().toString().slice(-8);
      supabase.from('certificates').insert({
        user_id: user.id,
        certificate_id: certId,
        title: currentBattle.name,
        skills: "Python Programming",
        issued_at: new Date().toISOString(),
        xp_earned: currentBattle.reward
      });

      if (newXp >= level * 300) setLevel(prev => prev + 1);

      alert(`🏆 BATTLE WON!\n\nYou survived "${currentBattle.name}"\n+${currentBattle.reward} XP\n\nCertificate #${certId} saved!`);
      setCurrentBattle(null);
      setBattleAnswer('');
    } else {
      alert("Not quite right. Ask the AI Tutor for a hint!");
    }
  };

  const isQuestCompleted = (questName: string) => completedQuests.includes(questName);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <nav className="border-b border-cyan-500/30 bg-black/95 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_0_30px_-10px] shadow-purple-500">
        <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_25px_-5px] shadow-purple-500">
              ⚔️
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">QUESTTITAN</h1>
              <p className="text-xs text-purple-400 tracking-[3px] -mt-1">BATTLE • LEARN • LEVEL UP</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-8 text-sm font-medium">
              <div className="text-cyan-400">LV.{level}</div>
              <div className="text-purple-400">{xp} XP</div>
              <div className="text-pink-400">🔥 {streak} STREAK</div>
              <button onClick={signOut} className="text-zinc-400 hover:text-white">EXIT ARENA</button>
            </div>
          )}
        </div>

        {user && (
          <div className="max-w-7xl mx-auto px-10 flex border-t border-cyan-500/20">
            <button onClick={() => setActiveTab('chat')} className={`px-12 py-4 font-medium transition-all border-b-2 ${activeTab === 'chat' ? 'border-cyan-400 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>AI TUTOR</button>
            <button onClick={() => setActiveTab('quests')} className={`px-12 py-4 font-medium transition-all border-b-2 ${activeTab === 'quests' ? 'border-cyan-400 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>BATTLE ARENA</button>
            <button onClick={() => setActiveTab('certificates')} className={`px-12 py-4 font-medium transition-all border-b-2 ${activeTab === 'certificates' ? 'border-cyan-400 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>CERTIFICATES</button>
          </div>
        )}
      </nav>

      {!user ? (
        <div className="flex items-center justify-center min-h-[85vh]">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-16 w-full max-w-md text-center shadow-[0_0_60px_-20px] shadow-purple-500">
            <div className="text-7xl mb-8">⚔️</div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ENTER THE ARENA</h2>
            <p className="text-zinc-400 mb-10">Battle your way to mastery</p>

            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-purple-500/50 rounded-2xl px-8 py-4 mb-5 text-center" />
            <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-purple-500/50 rounded-2xl px-8 py-4 mb-10 text-center" />

            <button onClick={handleAuth} className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 py-5 rounded-2xl font-bold text-lg tracking-wider mb-6">
              {isLogin ? 'ENTER ARENA' : 'CREATE LEGEND'}
            </button>
          </div>
        </div>
      ) : activeTab === 'chat' ? (
        // Open AI Tutor
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-7xl mx-auto px-10 py-12">
          <div className="lg:col-span-5">
            <h1 className="text-6xl font-bold tracking-tighter leading-tight mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI TUTOR ARENA
            </h1>
            <p className="text-2xl text-zinc-400">
              Ask me anything — technology, world events, career advice, coding, or general knowledge.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-zinc-900 border border-cyan-500/30 rounded-3xl h-[760px] flex flex-col overflow-hidden shadow-[0_0_40px_-10px] shadow-purple-500">
              <div className="px-10 py-7 border-b border-cyan-500/30 flex items-center gap-5 bg-black">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl flex items-center justify-center text-4xl shadow-[0_0_20px] shadow-cyan-400">🤖</div>
                <div>
                  <div className="font-bold text-2xl">AI TUTOR</div>
                  <div className="text-cyan-400 text-sm">Open • Versatile • Always Ready</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-9">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-7 rounded-3xl ${msg.role === 'user' ? 'bg-purple-600' : 'bg-zinc-900 border border-cyan-500/30'}`}>
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="bg-black p-7 rounded-3xl text-cyan-400">Thinking...</div>}
              </div>

              <div className="p-8 border-t border-cyan-500/30 bg-black">
                <div className="flex gap-4">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything about technology or the world..."
                    className="flex-1 bg-black border border-cyan-500/50 rounded-3xl px-8 py-5 focus:border-purple-500"
                  />
                  <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-cyan-400 to-purple-500 px-14 rounded-3xl font-bold disabled:opacity-50">
                    SEND
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'quests' ? (
        // Battle Arena
        <div className="max-w-7xl mx-auto px-10 py-12">
          <h2 className="text-5xl font-bold tracking-tighter mb-12 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">BATTLE ARENA</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-12">
              <h3 className="text-3xl font-bold mb-4 text-cyan-400">PYTHON SURVIVAL</h3>
              <p className="text-zinc-400 mb-10">Prove your coding skills to survive</p>
              <div className="space-y-6">
                {[
                  { title: "Print your first message", xp: 50 },
                  { title: "Master For Loops", xp: 50 },
                  { title: "Build a simple calculator", xp: 50 }
                ].map((q) => (
                  <div key={q.title} className={`p-7 rounded-3xl border border-purple-500/30 flex justify-between items-center hover:border-cyan-400 transition-all ${isQuestCompleted(q.title) ? 'border-emerald-500' : ''}`}>
                    <div>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-sm text-zinc-500">+{q.xp} XP</p>
                    </div>
                    <button 
                      onClick={() => startBattle(q.title, q.xp)}
                      disabled={isQuestCompleted(q.title)}
                      className={`px-10 py-3.5 rounded-2xl text-sm font-medium ${isQuestCompleted(q.title) ? 'bg-emerald-600' : 'bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110'}`}
                    >
                      {isQuestCompleted(q.title) ? '✓ WON' : 'ENTER BATTLE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Certificates Tab
        <div className="max-w-7xl mx-auto px-10 py-12">
          <h2 className="text-5xl font-bold tracking-tighter mb-12 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">YOUR CERTIFICATES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certificates.length > 0 ? certificates.map((cert, index) => (
              <div key={index} className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-10 text-center">
                <div className="text-6xl mb-6">🏆</div>
                <h3 className="text-2xl font-bold mb-2">{cert.title}</h3>
                <p className="text-zinc-400">Issued on {new Date(cert.issued_at).toLocaleDateString()}</p>
                <button className="mt-6 bg-gradient-to-r from-cyan-400 to-purple-500 px-10 py-3 rounded-2xl text-sm font-medium">Download Certificate</button>
              </div>
            )) : (
              <div className="col-span-2 text-center text-zinc-400 py-20">
                No certificates yet. Win battles to earn verifiable certificates for your resume!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battle Modal */}
      {currentBattle && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100]">
          <div className="bg-zinc-900 border border-cyan-400 rounded-3xl p-12 max-w-lg w-full text-center">
            <h3 className="text-3xl font-bold mb-6 text-cyan-400">BATTLE: {currentBattle.name}</h3>
            <p className="text-xl mb-8">{currentBattle.question}</p>
            
            <input
              type="text"
              value={battleAnswer}
              onChange={(e) => setBattleAnswer(e.target.value)}
              placeholder="Type your code or answer..."
              className="w-full bg-black border border-cyan-500 rounded-2xl px-8 py-5 mb-8 text-center"
            />

            <div className="flex gap-4">
              <button onClick={() => setCurrentBattle(null)} className="flex-1 py-4 rounded-2xl border border-zinc-700 text-zinc-400">Leave Battle</button>
              <button onClick={submitBattleAnswer} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 font-bold">SUBMIT & SURVIVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}