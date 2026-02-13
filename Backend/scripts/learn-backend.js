#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Interactive Learning Script
 * ═══════════════════════════════════════════════════════════════════
 *
 * Run: node scripts/learn-backend.js
 *
 * An interactive terminal-based tutorial that teaches you how the
 * entire NyayBooker backend works, step by step.
 */

import * as readline from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────
// Terminal Colors
// ─────────────────────────────────────────────────────────────────
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(`\n${C.yellow}❯ ${question}${C.reset}\n${C.dim}Your answer: ${C.reset}`, (answer) => {
            resolve(answer.trim());
        });
    });
}

function waitForEnter(msg = 'Press ENTER to continue...') {
    return new Promise((resolve) => {
        rl.question(`\n${C.dim}${msg}${C.reset}`, () => resolve());
    });
}

function print(text) {
    console.log(text);
}

function header(title) {
    const line = '═'.repeat(60);
    print(`\n${C.bgBlue}${C.white}${C.bold}`);
    print(` ${line} `);
    print(`   ${title}`);
    print(` ${line} `);
    print(`${C.reset}`);
}

function subHeader(title) {
    print(`\n${C.cyan}${C.bold}── ${title} ──${C.reset}\n`);
}

function explain(text) {
    print(`${C.white}${text}${C.reset}`);
}

function code(filename, startLine = null, endLine = null) {
    const filepath = join(ROOT, filename);
    if (!existsSync(filepath)) {
        print(`${C.red}  [File not found: ${filename}]${C.reset}`);
        return;
    }
    const content = readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');

    const start = startLine ? startLine - 1 : 0;
    const end = endLine ? endLine : lines.length;
    const snippet = lines.slice(start, end);

    print(`\n${C.dim}  ┌─ ${filename} (lines ${start + 1}-${end}) ──────────${C.reset}`);
    snippet.forEach((line, i) => {
        const lineNum = String(start + i + 1).padStart(4, ' ');
        print(`${C.dim}  │ ${lineNum} │${C.reset} ${C.green}${line}${C.reset}`);
    });
    print(`${C.dim}  └──────────────────────────────────${C.reset}`);
}

function analogy(text) {
    print(`\n${C.magenta}  🍕 Real-World Analogy: ${text}${C.reset}`);
}

function tip(text) {
    print(`\n${C.bgGreen}${C.white} 💡 TIP ${C.reset} ${C.green}${text}${C.reset}`);
}

function warning(text) {
    print(`\n${C.bgYellow}${C.white} ⚠️  WARNING ${C.reset} ${C.yellow}${text}${C.reset}`);
}

async function quiz(question, correctAnswer, explanation) {
    const answer = await ask(question);
    if (answer.toLowerCase().includes(correctAnswer.toLowerCase())) {
        print(`${C.green}  ✅ Correct! ${explanation}${C.reset}`);
    } else {
        print(`${C.yellow}  💡 Not quite! The answer is: ${C.bold}${correctAnswer}${C.reset}`);
        print(`${C.white}  ${explanation}${C.reset}`);
    }
}

// ─────────────────────────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────────────────────────

async function lesson0_welcome() {
    console.clear();
    header('🎓 NyayBooker Backend - Interactive Tutorial');
    print(`
${C.white}  Welcome! This tutorial will teach you how the ENTIRE
  NyayBooker backend works — from zero to full understanding.

  ${C.bold}What you'll learn:${C.reset}${C.white}
  1. What a backend IS and WHY we need one
  2. How server.js starts everything
  3. How app.js configures the kitchen
  4. How middleware works (security guards)
  5. How routes work (the menu)
  6. How modules handle business logic
  7. How databases store data (Prisma + MongoDB)
  8. How authentication protects your app
  9. How payments, bookings, and file uploads work
  10. How everything connects together

  ${C.yellow}Rules:${C.reset}${C.white}
  - Type your answers when asked
  - Say "${C.bold}quit${C.reset}${C.white}" anytime to exit
  - Say "${C.bold}skip${C.reset}${C.white}" to skip a question
  - Say "${C.bold}repeat${C.reset}${C.white}" to re-read a section
${C.reset}`);

    await waitForEnter('Ready? Press ENTER to start Lesson 1...');
}

