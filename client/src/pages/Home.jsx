import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";

const Home = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Track section changes based on scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) setCurrentSection(0);
    else if (latest < 0.66) setCurrentSection(1);
    else setCurrentSection(2);
  });

  // Code snippets for the interactive code section
  const codeSnippets = [
    { 
      language: "javascript", 
      code: `function collaborate(developers) {
  return developers.map(dev => dev.skills)
    .reduce((all, skills) => [...all, ...skills]);
}` 
    },
    { 
      language: "python", 
      code: `def solve_together(problem):
    solutions = []
    for approach in team.brainstorm():
        if approach.is_optimal():
            solutions.append(approach)
    return solutions` 
    },
    { 
      language: "java", 
      code: `public class LearningTogether {
    public static void main(String[] args) {
        Team team = new Team();
        team.collaborate();
        team.solve();
    }
}` 
    }
  ];

  const handleJourneyStart = () => {
    setShowLoginOptions(true);
  };

  return (
    // Modified container with tighter overflow control
    <div className="w-full min-h-screen bg-[#0f172a] overflow-hidden">
      {/* Floating Navigation Indicator - removed z-50 to restore normal scrolling behavior */}
      <div className="fixed right-10 top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              currentSection === index ? "bg-[#94C3D2] scale-125" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Section 1: Hero */}
      <section className="h-screen w-full relative overflow-hidden flex items-center justify-center">
        {/* Animated Gradient Background - Modified to ensure it stays within bounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]">
          {/* Particle effect - Modified to ensure boundaries are respected */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              initial={{
                opacity: Math.random() * 0.5 + 0.1,
                scale: Math.random() * 0.5 + 0.5,
                x: `${Math.random() * 90 + 5}%`, // Ensuring particles start within safe bounds
                y: `${Math.random() * 90 + 5}%`, // Ensuring particles start within safe bounds
              }}
              animate={{
                opacity: [Math.random() * 0.5 + 0.1, Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.1],
                scale: [Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 1, Math.random() * 0.5 + 0.5],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
              }}
            />
          ))}
        </div>

        {/* Content Container - Centered with no absolute positioning */}
        <motion.div
          className="relative z-10 text-center max-w-4xl px-8"
        >
          {/* Logo - Updated sizes to make it bigger */}
          <motion.img
            src="/logo.svg"
            alt="Codyssey Logo"
            className="h-40 md:h-56 lg:h-64 mx-auto mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              filter: ["drop-shadow(0 0 8px rgba(148, 195, 210, 0.3))", "drop-shadow(0 0 16px rgba(148, 195, 210, 0.2))", "drop-shadow(0 0 8px rgba(148, 195, 210, 0.3))"]
            }}
            transition={{ 
              duration: 1.5,
              filter: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{
              x: mousePosition.x * -20,
              y: mousePosition.y * -20,
            }}
          />

          {/* Poetic Headline */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
              Where Code Flows and Minds Converge
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-[#94C3D2]/90 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            A space for collaborative creation and shared discovery. Build together. Learn together.
          </motion.p>

          <motion.button
            className="px-8 py-4 bg-transparent border-2 border-[#94C3D2] text-[#94C3D2] rounded-full font-medium text-lg transition-all"
            whileHover={{ 
              backgroundColor: "rgba(148, 195, 210, 0.1)", 
              boxShadow: "0 0 20px rgba(148, 195, 210, 0.3)",
              scale: 1.05 
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            onClick={handleJourneyStart}
          >
            Begin Your Journey
          </motion.button>

          <AnimatePresence>
            {showLoginOptions && (
              <motion.div
                className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-center"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-[#94C3D2] text-white rounded-full font-medium text-lg relative overflow-hidden"
                  style={{
                    boxShadow:  "0 0 10px rgba(148, 195, 210, 0.4), 0 0 20px rgba(148, 195, 210, 0.2)"}}
                >
                  <span className="relative z-10">Create Account</span>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ 
                      x: ["100%", "-100%"],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut" 
                    }}
                  />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-[#94C3D2] text-white rounded-full font-medium text-lg relative overflow-hidden"
                  style={{
                    boxShadow: "0 0 10px rgba(148, 195, 210, 0.4), 0 0 20px rgba(148, 195, 210, 0.2)"}}
                >
                  <span className="relative z-10">Sign In</span>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ 
                      x: ["100%", "-100%"],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-[#94C3D2]"
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </motion.div>
      </section>

      {/* Section 2: Interactive Code Blocks */}
      <section className="h-screen w-full relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b]"></div>

        <motion.div
          className="relative z-10 w-full h-full flex flex-col items-center justify-center"
        >
          <motion.h2
            className="text-2xl md:text-4xl font-bold text-white mb-8 text-center px-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
              Code Together, Grow Together
            </span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 max-w-6xl mx-auto">
            {codeSnippets.map((snippet, index) => (
              <motion.div
                key={index}
                className="bg-[#1a2234] rounded-lg overflow-hidden border border-[#94C3D2]/30 shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 10px 30px -10px rgba(148, 195, 210, 0.3)"
                }}
              >
                <div className="flex items-center bg-[#0f172a] px-4 py-2">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                  </div>
                  <div className="ml-4 text-[#94C3D2] text-sm">
                    {snippet.language}
                  </div>
                </div>
                <div className="p-5">
                  <pre className="text-[#e2e8f0] font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    <motion.code
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.2, duration: 1 }}
                    >
                      {snippet.code}
                    </motion.code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <p className="text-[#94C3D2]/90 max-w-2xl mx-auto mb-8">
              Join our community of developers who learn, collaborate and solve challenges together.
              Unlock your potential through shared knowledge and collective problem-solving.
            </p>
            <Link to="/signup" className="px-6 py-3 bg-[#94C3D2] text-white rounded-lg font-medium hover:bg-opacity-90 inline-flex items-center">
              Join Today
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 3: How Codyssey Works */}
      <section className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-20">
        {/* Background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a]"></div>
        
        {/* Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          {/* Section Title */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              <span className="bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                Learn. Collaborate. Grow.
              </span>
            </h2>
            <p className="mt-4 text-[#94C3D2]/90 text-lg max-w-2xl mx-auto">
              Your path to mastering DSA concepts — together
            </p>
          </motion.div>
          
          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: DSA Learning Syllabus */}
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="h-1.5 bg-[#94C3D2]"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#94C3D2]/20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#94C3D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent mb-3">DSA Learning Syllabus</h3>
                <p className="text-white/80 leading-relaxed">
                  Plan and organize your DSA learning journey with customizable study days and problem tracking.
                </p>
                
                {/* Visual element showing the syllabus interface from screenshots */}
                <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-[#94C3D2]">Getting Started</div>
                    <div className="text-xs text-white/60">May 9</div>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mb-2">
                    <motion.div 
                      className="bg-[#94C3D2] h-1.5 rounded-full" 
                      initial={{ width: "0%" }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: false }}
                      transition={{ delay: 1, duration: 1.5 }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-white/80 flex justify-between">
                      <span>Problems</span>
                      <span>Add Problem</span>
                    </div>
                    <div className="text-xs text-white/80 flex justify-between">
                      <span>Learning Videos</span>
                      <span>Add Video</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Card 2: Collaborative Coding */}
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="h-1.5 bg-[#94C3D2]"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#94C3D2]/20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#94C3D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent mb-3">Code Collaboration Room</h3>
                <p className="text-white/80 leading-relaxed">
                  Solve problems together in real-time with shared code editor and live discussion.
                </p>
                
                {/* Visual element showing the code collaboration interface from screenshots */}
                <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="bg-green-500/20 h-2 w-2 rounded-full mr-2"></div>
                      <span className="text-sm text-white/80">Code Editor</span>
                    </div>
                    <span className="text-xs text-white/60">JavaScript</span>
                  </div>
                  
                  <div className="bg-[#1e1e1e]/80 rounded p-2 font-mono text-xs text-white/80 mb-2 overflow-hidden">
                    <span className="text-[#569cd6]">function</span> <span className="text-[#dcdcaa]">solution</span>() {
                    <div>
                      <br />
                      <span className="pl-4 text-[#6a9955]">// Your code here</span>
                      <br />
                    </div>
                    }
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-white/60">Discussion</div>
                    <div className="flex items-center">
                      <div className="bg-green-500/20 h-2 w-2 rounded-full mr-1"></div>
                      <span className="text-xs text-white/60">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Card 3: Watch Together */}
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="h-1.5 bg-[#94C3D2]"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#94C3D2]/20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#94C3D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent mb-3">Watch Together</h3>
                <p className="text-white/80 leading-relaxed">
                  Sync YouTube videos, take collaborative notes, and discuss in real-time chat.
                </p>
                
                {/* Visual element showing the Watch Together interface from screenshots */}
                <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-[#94C3D2]">Video Session</div>
                    <div className="text-xs bg-[#94C3D2]/20 text-[#94C3D2] px-2 py-0.5 rounded">Watch</div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/80">Notes</span>
                      <div className="flex items-center gap-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white/70">Paste</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white/70">View Saved</span>
                        <span className="bg-[#94C3D2] px-2 py-0.5 rounded text-white/90">Save Note</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/80">Live Chat</span>
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                        <span className="text-white/70">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* CTA Button */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: 0.6 }}
            >
              <Link
                to="/signup"
                className="px-8 py-4 bg-[#94C3D2] text-white rounded-full font-medium inline-flex items-center hover:bg-opacity-90 transition-colors shadow-lg"
                style={{ boxShadow: "0 0 15px rgba(148, 195, 210, 0.3)" }}
              >
                Start Your Journey
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
