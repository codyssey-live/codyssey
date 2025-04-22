import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="min-h-screen bg-blue-50 text-black flex flex-col">
      {/* Hero Section */}
      <header className="text-center py-20 bg-gradient-to-b from-purple-50 to-blue-100">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <img 
            src="/logo.svg" 
            alt="Codyssey Logo" 
            className="h-40 mx-auto"
          />
        </motion.div>
        <motion.h1
          className="text-5xl font-extrabold mb-4 text-black"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Code the Journey
        </motion.h1>
        <motion.p
          className="text-lg text-black mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Collaborate, Learn, and Solve Problems Together with Codyssey.
        </motion.p>
        <motion.div
          className="space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Link
            to="/signup"
            className="bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg shadow-sm hover:bg-blue-600 transition-all transform hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="bg-indigo-100 text-slate-700 font-semibold py-3 px-8 rounded-lg shadow-sm border border-slate-200 hover:bg-indigo-200 transition-all transform hover:scale-105"
          >
            Login
          </Link>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-6 bg-indigo-50">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">Features</h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
          }}
        >
          {[
            { icon: "👥", title: "Learn DSA with Friends", description: "Collaborate in real-time with peers to solve challenging problems." },
            { icon: "🎥", title: "Watch Videos Together", description: "Learn with curated tutorials in synchronized viewing sessions." },
            { icon: "💬", title: "Real-time Chat & Code Sharing", description: "Share and review code seamlessly with integrated tools." },
            { icon: "📊", title: "Track Your Progress", description: "Monitor your learning journey with detailed analytics." },
            { icon: "📁", title: "Annual Report Portal", description: "Access comprehensive reports of your growth over time." },
            { icon: "🧠", title: "Smart Dashboard", description: "Get personalized insights and recommendations for improvement." },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center bg-blue-100 p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
              whileHover={{ scale: 1.03 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-black">{feature.title}</h3>
              <p className="text-black">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 bg-purple-50">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">How it Works</h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
          }}
        >
          {[
            { step: "1", title: "Sign Up", description: "Create your account to get started." },
            { step: "2", title: "Add Friends / Join Room", description: "Collaborate with peers." },
            { step: "3", title: "Solve, Watch & Learn", description: "Achieve your goals together." },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center bg-blue-100 p-8 rounded-xl shadow-sm border border-slate-100"
              whileHover={{ scale: 1.05 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className="bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold mb-4 shadow-sm">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">{item.title}</h3>
              <p className="text-black">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Preview Section */}
      <section className="py-20 px-6 bg-blue-50">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">Preview</h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.2 } },
          }}
        >
          {["Dashboard", "Collaboration Room", "Daily Plan"].map((title, index) => (
            <motion.div
              key={index}
              className="bg-indigo-100 p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
              whileHover={{ scale: 1.05 }}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <h3 className="text-xl font-semibold mb-4 text-black">{title}</h3>
              <div className="h-40 bg-purple-100 rounded-lg"></div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-100 py-8 text-center text-black mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Codyssey. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link to="/about" className="hover:text-blue-600 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
            <Link to="/feedback" className="hover:text-blue-600 transition-colors">Feedback</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