async function lesson1_whatIsBackend() {
    console.clear();
    header('LESSON 1: What is a Backend?');

    explain(`
  When you visit NyayBooker in a browser, you see a beautiful website
  with lawyers, booking forms, and payment buttons.

  But WHERE does the data come from? WHERE do bookings get saved?

  That's the BACKEND — the invisible engine behind the website.
`);

    analogy(`Think of a restaurant:
    • Frontend  = The dining area (what customers see)
    • Backend   = The kitchen (where food is actually made)
    • Database  = The pantry (where ingredients are stored)
    • API       = The waiter (carries orders back and forth)
    • Routes    = The menu (what items you can order)
    `);

    explain(`
  When you click "Book a Lawyer" on the website:
  1. Frontend sends a REQUEST → "Hey backend, I want to book lawyer #5"
  2. Backend RECEIVES it → checks if you're logged in, if the lawyer is free
  3. Backend talks to DATABASE → saves the booking
  4. Backend sends RESPONSE → "Done! Booking confirmed, here's the ID"
  5. Frontend SHOWS you → "Booking confirmed! ✅"
`);

    await quiz(
        'What is the "waiter" in a real backend? (API / Database / Server)',
        'API',
        'The API carries requests from the frontend to the backend and responses back — just like a waiter!'
    );

    await quiz(
        'Where is data permanently stored? (Frontend / Backend / Database)',
        'Database',
        'The database is the permanent storage — like a pantry that keeps all ingredients (data) safe.'
    );

    subHeader('Your Backend Tech Stack');
    explain(`
  NyayBooker uses these specific tools:

  ┌─────────────┬──────────────────────────────────────┐
  │ Tool        │ What it does                         │
  ├─────────────┼──────────────────────────────────────┤
  │ Node.js     │ Runs JavaScript on the server        │
  │ Express.js  │ Web framework (handles HTTP requests) │
  │ Prisma      │ Talks to PostgreSQL database          │
  │ MongoDB     │ Second database for logs/notifications│
  │ JWT         │ Authentication (login tokens)          │
  │ Zod         │ Validates data (is this email real?)   │
  │ Supabase    │ File storage (lawyer documents)        │
  └─────────────┴──────────────────────────────────────┘
`);

    await waitForEnter();
}

async function lesson2_projectStructure() {
    console.clear();
    header('LESSON 2: Project Structure — The Map');

    explain(`
  Before diving into code, let's understand the FOLDER STRUCTURE.
  This is your map. Once you understand this, everything clicks.
`);

    explain(`
  Backend/
  │
  ├── 📄 package.json        ← "Shopping list" — what libraries to install
  ├── 📄 .env                ← SECRET passwords (database URL, API keys)
  ├── 📄 vercel.json         ← Deployment config
  │
  ├── 📁 prisma/             ← DATABASE BLUEPRINT
  │   └── schema.prisma      ← Defines all tables (users, lawyers, bookings)
  │
  ├── 📁 scripts/            ← ADMIN TOOLS
  │   ├── seed.js            ← Fills database with test data
  │   └── seed-admin.js      ← Creates admin accounts
  │
  └── 📁 src/                ← THE ACTUAL APPLICATION
      ├── 📄 server.js       ← 🚪 THE DOOR — starts the server
      ├── 📄 app.js          ← 👨‍🍳 THE MANAGER — configures everything
      │
      ├── 📁 config/         ← ⚙️ SETTINGS
      │   ├── env.js          ← Loads & validates environment variables
      │   ├── database.js     ← Database connection logic
      │   └── supabase.js     ← File storage setup
      │
      ├── 📁 middleware/      ← 🛡️ SECURITY GUARDS
      │   ├── auth.js          ← "Are you logged in?"
      │   ├── rateLimiter.js   ← "Too many requests, slow down!"
      │   ├── errorHandler.js  ← "Something broke, let me handle it"
      │   └── validate.js      ← "Is your data correct?"
      │
      ├── 📁 modules/         ← 🧑‍🍳 THE CHEFS (business logic)
      │   ├── auth/            ← Login, signup, Google OAuth
      │   ├── users/           ← User profiles
      │   ├── lawyers/         ← Lawyer listings & search
      │   ├── bookings/        ← Book appointments
      │   ├── payments/        ← Razorpay payment processing
      │   ├── reviews/         ← Lawyer reviews & ratings
      │   ├── documents/       ← File uploads
      │   ├── notifications/   ← Email & in-app notifications
      │   ├── analytics/       ← Dashboard statistics
      │   └── admin/           ← Admin panel operations
      │
      ├── 📁 routes/           ← Health check endpoints
      └── 📁 utils/            ← 🔧 TOOLS (logger, email, helpers)
`);

    analogy(`It's like a hospital:
    • server.js = The main entrance — opens the hospital
    • app.js = Hospital administrator — sets all the rules
    • middleware/ = Reception desk — checks your ID, insurance
    • modules/ = Departments — cardiology, surgery, radiology...
    • config/ = Hospital settings — phone numbers, passwords
    • utils/ = Equipment — stethoscopes, thermometers
    `);

    await quiz(
        'If you want to find the code for "booking a lawyer", which folder would you look in?',
        'modules',
        'The modules/ folder contains all business logic. Specifically, modules/bookings/ handles booking operations.'
    );

    await quiz(
        'Which file STARTS the entire server? (app.js / server.js / package.json)',
        'server.js',
        'server.js is the entry point — it opens the door. app.js configures everything, but server.js actually starts listening.'
    );

    await waitForEnter();
}

