import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 text-white flex flex-col items-center justify-center">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to LeetRoom</h1>
        <p className="text-lg text-gray-200">
          Collaborate, Learn, and Solve Problems Together.
        </p>
      </header>
      <main className="text-center">
        <p className="text-xl mb-6">
          Join our platform to enhance your learning journey.
        </p>
        <Link
          to="/login"
          className="bg-white text-purple-700 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
        >
          Log In
        </Link>
      </main>
      <footer className="absolute bottom-4 text-gray-200 text-sm">
        © {new Date().getFullYear()} LeetRoom. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
