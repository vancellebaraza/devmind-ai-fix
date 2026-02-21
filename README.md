🧠 DevMind AI
Fix faster. Learn forever.
DevMind AI is a context-aware debugging assistant that doesn't just fix your code — it makes you a better developer over time. Paste broken code, get the root cause, the exact fix, and a clear explanation tailored to your stack and experience level.

✨ Features
⚡ Instant Code Fix & Root Cause Analysis
Paste broken code or an error message. DevMind identifies the root cause, returns the exact fixed code, and explains what went wrong — tailored to your specific tech stack. No generic advice. No guessing.
🔍 Whole File Scanner
Paste an entire file and DevMind scans every function, flagging:
🔴 Critical bugs — things that will break your app
🟡 Warnings — anti-patterns and risky code
🔵 Suggestions — performance improvements and best practices

🎚️ ELI5 / Expert Toggle
One toggle. Two audiences.
Expert mode — concise, technical, no hand-holding
ELI5 mode — plain English with analogies, perfect for beginners

🔗 Share Your Fix
Every fix session gets a unique public URL. One click copies it to your clipboard. No login required to view — share solutions with your team or on social media instantly.

🧬 Debug DNA — Your Personal Error Fingerprint
This is what makes DevMind different from every other tool.
After 3+ sessions, DevMind builds your Debug DNA — a living profile of your coding patterns:

📊 Your top recurring mistake patterns with actionable tips
🗂️ Language breakdown showing where you struggle most
📈 14-day activity timeline tracking your debugging frequency
🔥 Streak tracker for consecutive days of active debugging
The goal: the more you use DevMind, the less you need it.

🛠️ Tech Stack
Layer
Technology
Frontend
React + Tailwind CSS
AI Engine
Gemini 2.0 Flash API
Auth & Database
Supabase + PostgreSQL
Sharing
UUID-based public sessions

🚀 Getting Started
Prerequisites
Node.js 18+
A Supabase project
A Gemini API key from Google AI Studio
Installation

# Clone the repository
git clone https://github.com/vancellebaraza/devmind-ai-fix.git

# Navigate into the project
cd devmind-ai

# Install dependencies
npm install
Environment Variables
Create a .env file in the root directory:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
Database Setup
Run the following SQL in your Supabase SQL editor:
-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  stack_context text[] default '{}',
  created_at timestamp with time zone default timezone('utc', now())
);

-- Sessions table
create table sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  input_code text,
  fixed_code text,
  explanation text,
  root_cause text,
  summary text,
  related_risks text[],
  mode text default 'expert',
  language text,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Insights table
create table insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  insight_text text,
  related_session_ids uuid[],
  generated_at timestamp with time zone default timezone('utc', now())
);
Run the App
npm run dev
Visit http://localhost:5173 and start fixing code.

📱 Screens
Route
Description
/
Homepage with feature overview
/signup
Create an account
/login
Sign in
/setup
Pick your tech stack
/dashboard
Main fix interface
/scan
Whole file scanner
/history
Past sessions + pattern insights
/dna
Your Debug DNA profile
/share/:id
Public fix view — no login needed
/profile
Update your stack

🏆 Built For
TechThrive March 2026 Hackathon
Category: AI / Developer Tools
Prize Pool: ₹16,000
Participants: 289
🔮 What's Next
VS Code and JetBrains plugins
GitHub PR scanning and auto-review
Team-wide Debug DNA and shared pattern insights
Multi-file codebase health reports
Expanded framework-specific insights for Flutter, Swift, Kotlin, and Go
📄 License
MIT License. See LICENSE for details.
�
DevMind AI · Built with React, Gemini & Supabase
Not just a fix. A lesson. 