async function lesson3_serverJs() {
    console.clear();
    header('LESSON 3: server.js — The Door');

    explain(`
  This is the FIRST file that runs when you type "npm run dev".
  Its job: Start the server and connect to databases.
`);

    code('src/server.js', 1, 30);

    explain(`
  Let's break this down line by line:

  ${C.cyan}Line 1-5: Imports${C.reset}
  We import the tools we need:
  - 'app' from app.js → The configured Express application
  - 'env' from config/env.js → Environment variables (PORT, etc.)
  - 'connectAllDatabases' → Function to connect to PostgreSQL + MongoDB
  - 'logger' → Our logging tool (writes to console + files)
`);

    code('src/server.js', 30, 60);

    explain(`
  ${C.cyan}The startServer() function:${C.reset}

  Step 1: Connect to databases
    → Calls connectAllDatabases() — connects to PostgreSQL AND MongoDB
    → If this fails, the server crashes (can't work without a database!)

  Step 2: Create the Express app
    → Calls createApp() from app.js — this sets up ALL routes and middleware

  Step 3: Start listening on a PORT
    → app.listen(PORT) — tells Node.js "Accept HTTP requests on port 5000"
    → Now when you visit http://localhost:5000, the server responds!
`);

    analogy(`Opening a restaurant:
    Step 1: Turn on the stove (connect database)
    Step 2: Set up the kitchen, hire staff (configure app)
    Step 3: Open the front door to customers (listen on port)
    `);

    code('src/server.js', 60, 100);

    explain(`
  ${C.cyan}Graceful Shutdown:${C.reset}

  What happens when you press Ctrl+C to stop the server?
  Without graceful shutdown: Server dies instantly → database connections leak
  With graceful shutdown: Server first:
    1. Stops accepting new requests
    2. Waits for in-progress requests to finish
    3. Closes database connections cleanly
    4. THEN exits

  This is done by listening for SIGTERM and SIGINT signals.
`);

    tip('Graceful shutdown is critical for production. Without it, you can corrupt data mid-transaction.');

    await quiz(
        'What happens FIRST when server.js runs: (A) Listen on port, (B) Connect to database, (C) Configure middleware?',
        'B',
        'Database connection happens first! You can\'t serve requests if you can\'t access data.'
    );

    await waitForEnter();
}

async function lesson4_envConfig() {
    console.clear();
    header('LESSON 4: Environment Variables — The Secrets');

    explain(`
  Every app has SECRETS — database passwords, API keys, JWT signing keys.
  These MUST NOT be hardcoded in your code. Why?

  1. If you push code to GitHub with passwords → HACKED
  2. Different environments (dev/staging/prod) need different configs
  3. You should be able to change a password WITHOUT changing code

  The solution: ${C.bold}.env file${C.reset}
`);

    explain(`
  The .env file looks like this:

  ┌─────────────────────────────────────────────────────┐
  │ PORT=5000                                            │
  │ NODE_ENV=development                                 │
  │ DATABASE_URL=postgresql://user:pass@host/db          │
  │ JWT_SECRET=some-super-secret-key-nobody-knows        │
  │ MONGODB_URI=mongodb+srv://user:pass@cluster/db       │
  │ SUPABASE_URL=https://your-project.supabase.co        │
  │ FRONTEND_URL=http://localhost:5173                    │
  └─────────────────────────────────────────────────────┘

  This file is listed in .gitignore — it NEVER goes to GitHub!
`);

    warning('The .env file should NEVER be committed to git. If you leak your JWT_SECRET, anyone can forge login tokens.');

    subHeader('How env.js validates these');
    code('src/config/env.js', 1, 40);

    explain(`
  We use a library called ${C.bold}Zod${C.reset} to VALIDATE environment variables.

  Why? Because if DATABASE_URL is missing:
  - Without Zod: Server starts, then crashes randomly when it tries to query
  - With Zod: Server REFUSES to start and tells you exactly what's missing

  It's like a pilot's pre-flight checklist. Missing fuel? Don't take off!
`);

    await quiz(
        'Why should you NEVER put database passwords directly in your code?',
        'security',
        'If you push code to GitHub or someone reads your source code, they get your passwords. The .env file stays local and secret.'
    );

    await waitForEnter();
}

