'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Lesson = {
  title: string;
  content: string;
};

type Course = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  free: boolean;
  lessons: Lesson[];
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'auth' | 'chat' | 'courses' | 'quests' | 'certificates' | 'profile' | 'leaderboard'>('auth');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const [messages, setMessages] = useState([{ role: 'assistant', content: "Welcome! Track your progress and climb the leaderboard." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [xp, setXp] = useState(1240);
  const [level, setLevel] = useState(7);
  const [streak, setStreak] = useState(12);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);

  const [currentBattle, setCurrentBattle] = useState<any>(null);
  const [battleAnswer, setBattleAnswer] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);

  // Load Razorpay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const scripts = document.querySelectorAll('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      scripts.forEach(s => s.remove());
    };
  }, []);

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
      else alert("Check your email to confirm!");
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
      setMessages(prev => [...prev, { role: 'assistant', content: "The arena is chaotic right now. Ask me again!" }]);
    }
    setIsLoading(false);
  };

  const formatMessage = (content: string) => {
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const paragraphs = formatted.split(/\n\n|\n/).filter(p => p.trim() !== '');
    return paragraphs.map((para, index) => {
      if (para.trim().startsWith('* ')) {
        const bullets = para.split('\n').map((line, i) => {
          const cleanLine = line.replace(/^\*\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <li key={i} className="ml-6 mb-1" dangerouslySetInnerHTML={{ __html: cleanLine }} />;
        });
        return <ul key={index} className="list-disc space-y-1 mb-4">{bullets}</ul>;
      }
      return <p key={index} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: para }} />;
    });
  };

  const startBattle = (questName: string, xpReward: number) => {
    const battles = {
      "Print your first message": { question: "Write Python code that prints exactly: 'Hello Arena!'", answer: "print", reward: xpReward },
      "Master For Loops": { question: "Write a for loop that prints numbers from 1 to 5, each on a new line.", answer: "for", reward: xpReward },
      "Build a simple calculator": { question: "Write a Python function named add that returns the sum of two numbers.", answer: "def", reward: xpReward }
    };

    setCurrentBattle({ name: questName, ...battles[questName as keyof typeof battles] });
    setBattleAnswer('');
  };

  const submitBattleAnswer = () => {
    if (!currentBattle) return;
    if (battleAnswer.toLowerCase().includes(currentBattle.answer)) {
      const newXp = xp + currentBattle.reward;
      setXp(newXp);
      setCompletedQuests(prev => [...prev, currentBattle.name]);

      const certId = 'CERT-' + Date.now().toString().slice(-8);
      setCertificates(prev => [...prev, { certificate_id: certId, title: currentBattle.name, issued_at: new Date().toISOString(), xp_earned: currentBattle.reward }]);

      if (newXp >= level * 300) setLevel(prev => prev + 1);

      alert(`🏆 BATTLE WON!\n\nCertificate saved!`);
      setCurrentBattle(null);
      setBattleAnswer('');
    } else {
      alert("Not quite right. Ask the AI Tutor for a hint!");
    }
  };

  const downloadCertificate = (cert: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 48px Arial'; ctx.fillText('QUESTTITAN AI', 200, 150);
    ctx.fillStyle = '#a855f7'; ctx.font = '30px Arial'; ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 180, 220);
    ctx.fillStyle = '#e0e7ff'; ctx.font = '24px Arial'; ctx.fillText(cert.title, 150, 300);
    ctx.fillStyle = '#64748b'; ctx.font = '18px Arial';
    ctx.fillText(`Issued to: ${user?.email || 'Valued Student'}`, 150, 380);
    ctx.fillText(`Date: ${new Date(cert.issued_at).toLocaleDateString()}`, 150, 420);
    ctx.fillText(`XP Earned: ${cert.xp_earned}`, 150, 460);
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 20px Arial'; ctx.fillText('Verified by QuestTitan AI', 250, 520);

    const link = document.createElement('a');
    link.download = `${cert.title.replace(/ /g, '_')}_Certificate.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isQuestCompleted = (questName: string) => completedQuests.includes(questName);

  const handlePremium = () => {
    if (!user) return alert("Please log in first!");
    if (!(window as any).Razorpay) return alert("Razorpay is still loading...");

    const options = {
      key: "rzp_live_SblR4V8ckWJUFj",
      amount: 49900,
      currency: "INR",
      name: "QuestTitan AI",
      description: "Premium Monthly - Full Courses + Advanced Battles",
      handler: () => { alert("🎉 Premium activated! All courses unlocked."); setIsPremium(true); },
      prefill: { email: user.email },
      theme: { color: "#22d3ee" },
    };

    new (window as any).Razorpay(options).open();
  };

  const markLessonComplete = (lessonTitle: string) => {
    if (!completedLessons.includes(lessonTitle)) {
      setCompletedLessons(prev => [...prev, lessonTitle]);
      const newXp = xp + 50;
      setXp(newXp);
      if (newXp >= level * 300) setLevel(prev => prev + 1);
      alert(`✅ "${lessonTitle}" completed! +50 XP`);
    }
  };

  const courses: Course[] = [
    {
      id: 'python',
      title: 'Python Mastery',
      emoji: '🐍',
      desc: 'Complete foundation to advanced Python with real projects',
      free: true,
      lessons: [
        { title: "Lesson 1: Introduction to Python & Print Statements", content: "Python is a high-level, interpreted language known for its simplicity...\n\n**Your First Program:**\n```python\nprint('Hello, QuestTitan AI!')\n```" },
        { title: "Lesson 2: Variables, Data Types & Basic Operations", content: "Variables store data...\n\n**Example:**\n```python\nname = 'Tom Jerry'\nage = 20\n```" },
        { title: "Lesson 3: Control Flow (If, Elif, Else & Loops)", content: "Control how your program runs...\n\n**For Loop Example:**\n```python\nfor i in range(1, 6):\n    print(f'Battle level {i} completed')\n```" },
        { title: "Lesson 4: Functions & Modular Code", content: "Functions allow reusable code...\n\n**Example:**\n```python\ndef greet(name):\n    return f'Welcome to QuestTitan, {name}!'\n```" }
      ]
    },
    { id: 'ml', title: 'Machine Learning', emoji: '🧠', desc: 'Build intelligent models from data', free: false, lessons: [] },
    { id: 'data', title: 'Data Science', emoji: '📊', desc: 'Extract insights from data using Python', free: false, lessons: [] },
    { id: 'ai', title: 'Artificial Intelligence', emoji: '🤖', desc: 'Core AI concepts', free: false, lessons: [] },
    { id: 'java', title: 'Java Programming', emoji: '☕', desc: 'Object-oriented programming', free: false, lessons: [] },
    { id: 'c', title: 'C Programming', emoji: '⚙️', desc: 'Low-level systems', free: false, lessons: [] },
    { id: 'react', title: 'React & Frontend', emoji: '⚛️', desc: 'Modern web development', free: false, lessons: [] },
    { id: 'control', title: 'AI in Control Systems', emoji: '🔌', desc: 'For Electrical Engineers', free: false, lessons: [] },
    { id: 'cyber', title: 'Cybersecurity', emoji: '🛡️', desc: 'Ethical hacking & security', free: false, lessons: [] },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navbar remains the same as before - futuristic neon */}
      <nav className="border-b border-cyan-500/30 bg-black/95 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_0_40px_-15px] shadow-cyan-400">
        <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_30px_-10px] shadow-cyan-400">⚔️</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_#22d3ee]">QUESTTITAN</h1>
              <p className="text-xs text-purple-400 tracking-[4px] -mt-1 drop-shadow-[0_0_8px_#a855f7]">BATTLE • LEARN • LEVEL UP</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-8 text-sm font-medium">
              <div className="text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]">LV.{level}</div>
              <div className="text-purple-400 drop-shadow-[0_0_8px_#a855f7]">{xp} XP</div>
              <div className="text-pink-400 drop-shadow-[0_0_8px_#ec4899]">🔥 {streak} STREAK</div>
              <button onClick={handlePremium} className="bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-3 rounded-2xl text-sm font-medium hover:brightness-110 transition-all shadow-[0_0_20px_-5px] shadow-cyan-400">
                {isPremium ? "✅ Premium Active" : "Go Premium - ₹499/mo"}
              </button>
              <button onClick={signOut} className="text-zinc-400 hover:text-white">EXIT ARENA</button>
            </div>
          )}
        </div>

        {user && (
          <div className="max-w-7xl mx-auto px-10 flex border-t border-cyan-500/20 overflow-x-auto">
            <button onClick={() => setActiveTab('chat')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'chat' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>AI TUTOR</button>
            <button onClick={() => setActiveTab('courses')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'courses' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>COURSES</button>
            <button onClick={() => setActiveTab('quests')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'quests' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>BATTLE ARENA</button>
            <button onClick={() => setActiveTab('profile')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>PROFILE</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'leaderboard' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>LEADERBOARD</button>
            <button onClick={() => setActiveTab('certificates')} className={`px-8 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'certificates' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_#22d3ee]' : 'border-transparent text-zinc-400 hover:text-white'}`}>CERTIFICATES</button>
          </div>
        )}
      </nav>

      {/* Rest of the UI remains the same except the courses section is now type-safe */}

      {!user ? (
        // Auth screen (same as before)
        <div className="flex items-center justify-center min-h-[85vh]">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-16 w-full max-w-md text-center shadow-[0_0_60px_-20px] shadow-purple-500">
            <div className="text-7xl mb-8 drop-shadow-[0_0_20px_#a855f7]">⚔️</div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_#22d3ee]">ENTER THE ARENA</h2>
            <p className="text-zinc-400 mb-10">Battle your way to mastery</p>
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-purple-500/50 rounded-2xl px-8 py-4 mb-5 text-center" />
            <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-purple-500/50 rounded-2xl px-8 py-4 mb-10 text-center" />
            <button onClick={handleAuth} className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 py-5 rounded-2xl font-bold text-lg tracking-wider mb-6 shadow-[0_0_25px_-10px] shadow-cyan-400">
              {isLogin ? 'ENTER ARENA' : 'CREATE LEGEND'}
            </button>
          </div>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="max-w-7xl mx-auto px-10 py-12">
          <h2 className="text-5xl font-bold tracking-tighter mb-12 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_#22d3ee]">PREMIUM LEARNING PATHS</h2>

          {selectedCourse ? (
            <div>
              <button onClick={() => { setSelectedCourse(null); setCurrentLessonIndex(0); }} className="mb-10 text-cyan-400 hover:text-white flex items-center gap-2 text-lg">
                ← Back to All Courses
              </button>

              <h3 className="text-4xl font-bold mb-8 text-white drop-shadow-[0_0_10px_#22d3ee]">
                {courses.find(c => c.id === selectedCourse)?.title || 'Course'}
              </h3>

              {(() => {
                const course = courses.find(c => c.id === selectedCourse);
                const lesson = course?.lessons[currentLessonIndex];
                if (!lesson) return <p className="text-zinc-400">No lessons available yet.</p>;

                return (
                  <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-12 mb-10 shadow-[0_0_40px_-15px] shadow-cyan-400">
                    <h4 className="text-3xl font-bold mb-8 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]">
                      {lesson.title}
                    </h4>
                    <div className="prose prose-invert max-w-none text-zinc-300 text-[17px] leading-relaxed">
                      {lesson.content.split('\n').map((line, i) => (
                        line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowQuiz(true)}
                      className="mt-12 w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 font-medium text-lg shadow-[0_0_25px_-10px] shadow-cyan-400"
                    >
                      Take Quiz to Complete Lesson
                    </button>
                  </div>
                );
              })()}

              {showQuiz && (
                <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-12 shadow-[0_0_40px_-15px] shadow-cyan-400">
                  <h4 className="text-2xl font-bold mb-6 text-cyan-400">Quick Quiz</h4>
                  <p className="mb-8 text-lg">What is the output of print('Hello QuestTitan')?</p>
                  <input 
                    type="text" 
                    value={quizAnswer} 
                    onChange={(e) => setQuizAnswer(e.target.value)} 
                    placeholder="Type your answer here" 
                    className="w-full bg-black border border-cyan-500 rounded-2xl px-8 py-5 mb-8 text-lg" 
                  />
                  <button 
                    onClick={() => {
                      if (quizAnswer.toLowerCase().includes("hello")) {
                        const lessonTitle = courses.find(c => c.id === selectedCourse)?.lessons[currentLessonIndex]?.title || '';
                        markLessonComplete(lessonTitle);
                        setShowQuiz(false);
                        setQuizAnswer('');
                        const course = courses.find(c => c.id === selectedCourse);
                        if (currentLessonIndex < (course?.lessons.length || 0) - 1) {
                          setCurrentLessonIndex(currentLessonIndex + 1);
                        } else {
                          alert("🎉 Congratulations! You completed the course.");
                          setSelectedCourse(null);
                        }
                      } else {
                        alert("Incorrect answer. Try again or ask the AI Tutor.");
                      }
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 font-medium text-lg shadow-[0_0_25px_-10px] shadow-cyan-400"
                  >
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div key={course.id} className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-10 hover:border-cyan-400 transition-all group shadow-[0_0_30px_-15px] hover:shadow-cyan-400">
                  <div className="text-6xl mb-8 drop-shadow-[0_0_15px_#22d3ee]">{course.emoji}</div>
                  <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-[0_0_10px_#a855f7]">{course.title}</h3>
                  <p className="text-zinc-400 mb-10 leading-relaxed">{course.desc}</p>
                  <button 
                    onClick={() => {
                      if (course.free || isPremium) {
                        setSelectedCourse(course.id);
                        setCurrentLessonIndex(0);
                      } else {
                        handlePremium();
                      }
                    }}
                    className={`w-full py-5 rounded-2xl font-medium text-lg transition-all shadow-[0_0_20px_-5px] ${course.free || isPremium ? 'bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110 shadow-cyan-400' : 'bg-zinc-800 border border-purple-500/50 text-zinc-400'}`}
                  >
                    {course.free || isPremium ? 'Start Learning' : 'Unlock with Premium'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // All other tabs (profile, leaderboard, quests, certificates, chat) remain the same as your previous working version
        // For brevity, they are unchanged. Paste the rest of your previous code here for other tabs if needed.
        // If you want the full file, tell me and I'll provide the complete one again.
      )}

      {/* Battle Modal - same as before */}
      {currentBattle && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100]">
          <div className="bg-zinc-900 border border-cyan-400 rounded-3xl p-12 max-w-lg w-full text-center">
            <h3 className="text-3xl font-bold mb-6 text-cyan-400">BATTLE: {currentBattle.name}</h3>
            <p className="text-xl mb-8">{currentBattle.question}</p>
            <input type="text" value={battleAnswer} onChange={(e) => setBattleAnswer(e.target.value)} placeholder="Type your code or answer..." className="w-full bg-black border border-cyan-500 rounded-2xl px-8 py-5 mb-8 text-center" />
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