# Codyssey – A DSA Collaboration Platform  

Codyssey is a **real-time collaborative platform** for learning and practicing Data Structures & Algorithms (DSA).  
Unlike typical coding platforms, Codyssey transforms problem-solving into a **group learning experience** — with live collaboration, synced video lectures, problem tracking, and integrated discussions.  

🌐 Live Project: [codyssey.live](https://codyssey.live)  

---

## 🚀 Features  

### 🔹 Collab Room  
- **Real-time Coding** – Built with **Monaco Editor**, supports multiple languages and code boilerplates.  
- **Code Sharing** – Users can write, copy, and share solutions instantly with peers.  
- **Live Chat** – Dedicated chat panel for code-related discussions.  
- **Notes Section** – Save notes locally during collaboration.  
- **Problem Management** – Mark problems as **Solved** or **Save for Later** for better tracking.  
- **Clipboard Integration** – Smooth copy/paste for both code and notes.  
- **Room Security** – Only users with a valid Room ID can join; expired rooms are auto-removed.  

---

### 🔹 Lecture Room  
- **Watch Together** – Sync YouTube videos across all connected users.  
- **Playback Control** – When the creator plays/pauses/seeks, guests stay perfectly in sync.  
- **Live Chat** – Discuss videos, clarify concepts, and share solutions while watching.  

---

### 🔹 Dashboard  
- **Problem Stats** – See how many problems you’ve solved vs pending.  
- **Problem Distribution** – Visual breakdown by difficulty (easy/medium/hard) and platform (LeetCode, Codeforces, etc).  
- **Problem Categories** – Manage problems under *Solved, Unsolved, and Solve Later*.  
- **Daily Plan** – Users create their own study plans by adding problem links, topics, or YouTube playlists.  
- **Invite Friends** – Share room codes with peers and collaborate instantly.  

---

### 🔹 Room Management  
- **Room Creation** – When a room is created, a unique ID is generated and stored in the database.  
- **Joining Logic** – Users can join rooms only with a valid Room ID (random or expired IDs are rejected).  
- **End Room** – When the creator ends the session, the room entry is permanently deleted.  
- **Shared State** – If one user navigates to Syllabus/Lecture/Collab, everyone gets notified to switch pages.  

---

### 🔹 User Experience & Security  
- **Responsive Design** – Optimized for mobile, tablet, and desktop.  
- **Modern UI** – Built with **Tailwind + ShadCN**, animated with **Framer Motion**.  
- **Secure Domain** – Hosted at [codyssey.live](https://codyssey.live) with **SSL certificate**.  

---

### 🔹 Email & Notifications  
- **Resend Integration** – All emails are sent via `noreply@codyssey.live`.  
- **Use Cases**:  
  - Room invitations  
  - Forgot password verification (via secure code)  
  - Transactional notifications  

---

## 🛠️ Tech Stack  

**Frontend**  
- React.js  
- Tailwind CSS  
- ShadCN UI  
- Framer Motion  
- Recharts (for stats & distribution graphs)  
- Socket.io-client  

**Backend**  
- Node.js + Express.js  
- MongoDB + Mongoose  
- Socket.io (real-time sync)  
- JWT Authentication  
- Multer + Cloudinary (file management)  

**Other Integrations**  
- Resend (Transactional Emails)  
- Google Analytics (Traffic Insights)  
- Deployment: Vercel (Frontend), Render (Backend)  
- Domain: Name.com with SSL  

---

## 🎯 Why Codyssey?  

Most coding platforms are built for **individual practice**, but learning is more effective when shared.  
Codyssey solves the **isolation problem** in DSA preparation by combining:  
- **Code Collaboration** 🧑‍💻  
- **Video Learning** 🎥  
- **Real-Time Discussion** 💬  
- **Progress Tracking** 📊  

This makes DSA prep not just effective, but **fun and engaging**.  

---

## 📩 Contact  

- 🌐 Project: [codyssey.live](https://codyssey.live)  
- 📧 Email: noreply@codyssey.live  

---

## 📜 License  

This project is licensed under the **MIT License** – open for learning and inspiration.  

---