async function lesson5_appJs() {
    console.clear();
    header('LESSON 5: app.js — The Kitchen Manager');

    explain(`
  app.js is the BRAIN of the application. It:
  1. Creates the Express app
  2. Adds MIDDLEWARE (security guards)
  3. Mounts ROUTES (the menu)
  4. Sets up ERROR HANDLERS (what to do when things break)
`);

    code('src/app.js', 37, 85);

    explain(`
  Let's trace the request flow when someone visits /api/v1/lawyers:

  ┌─────────────────────────────────────────────────────────────┐
  │  HTTP Request: GET /api/v1/lawyers                          │
  │                                                              │
  │  1. helmet()        → Adds security headers                  │
  │  2. cors()          → "Is this frontend allowed?"            │
  │  3. requestId()     → Generates unique ID for tracking       │
  │  4. requestLogger() → Logs: "GET /api/v1/lawyers started"    │
  │  5. express.json()  → Parses JSON body (if any)              │
  │  6. rateLimiter()   → "Too many requests? Block them!"       │
  │  7. ROUTE HANDLER   → Actually fetches lawyers from DB       │
  │  8. Response sent   → JSON data goes back to frontend        │
  │                                                              │
  │  If error at any step:                                       │
  │  → errorHandler() catches it and sends error response         │
  └─────────────────────────────────────────────────────────────┘
`);

    analogy(`Every request goes through a PIPELINE — like an assembly line:
    Raw request → Security check → ID stamp → Log it → Parse it → Rate check → Handle it → Respond
    Each step is a MIDDLEWARE.
    `);

    code('src/app.js', 94, 115);

    explain(`
  ${C.cyan}Route Mounting:${C.reset}
  
  app.use('/api/v1/auth', authRoutes)    → All auth endpoints start with /api/v1/auth
  app.use('/api/v1/lawyers', lawyerRoutes) → All lawyer endpoints start with /api/v1/lawyers
  app.use('/api/v1/bookings', bookingRoutes) → ... and so on

  This is called "mounting" — you attach a set of routes to a URL prefix.
  
  So if authRoutes has a POST '/login' handler,
  the full URL becomes: POST /api/v1/auth/login
`);

    await quiz(
        'If you send 100 requests per second, which middleware would BLOCK you?',
        'rate',
        'The rateLimiter middleware! It limits how many requests you can make per time window to prevent abuse (DDoS attacks).'
    );

    await quiz(
        'What is the full URL for the login endpoint? (hint: /api/v1/??? /????)',
        '/api/v1/auth/login',
        'authRoutes is mounted at /api/v1/auth, and login is a POST handler inside it → /api/v1/auth/login'
    );

    await waitForEnter();
}

async function lesson6_middleware() {
    console.clear();
    header('LESSON 6: Middleware — The Security Guards');

    explain(`
  Middleware = Functions that run BEFORE your actual route handler.
  They can:
  - MODIFY the request (add data to it)
  - REJECT the request (send 401 Unauthorized)
  - PASS it along (call next() to continue)

  Think of them as security checkpoints at an airport:
  Checkpoint 1: Do you have a ticket? (auth.js)
  Checkpoint 2: Is your bag too heavy? (validate.js)
  Checkpoint 3: Are you going too fast? (rateLimiter.js)
`);

    subHeader('1. Authentication Middleware (auth.js)');
    code('src/middleware/auth.js', 1, 50);

    explain(`
  This middleware checks: "Are you logged in?"

  How it works:
  1. Looks for "Authorization: Bearer <token>" in request headers
  2. Decodes the JWT token using the secret key
  3. If valid → Adds user info to req.user and calls next()
  4. If invalid → Sends 401 Unauthorized response

  ${C.cyan}What is a JWT (JSON Web Token)?${C.reset}
  It's like a wristband at a concert:
  - When you log in, the server gives you a wristband (JWT)
  - Every request, you show your wristband
  - The server checks: "Is this wristband real and not expired?"
  - If yes → you're in! If no → access denied.
`);

    subHeader('2. Rate Limiter (rateLimiter.js)');
    code('src/middleware/rateLimiter.js', 1, 30);

    explain(`
  Rate limiting protects your server from abuse.

  Without it: Someone sends 10,000 requests/second → server crashes (DDoS)
  With it: "You can make max 100 requests every 15 minutes. After that, wait."

  Different limits for different routes:
  - Login: 5 attempts per 15 min (prevent password brute-force)
  - API: 100 requests per 15 min (general usage)
`);

    subHeader('3. Error Handler (errorHandler.js)');

    explain(`
  What happens when something BREAKS?

  Without error handler: Server crashes with ugly stack trace
  With error handler: Server sends a clean JSON error response:
  
  {
    "success": false,
    "error": "Lawyer not found",
    "statusCode": 404
  }

  This middleware catches ALL errors and formats them nicely.
  In development: includes full error stack trace
  In production: hides internal details (security!)
`);

    await quiz(
        'What does the auth middleware do if a JWT token is expired?',
        '401',
        'It sends a 401 Unauthorized response. "Your wristband has expired — please log in again!"'
    );

    await waitForEnter();
}

async function lesson7_modules() {
    console.clear();
    header('LESSON 7: Modules — The Business Logic');

    explain(`
  The modules/ folder contains the ACTUAL features of NyayBooker.
  Each module handles one domain:

  ┌──────────────┬────────────────────────────────────────────┐
  │ Module       │ What it does                                │
  ├──────────────┼────────────────────────────────────────────┤
  │ auth/        │ Login, Signup, Google OAuth, Email verify   │
  │ users/       │ User profiles, settings                     │
  │ lawyers/     │ Lawyer listing, search, profiles             │
  │ bookings/    │ Book appointments, manage slots              │
  │ payments/    │ Razorpay integration, payment tracking       │
  │ reviews/     │ Rate & review lawyers                        │
  │ documents/   │ Upload legal documents (Supabase)            │
  │ notifications│ Email + in-app notifications                 │
  │ analytics/   │ Dashboard stats & charts                     │
  │ admin/       │ Admin panel (manage users, lawyers, etc.)    │
  └──────────────┴────────────────────────────────────────────┘

  Each module has a routes.js file that defines ALL the endpoints.
`);

    subHeader('Module Pattern: How a feature works');

    explain(`
  Let's trace what happens when a user books a lawyer:

  1. Frontend sends: POST /api/v1/bookings
     Body: { lawyerId: "abc", date: "2026-02-15", slot: "10:00 AM" }

  2. app.js routes it to → bookingRoutes

  3. bookingRoutes:
     a. auth middleware → "Is this user logged in?" ✅
     b. validate middleware → "Is the data correct?" ✅
     c. Route handler → The actual booking logic:
        - Check if lawyer exists
        - Check if slot is available
        - Create booking in PostgreSQL via Prisma
        - Send notification to lawyer
        - Return booking confirmation

  4. Response sent back: { success: true, booking: { id: "xyz", ... } }
`);

    analogy(`Ordering food online:
    1. You tap "Order" on the app (frontend request)
    2. Restaurant receives order (backend route)
    3. Kitchen checks: ingredient available? (validation)
    4. Chef cooks the food (business logic)
    5. Delivery boy picks it up (response)
    6. You receive your food (frontend shows confirmation)
    `);

    subHeader('Auth Module Deep-Dive');

    explain(`
  The auth module is the most important. It handles:

  ${C.bold}POST /api/v1/auth/register${C.reset}
    → Creates new user account
    → Hashes password with bcrypt (NEVER store plain passwords!)
    → Sends verification email
    → Returns JWT token

  ${C.bold}POST /api/v1/auth/login${C.reset}
    → Checks email + password
    → If correct → generates JWT token
    → Sends token back (frontend stores it)

  ${C.bold}POST /api/v1/auth/google${C.reset}
    → User clicks "Sign in with Google"
    → Google sends us a token
    → We verify it with Google's servers
    → Create or find user in our DB
    → Return our JWT token

  ${C.bold}What is bcrypt?${C.reset}
    Passwords are NEVER stored as plain text.
    "password123" → bcrypt → "$2b$10$X7hG..." (unreadable hash)
    Even if database is hacked, passwords are safe!
`);

    await quiz(
        'Why do we hash passwords with bcrypt instead of storing them directly?',
        'security',
        'If the database is breached, hashed passwords cannot be read. "password123" becomes an unreadable mess like "$2b$10$X7hG..."'
    );

    await waitForEnter();
}

async function lesson8_database() {
    console.clear();
    header('LESSON 8: Databases — Where Data Lives');

    explain(`
  NyayBooker uses TWO databases:

  ${C.cyan}1. PostgreSQL (via Prisma)${C.reset}
    - The MAIN database
    - Stores: Users, Lawyers, Bookings, Payments, Reviews
    - Why: Supports RELATIONSHIPS (a user HAS MANY bookings)
    - Hosted on: Neon (serverless PostgreSQL)

  ${C.cyan}2. MongoDB${C.reset}
    - The SECONDARY database
    - Stores: Notifications, Activity logs
    - Why: Flexible schema (logs can have different fields)
    - Hosted on: MongoDB Atlas
`);

    subHeader('Prisma — The Database Translator');

    explain(`
  Prisma is an ORM (Object-Relational Mapper).
  Instead of writing raw SQL, you write JavaScript:

  ${C.red}Without Prisma (raw SQL):${C.reset}
  SELECT * FROM users WHERE id = 'abc123'

  ${C.green}With Prisma (JavaScript):${C.reset}
  prisma.user.findUnique({ where: { id: 'abc123' } })

  Both do the SAME thing, but Prisma:
  - Is type-safe (catches errors before runtime)
  - Auto-generates JavaScript types from your schema
  - Handles migrations (changing table structure safely)
`);

    subHeader('The Prisma Schema');

    const schemaPath = 'prisma/schema.prisma';
    if (existsSync(join(ROOT, schemaPath))) {
        code(schemaPath, 1, 40);
    }

    explain(`
  The schema.prisma file defines your database structure:

  model User {
    id        String   @id @default(uuid())    ← Every user gets a unique ID
    email     String   @unique                  ← No two users can have same email
    password  String                            ← Hashed password
    name      String                            ← Full name
    role      Role     @default(USER)           ← USER, LAWYER, or ADMIN
    bookings  Booking[]                         ← One user can have MANY bookings
    reviews   Review[]                          ← One user can have MANY reviews
    createdAt DateTime @default(now())          ← When account was created
  }

  The @id means "this is the primary key"
  The @unique means "no duplicates allowed"
  The @default means "auto-fill if not provided"
  Booking[] means "one-to-many relationship"
`);

    subHeader('Database Connection');
    code('src/config/database.js', 1, 30);

    explain(`
  database.js handles connecting to BOTH databases:

  1. connectPrisma() → Connects to PostgreSQL
  2. connectMongoDB() → Connects to MongoDB
  3. connectAllDatabases() → Calls both (used in server.js)
  4. disconnectAllDatabases() → Clean shutdown of both
`);

    await quiz(
        'If a user can have many bookings, what type of database relationship is this?',
        'one-to-many',
        'One user → Many bookings. In Prisma, this is represented by Booking[] on the User model.'
    );

    await waitForEnter();
}

async function lesson9_authFlow() {
    console.clear();
    header('LESSON 9: Authentication Flow — Login to Access');

    explain(`
  Let's trace the COMPLETE login flow:

  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User types email + password → clicks "Login"                │
  │                        │                                      │
  │                        ▼                                      │
  │  Frontend sends: POST /api/v1/auth/login                      │
  │  Body: { email: "user@mail.com", password: "secret123" }      │
  │                        │                                      │
  │                        ▼                                      │
  │  Backend middleware pipeline:                                  │
  │  1. rateLimiter → "Is this the 6th attempt? Block them!"      │
  │  2. validate → "Is email format correct?"                      │
  │  3. Route handler:                                             │
  │     a. Find user by email in PostgreSQL                        │
  │     b. Compare password hash with bcrypt.compare()             │
  │     c. If match → Generate JWT token                           │
  │     d. If no match → 401 "Invalid credentials"                 │
  │                        │                                      │
  │                        ▼                                      │
  │  Response: { token: "eyJhbGci...", user: { name, role } }     │
  │                        │                                      │
  │                        ▼                                      │
  │  Frontend stores token in memory/cookie                        │
  │  Next requests include: Authorization: Bearer <token>          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
`);

    subHeader('JWT Token Structure');
    explain(`
  A JWT token has 3 parts separated by dots:

  eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fw

  Part 1 (Header):   { "alg": "HS256" }          → Algorithm used
  Part 2 (Payload):  { "userId": "123", "role": "USER" } → User data
  Part 3 (Signature): HMAC of Part 1 + Part 2 + SECRET   → Proof it's real

  The SECRET (JWT_SECRET in .env) is like a stamp:
  - Only YOUR server knows the secret
  - Anyone can READ the payload (it's just Base64)
  - But nobody can FORGE a token without the secret
`);

    warning('JWT payload is NOT encrypted — just encoded. Never put sensitive data (passwords, SSN) in a JWT!');

    subHeader('Role-Based Access Control');
    explain(`
  Different users have different permissions:

  ┌──────────┬────────────────────────────────────────────┐
  │ Role     │ Can do                                      │
  ├──────────┼────────────────────────────────────────────┤
  │ USER     │ Book lawyers, leave reviews, pay             │
  │ LAWYER   │ Set availability, view clients, manage cases  │
  │ ADMIN    │ Manage all users, verify lawyers, view stats  │
  └──────────┴────────────────────────────────────────────┘

  The auth middleware checks:
  1. Is the JWT valid?
  2. Does the user's ROLE match the required role?
  
  Example: Only ADMIN can access /api/v1/admin/*
  If a USER tries → 403 Forbidden
`);

    await quiz(
        'Can someone read the data inside a JWT token without the secret key? (yes/no)',
        'yes',
        'Yes! The payload is just Base64-encoded, not encrypted. Anyone can decode it. The secret only prevents FORGING tokens, not reading them.'
    );

    await waitForEnter();
}

async function lesson10_paymentsAndFiles() {
    console.clear();
    header('LESSON 10: Payments & File Uploads');

    subHeader('Payment Flow (Razorpay)');
    explain(`
  When a user pays for a booking:

  1. Frontend sends: POST /api/v1/payments/create-order
     → Backend creates a Razorpay order
     → Returns orderId to frontend

  2. Frontend opens Razorpay checkout modal
     → User enters card details (handled by Razorpay, NOT us)
     → Razorpay processes payment

  3. Razorpay sends success callback to frontend
     → Frontend sends: POST /api/v1/payments/verify
     → Backend verifies the payment signature with Razorpay's secret
     → If valid → marks booking as "paid"

  ${C.bold}Why don't we handle card details ourselves?${C.reset}
  PCI-DSS compliance! Handling credit cards requires millions in security.
  Razorpay handles it — we only see "payment successful" or "failed".
`);

    subHeader('File Upload Flow (Supabase)');
    explain(`
  Lawyers need to upload documents (certificates, bar ID, etc.):

  1. Frontend sends: POST /api/v1/documents/upload
     → File is sent as multipart/form-data

  2. Backend:
     a. Multer middleware processes the file upload
     b. Validates: file type (PDF, JPG), size limit
     c. Uploads to Supabase Storage bucket
     d. Gets back a public URL
     e. Saves URL + metadata in PostgreSQL
     f. Returns the URL to frontend

  Supabase Storage is like Google Drive but for your app.
  Files are stored in "buckets" (folders in the cloud).
`);

    await quiz(
        'Why do we use Razorpay instead of processing credit cards ourselves?',
        'PCI',
        'PCI-DSS compliance requires millions in security infrastructure. Razorpay handles all the sensitive card data — we only verify the result.'
    );

    await waitForEnter();
}

async function lesson11_fullFlow() {
    console.clear();
    header('LESSON 11: Putting It ALL Together');

    explain(`
  Let's trace a COMPLETE user journey:

  ═══════════════════════════════════════════════════════════════
  STEP 1: User Visits Website
  ═══════════════════════════════════════════════════════════════
  Frontend loads at http://localhost:5173
  Vite dev server proxies /api requests to backend at :5000

  ═══════════════════════════════════════════════════════════════
  STEP 2: User Signs Up
  ═══════════════════════════════════════════════════════════════
  POST /api/v1/auth/register → { name, email, password }
  → Password hashed with bcrypt
  → User saved to PostgreSQL via Prisma
  → Verification email sent via Nodemailer
  → JWT token returned

  ═══════════════════════════════════════════════════════════════
  STEP 3: User Browses Lawyers
  ═══════════════════════════════════════════════════════════════
  GET /api/v1/lawyers?specialization=criminal&city=Delhi
  → Prisma queries PostgreSQL with filters
  → Returns list of matching lawyers with ratings
  → No auth needed (public endpoint!)

  ═══════════════════════════════════════════════════════════════
  STEP 4: User Books a Lawyer
  ═══════════════════════════════════════════════════════════════
  POST /api/v1/bookings → { lawyerId, date, slot }
  → Auth middleware checks JWT ✅
  → Validates slot availability
  → Creates booking in PostgreSQL
  → Sends notification to lawyer (MongoDB)
  → Returns booking confirmation

  ═══════════════════════════════════════════════════════════════
  STEP 5: User Pays
  ═══════════════════════════════════════════════════════════════
  POST /api/v1/payments/create-order → { bookingId, amount }
  → Creates Razorpay order
  → User completes payment on Razorpay checkout
  POST /api/v1/payments/verify → { razorpay_signature }
  → Verifies payment authenticity
  → Updates booking status to "paid"

  ═══════════════════════════════════════════════════════════════
  STEP 6: Lawyer Views Dashboard
  ═══════════════════════════════════════════════════════════════
  GET /api/v1/analytics/dashboard
  → Auth + role check (LAWYER only)
  → Aggregates: total bookings, earnings, ratings
  → Returns dashboard data
`);

    subHeader('The Request Lifecycle (One Last Time)');
    explain(`
  EVERY single request goes through this exact pipeline:

  Client → Internet → Express Server
    │
    ├── 1. helmet()         → Security headers
    ├── 2. cors()           → Origin check
    ├── 3. requestId()      → Unique tracking ID
    ├── 4. requestLogger()  → Log request start
    ├── 5. express.json()   → Parse JSON body
    ├── 6. rateLimiter()    → Throttle check
    ├── 7. auth()           → JWT verification (if protected)
    ├── 8. validate()       → Request body validation
    ├── 9. ROUTE HANDLER    → Actual business logic
    │
    ├── Success → 200 JSON response
    └── Error → errorHandler() → formatted error response
`);

    await quiz(
        'In Step 3 (browse lawyers), why is auth middleware NOT needed?',
        'public',
        'Browsing lawyers is a public endpoint — anyone should be able to search for lawyers without logging in. Only actions like booking or paying require authentication.'
    );

    await waitForEnter();
}

async function lesson12_summary() {
    console.clear();
    header('🎉 CONGRATULATIONS! Full Backend Knowledge Achieved');

    explain(`
  Here's everything you've learned:

  ✅ Lesson 1:  What a backend IS (the kitchen analogy)
  ✅ Lesson 2:  Project structure (the map)
  ✅ Lesson 3:  server.js (the door + graceful shutdown)
  ✅ Lesson 4:  Environment variables (.env + Zod validation)
  ✅ Lesson 5:  app.js (middleware pipeline + route mounting)
  ✅ Lesson 6:  Middleware (auth, rate limit, error handler)
  ✅ Lesson 7:  Modules (auth, bookings, payments, etc.)
  ✅ Lesson 8:  Databases (PostgreSQL + MongoDB + Prisma)
  ✅ Lesson 9:  Authentication (JWT, bcrypt, role-based access)
  ✅ Lesson 10: Payments (Razorpay) & File Uploads (Supabase)
  ✅ Lesson 11: Full request lifecycle

  ${C.bold}Key Concepts You Now Understand:${C.reset}
  • Express middleware pipeline
  • JWT authentication flow
  • Database relationships (one-to-many)
  • Role-based access control (RBAC)
  • Environment configuration
  • Graceful shutdown pattern
  • Payment gateway integration
  • File upload architecture
`);

    const feedback = await ask('Any specific part you want me to explain more? (type "done" to exit)');

    if (feedback.toLowerCase() !== 'done' && feedback.toLowerCase() !== 'quit') {
        explain(`\n  Great question! To explore "${feedback}" in more detail, you can:`);
        explain(`  1. Open the relevant file in your editor`);
        explain(`  2. Run this tutorial again`);
        explain(`  3. Ask in the chat for a deeper dive\n`);
    }

    print(`\n${C.bgGreen}${C.white}${C.bold} 🚀 You now understand the NyayBooker backend! Keep building! ${C.reset}\n`);
}

// ─────────────────────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────────────────────
async function main() {
    const lessons = [
        lesson0_welcome,
        lesson1_whatIsBackend,
        lesson2_projectStructure,
        lesson3_serverJs,
        lesson4_envConfig,
        lesson5_appJs,
        lesson6_middleware,
        lesson7_modules,
        lesson8_database,
        lesson9_authFlow,
        lesson10_paymentsAndFiles,
        lesson11_fullFlow,
        lesson12_summary,
    ];

    for (const lesson of lessons) {
        await lesson();
    }

    rl.close();
    process.exit(0);
}

// Handle early exit
rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'quit') {
        print(`\n${C.yellow}👋 See you next time! Run "node scripts/learn-backend.js" to continue.${C.reset}\n`);
        rl.close();
        process.exit(0);
    }
});

main().catch((err) => {
    console.error('Tutorial error:', err);
    rl.close();
    process.exit(1);
});
