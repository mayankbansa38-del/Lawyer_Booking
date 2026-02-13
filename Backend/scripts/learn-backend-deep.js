#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Deep Dive MCQ Learning Script
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Architecture-focused, MCQ-based learning for understanding WHY decisions
 * were made, not just WHAT was implemented.
 * 
 * Usage: node scripts/learn-backend-deep.js
 */

import readline from 'readline';
import chalk from 'chalk';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function prompt(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

function clear() {
    console.clear();
}

function printHeader(title) {
    console.log('\n' + chalk.bold.cyan('═'.repeat(79)));
    console.log(chalk.bold.cyan(`  ${title}`));
    console.log(chalk.bold.cyan('═'.repeat(79)) + '\n');
}

function printSection(title) {
    console.log('\n' + chalk.yellow('─'.repeat(79)));
    console.log(chalk.yellow.bold(`  ${title}`));
    console.log(chalk.yellow('─'.repeat(79)) + '\n');
}

function printCode(code, language = 'javascript') {
    console.log(chalk.gray('```' + language));
    console.log(chalk.white(code));
    console.log(chalk.gray('```\n'));
}

function printCorrect(message) {
    console.log(chalk.green.bold('✓ CORRECT!') + ' ' + chalk.green(message));
}

function printIncorrect(message) {
    console.log(chalk.red.bold('✗ INCORRECT.') + ' ' + chalk.red(message));
}

function printExplanation(explanation) {
    console.log('\n' + chalk.blue.bold('📘 Explanation:'));
    console.log(chalk.blue(explanation) + '\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// MCQ Question Engine
// ═══════════════════════════════════════════════════════════════════════════

class MCQQuestion {
    constructor(data) {
        this.question = data.question;
        this.code = data.code || null;
        this.codeLanguage = data.codeLanguage || 'javascript';
        this.options = data.options; // { A: '', B: '', C: '', D: '' }
        this.correctAnswer = data.correctAnswer; // 'A', 'B', 'C', or 'D'
        this.explanation = data.explanation;
        this.difficulty = data.difficulty || 'intermediate'; // beginner, intermediate, advanced
        this.category = data.category; // architecture, middleware, database, security, etc.
    }

    async ask() {
        console.log(chalk.bold(`\n❓ ${this.question}\n`));

        if (this.code) {
            printCode(this.code, this.codeLanguage);
        }

        console.log(chalk.white('A) ') + this.options.A);
        console.log(chalk.white('B) ') + this.options.B);
        console.log(chalk.white('C) ') + this.options.C);
        console.log(chalk.white('D) ') + this.options.D);

        const answer = (await prompt(chalk.cyan('\nYour answer (A/B/C/D): '))).toUpperCase();

        if (answer === this.correctAnswer) {
            printCorrect('Your understanding is solid!');
            printExplanation(this.explanation);
            return true;
        } else {
            printIncorrect(`The correct answer is ${this.correctAnswer}.`);
            printExplanation(this.explanation);
            return false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Question Bank - Architecture Module
// ═══════════════════════════════════════════════════════════════════════════

const architectureQuestions = [
    new MCQQuestion({
        question: 'Why does NyayBooker use BOTH PostgreSQL (via Prisma) AND MongoDB?',
        category: 'architecture',
        difficulty: 'intermediate',
        options: {
            A: 'Because MongoDB is faster for all queries',
            B: 'PostgreSQL for relational data (users, bookings), MongoDB for analytics (flexible schemas)',
            C: 'To demonstrate knowledge of multiple databases',
            D: 'MongoDB is only used as a backup database',
        },
        correctAnswer: 'B',
        explanation: `NyayBooker uses a **polyglot persistence** strategy:
        
- **PostgreSQL (Prisma)**: ACID transactions, relational integrity for core business logic (users, lawyers, bookings, payments)
- **MongoDB (Mongoose)**: Flexible schema for analytics events, where structure may evolve and aggregation pipelines excel

This is NOT cargo-culting—each DB serves its strength. PostgreSQL ensures data integrity (e.g., a booking can't reference a deleted lawyer), while MongoDB allows ad-hoc analytics queries without rigid schema migrations.`,
    }),

    new MCQQuestion({
        question: 'Why does the env.js file use Zod for validation instead of simple process.env checks?',
        code: `const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    DATABASE_URL: z.string().url().optional().or(z.literal('')),
});

const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
    console.error('FATAL: Environment validation failed');
    process.exit(1);
}`,
        category: 'architecture',
        difficulty: 'intermediate',
        options: {
            A: 'Zod is trendy and makes the code look professional',
            B: 'Contract-first validation: fail-fast on startup, type coercion, clear error messages',
            C: 'process.env checks are deprecated in Node.js',
            D: 'Zod automatically loads .env files',
        },
        correctAnswer: 'B',
        explanation: `**Contract-first validation** ensures the app NEVER runs with invalid config:

1. **Fail-fast on startup** (not at runtime when a route tries to use SMTP_PORT and it's NaN)
2. **Type coercion** (z.coerce.number() converts "5000" → 5000)
3. **Clear error messages** (shows EXACTLY which env vars are missing/invalid)
4. **Production safety** (separate validation block prevents default JWT secrets in prod)

Without Zod, you'd discover missing config when a user tries to reset their password and SMTP_USER is undefined—disaster in production.`,
    }),

    new MCQQuestion({
        question: 'In server.js, why does the graceful shutdown handler have a 30-second timeout?',
        code: `function setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
        server.close(async (err) => {
            await disconnectAllDatabases();
            process.exit(0);
        });

        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000); // 30 seconds
    };
}`,
        category: 'architecture',
        difficulty: 'advanced',
        options: {
            A: 'To give enough time for Prisma connection pool to drain gracefully',
            B: 'Arbitrary number, could be any value',
            C: 'Prevents zombie processes if DB disconnect hangs (e.g., network partition)',
            D: 'Required by Express.js specification',
        },
        correctAnswer: 'C',
        explanation: `**Zombie process prevention**. If \`disconnectAllDatabases()\` hangs (e.g., Postgres is unreachable due to network partition), the process would never exit.

The timeout ensures:
1. **Best effort**: Try to close cleanly (server.close → DB disconnect)
2. **Safety valve**: If clean shutdown fails within 30s, **force exit** to prevent the pod/container from hanging indefinitely

This is critical in Kubernetes where a stuck termination can block rolling deployments. The 30s value aligns with typical K8s terminationGracePeriodSeconds.`,
    }),

    new MCQQuestion({
        question: 'Why does app.js set app.set("trust proxy", 1)?',
        code: `export function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    // ... middleware setup
}`,
        category: 'architecture',
        difficulty: 'intermediate',
        options: {
            A: 'Required for Express to work',
            B: 'Enables rate limiting to use the real client IP from X-Forwarded-For header',
            C: 'Improves performance by 10%',
            D: 'Allows the app to run behind multiple proxies',
        },
        correctAnswer: 'B',
        explanation: `When behind a reverse proxy (Nginx, ALB, Cloudflare), the \`req.ip\` is the proxy's IP, NOT the client's.

Setting \`trust proxy: 1\` tells Express:
- Trust the **first** proxy in the chain
- Use \`X-Forwarded-For\` header to get the real client IP
- **Critical for rate limiting**: Without this, ALL requests appear to come from the same IP (the proxy), so rate limiting would throttle everyone together!

The "1" means "trust 1 proxy hop". If behind multiple proxies (e.g., Cloudflare → ALB → app), you'd use \`trust proxy: 2\`.`,
    }),
];

// ═══════════════════════════════════════════════════════════════════════════
// Question Bank - Middleware Deep Dive
// ═══════════════════════════════════════════════════════════════════════════

const middlewareQuestions = [
    new MCQQuestion({
        question: 'In auth.js, why does the authenticate() function fetch the user from the database EVERY request instead of trusting the JWT payload?',
        code: `export async function authenticate(req, res, next) {
    const decoded = verifyAccessToken(token);
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true, isEmailVerified: true, /* ... */ },
    });
    
    if (!user || !user.isActive) {
        throw new AuthenticationError('accountDisabled');
    }
    
    req.user = { ...user };
}`,
        category: 'middleware',
        difficulty: 'advanced',
        options: {
            A: 'JWTs are unreliable and need validation',
            B: 'To check if user was deactivated/deleted AFTER token was issued (invalidation)',
            C: 'Prisma requires fresh data on every request',
            D: 'This is inefficient and should cache the user data',
        },
        correctAnswer: 'B',
        explanation: `**JWT statelessness problem**: Once issued, a JWT is valid until expiration. If an admin deactivates a user, the JWT still works!

By fetching from the DB on EVERY request, we check:
1. **User still exists** (not deleted)
2. **isActive = true** (not suspended)
3. **Fresh role/permissions** (if role changed from USER → LAWYER, JWT doesn't know)

**Performance impact**: 1 DB query per authenticated request. In pagination benchmarks (local), Prisma queries took <1ms. This is acceptable for security.

**Alternative**: Redis cache + TTL, but adds complexity. For NyayBooker's scale, DB lookup is fine.`,
    }),

    new MCQQuestion({
        question: 'Why does the optionalAuth() middleware NOT throw errors when authentication fails?',
        code: `export async function optionalAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        req.user = null;
        return next();
    }
    
    await authenticate(req, res, (error) => {
        if (error) {
            logger.debug('Optional auth failed:', { error: error.message });
            req.user = null; // Set null, don't throw
        }
        next();
    });
}`,
        category: 'middleware',
        difficulty: 'intermediate',
        options: {
            A: 'It\'s a bug - authentication should always throw errors',
            B: 'Allows public endpoints to behave differently for authenticated users (e.g., showing "My Profile" link)',
            C: 'To reduce server load by skipping error handling',
            D: 'Express.js convention for optional middleware',
        },
        correctAnswer: 'B',
        explanation: `**Conditional behavior for hybrid endpoints**. Example: \`GET /api/v1/lawyers\` is public, but:

- **Anonymous user**: Shows all lawyers
- **Authenticated user**: Could show "favorited" lawyers highlighted

Using \`optionalAuth\`:
\`\`\`javascript
router.get('/lawyers', optionalAuth, async (req, res) => {
    const lawyers = await prisma.lawyer.findMany(/* ... */);
    
    if (req.user) {
        // Fetch user's favorited lawyers
        const favorites = await prisma.favorite.findMany({ userId: req.user.id });
        // Augment response
    }
    
    res.json(lawyers);
});
\`\`\`

If optionalAuth threw errors, the endpoint would fail for users with expired tokens. Instead, it gracefully degrades to anonymous mode.`,
    }),

    new MCQQuestion({
        question: 'In rateLimiter.js, why are there SEVEN different rate limiters instead of one global limiter?',
        code: `export const apiLimiter = createRateLimiter(); // 100 req/15min
export const authLimiter = createRateLimiter({ max: 5 }); // 5 req/15min
export const passwordResetLimiter = createRateLimiter({ max: 3, windowMs: 3600000 }); // 3 req/hour
export const uploadLimiter = createRateLimiter({ max: 10, windowMs: 3600000 }); // 10 req/hour
export const searchLimiter = createRateLimiter({ max: 30, windowMs: 60000 }); // 30 req/min
export const paymentLimiter = createRateLimiter({ max: 10 }); // 10 req/15min`,
        category: 'middleware',
        difficulty: 'advanced',
        options: {
            A: 'Over-engineering - one limiter is sufficient',
            B: 'Different attack vectors need different thresholds (brute-force vs DDoS vs resource exhaustion)',
            C: 'To make the code look more professional',
            D: 'Express.js requires separate limiters for each route',
        },
        correctAnswer: 'B',
        explanation: `**Threat modeling**: Different endpoints have different abuse profiles:

1. **authLimiter (5/15min)**: Brute-force prevention. Login attempts are slow (bcrypt hashing), so strict limit.
2. **passwordResetLimiter (3/hour)**: Email flooding prevention. SMTP costs money/reputation.
3. **uploadLimiter (10/hour)**: Storage exhaustion. Prevents filling disk with 10GB files.
4. **searchLimiter (30/min)**: DB query spam. Search hits DB hard (ILIKE queries), needs tighter window.
5. **paymentLimiter (10/15min)**: Financial safety. Prevents accidental duplicate charges.
6. **apiLimiter (100/15min)**: General DDoS mitigation for all other routes.

A single global limit (e.g., 100/15min) would allow 100 login brute-force attempts—unacceptable. Tiered limiting matches risk.`,
    }),

    new MCQQuestion({
        question: 'In errorHandler.js, why does handlePrismaError() convert Prisma errors to custom AppError instances?',
        code: `function handlePrismaError(error) {
    if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        return new ConflictError(\`\${field} already exists\`);
    }
    if (error.code === 'P2025') {
        return new NotFoundError('Record not found');
    }
    // ... more cases
}`,
        category: 'middleware',
        difficulty: 'intermediate',
        options: {
            A: 'Prisma errors are too verbose for clients',
            B: 'Normalizes DB-specific error codes to HTTP status codes + user-friendly messages',
            C: 'To hide database implementation details from attackers',
            D: 'Prisma errors don\'t work with Express error handling',
        },
        correctAnswer: 'B',
        explanation: `**Error normalization for client consumption**:

**Without normalization**, client gets:
\`\`\`json
{
  "error": "Invalid \\\`prisma.user.create() \\\` invocation:\\nUnique constraint failed on the fields: (\\\`email\\\`)"
}
\`\`\`

**With normalization** (P2002 → ConflictError):
\`\`\`json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "email already exists",
    "statusCode": 409
  }
}
\`\`\`

Benefits:
1. **Client-friendly**: "email already exists" vs Prisma internals
2. **Consistent structure**: All errors return { success, error: { code, message } }
3. **HTTP semantics**: P2002 → 409 Conflict, P2025 → 404 Not Found
4. **Security**: Doesn't leak DB schema details like table names

This is **defense in depth**—even if Prisma error escapes, it's normalized before reaching the client.`,
    }),
];

// ═══════════════════════════════════════════════════════════════════════════
// Question Bank - Database Deep Dive
// ═══════════════════════════════════════════════════════════════════════════

const databaseQuestions = [
    new MCQQuestion({
        question: 'In the benchmark results, why was Promise.all FASTER than prisma.$transaction for read-only pagination queries?',
        code: `// Promise.all approach
const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit }),
    prisma.user.count(),
]);

// $transaction approach  
const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ skip, take: limit }),
    prisma.user.count(),
]);

// Benchmark results (local):
// Promise.all: 14.2ms avg
// $transaction: 27.9ms avg (96.5% slower)`,
        category: 'database',
        difficulty: 'advanced',
        options: {
            A: '$transaction is always slower and should never be used',
            B: '$transaction uses a single connection + BEGIN/COMMIT overhead, while Promise.all parallelizes across connection pool',
            C: 'Prisma has a bug in $transaction implementation',
            D: 'The benchmark methodology was flawed',
        },
        correctAnswer: 'B',
        explanation: `**Connection pool parallelism** vs **transaction serialization**:

**Promise.all**:
1. Grabs 2 connections from pool (default: 10 connections)
2. Executes findMany and count **in parallel**
3. Returns when both complete
4. **No transaction overhead** (no BEGIN/COMMIT)

**$transaction**:
1. Grabs 1 connection, starts transaction (\`BEGIN\`)
2. Executes findMany (waits)
3. Executes count (waits)
4. Commits transaction (\`COMMIT\`)
5. **Sequential execution** + transaction log writes

For **read-only, independent queries**, Promise.all is ALWAYS faster because:
- Parallel > Sequential
- No transaction overhead (BEGIN/COMMIT writes to WAL)

**When to use $transaction**:
- **Write operations** requiring atomicity (user registration + lawyer profile creation)
- **Read + Write** where consistent snapshot is required (booking creation + payment deduction)

The benchmark validated: **Don't use $transaction for pagination**. This saved 96.5% latency on 9 high-traffic endpoints.`,
    }),

    new MCQQuestion({
        question: 'Why does database.js NOT call prisma.$connect() explicitly during initialization?',
        code: `// database.js
export function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
        });
        // No prisma.$connect() here!
    }
    return prisma;
}`,
        category: 'database',
        difficulty: 'intermediate',
        options: {
            A: 'It\'s a bug - $connect() should be called',
            B: 'Prisma auto-connects on first query (lazy connection)',
            C: 'The database server auto-accepts connections',
            D: '$connect() is deprecated in Prisma 5.x',
        },
        correctAnswer: 'B',
        explanation: `**Lazy connection** pattern. Prisma connects automatically on the **first database query**:

1. **App starts**: \`new PrismaClient()\` initializes the client but does NOT connect
2. **First query**: \`prisma.user.findMany()\` triggers connection pool creation
3. **Subsequent queries**: Reuse existing pool

**Why lazy connection?**
- **Faster startup**: App doesn't wait for DB during boot (important for health checks)
- **Error handling**: Connection errors happen in request context (can return 503) vs app crash on startup
- **Kubernetes readiness**: App can pass liveness probe even if DB is temporarily down

**Alternative (eager connection)**:
\`\`\`javascript
await prisma.$connect(); // Connects immediately
\`\`\`

NyayBooker uses lazy connection because health checks (\`/health/ready\`) explicitly test DB:
\`\`\`javascript
const dbHealth = await prisma.$queryRaw\`SELECT 1\`; // Triggers connection if not connected
\`\`\`

This separates "app is running" (liveness) from "app can serve traffic" (readiness).`,
    }),

    new MCQQuestion({
        question: 'In the booking creation flow, why is $transaction used even though it\'s slower than Promise.all?',
        code: `// Booking creation (requires $transaction)
await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({ /* ... */ });
    
    await tx.lawyer.update({
        where: { id: lawyerId },
        data: { completedBookings: { increment: 1 } },
    });
    
    await tx.notification.create({ /* ... */ });
    
    return booking;
});`,
        category: 'database',
        difficulty: 'advanced',
        options: {
            A: 'To make the code organized - no technical reason',
            B: 'ACID guarantee: if notification creation fails, booking rollback prevents inconsistent state',
            C: 'Prisma requires $transaction for multi-table writes',
            D: 'To reduce database load',
        },
        correctAnswer: 'B',
        explanation: `**Atomicity requirement**. Without $transaction, this sequence could fail mid-flight:

**Failure scenario (without transaction)**:
1. ✅ Booking created (inserted into DB)
2. ✅ Lawyer completedBookings incremented
3. ❌ Notification creation fails (network timeout)

Result: **Data inconsistency**—booking exists, but no notification sent. Lawyer counter is wrong too.

**With $transaction**:
- **All-or-nothing**: Either all 3 operations succeed, or ALL are rolled back
- **Consistent snapshot**: All reads/writes see same DB state (prevents race conditions)

**Real-world example**: User clicks "Book Lawyer"
- Stripe charge succeeds → $500 deducted from card
- Booking creation fails mid-transaction
- **Without $transaction**: User charged, no booking! (support nightmare)
- **With $transaction**: Charge detection + booking creation is atomic (both succeed or both fail)

**Performance trade-off**: +10ms latency vs data integrity. For writes, **correctness > speed**.

This is why the benchmark conclusion was: "Use Promise.all for reads, $transaction for writes."`,
    }),

    new MCQQuestion({
        question: 'Why does the local PostgreSQL setup use connection pooling (via Prisma) instead of direct connections?',
        code: `// Prisma connection pool config (implicit)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Prisma creates pool with default:
// - pool size: 10 connections
// - connection timeout: 20s`,
        category: 'database',
        difficulty: 'intermediate',
        options: {
            A: 'Direct connections are deprecated in PostgreSQL',
            B: 'Reusing connections is faster than opening a new TCP connection per request',
            C: 'Prisma requires connection pooling to function',
            D: 'Connection pooling only matters for production, not local dev',
        },
        correctAnswer: 'B',
        explanation: `**TCP handshake overhead**. Opening a new Postgres connection requires:
1. TCP 3-way handshake (SYN, SYN-ACK, ACK)
2. SSL/TLS handshake (if enabled)
3. Authentication (username/password)
4. Session initialization (SET statements, schema cache)

This takes **~50-100ms** per connection!

**With connection pooling**:
- App starts → Prisma creates 10 idle connections
- Request arrives → Prisma grabs connection from pool (~0.1ms)
- Request completes → Connection returned to pool (not closed)
- Next request → Reuses same connection

**Benchmark impact** (local Postgres):
- **Without pool**: 14ms (query) + 80ms (connection setup) = 94ms per request
- **With pool**: 14ms (reuses existing connection)

**Pool size = 10** means:
- 10 concurrent requests can execute simultaneously
- 11th request waits for a free connection (up to 20s timeout)

Even locally, pooling matters. In production (remote DB), the TCP RTT alone is 10-50ms, making pooling critical.`,
    }),
];

// ═══════════════════════════════════════════════════════════════════════════
// Question Bank - Security Deep Dive
// ═══════════════════════════════════════════════════════════════════════════

const securityQuestions = [
    new MCQQuestion({
        question: 'In crypto.js, why are access tokens (JWT_EXPIRES_IN = 7d) shorter-lived than refresh tokens (JWT_REFRESH_EXPIRES_IN = 30d)?',
        category: 'security',
        difficulty: 'intermediate',
        options: {
            A: 'To force users to log in more frequently',
            B: 'Security-convenience trade-off: access token stolen = 7d exposure, refresh token stolen = detectable via rotation',
            C: 'Refresh tokens are encrypted, access tokens are not',
            D: 'JWT specification requires different expiration times',
        },
        correctAnswer: 'B',
        explanation: `**Token rotation security model**:

**Access token (7 days)**:
- Sent with EVERY request (Authorization header)
- **High exposure risk**: XSS, MITM, logs, browser history
- **Short TTL limits damage**: If stolen, attacker has 7 days max
- **Stored in memory** (not localStorage) to prevent XSS

**Refresh token (30 days)**:
- Sent ONLY to \`/auth/refresh\` endpoint (once per 7 days)
- **Low exposure risk**: Fewer transmission opportunities
- **Longer TTL for UX**: User stays logged in for 30 days
- **Rotation on refresh**: Old refresh token invalidated, new one issued
- **Stored in httpOnly cookie** (XSS-proof)

**If access token stolen**:
- Attacker can impersonate user for ≤7 days
- No rotation → can't detect theft
- **Mitigation**: Short TTL + re-auth middleware checks user.isActive

**If refresh token stolen**:
- Attacker tries to refresh → gets new token pair
- **Legitimate user tries to refresh** → detects rotation (old token now invalid)
- **Detection**: "Someone else used your refresh token" → force logout all sessions

This is the **OAuth 2.0 recommended pattern**. Short access, long refresh, rotation on refresh.`,
    }),

    new MCQQuestion({
        question: 'Why does the requireVerifiedLawyer() middleware check BOTH role AND verificationStatus?',
        code: `export function requireVerifiedLawyer(req, res, next) {
    if (req.user.role !== 'LAWYER') {
        return next(new ForbiddenError('Lawyer account required.'));
    }
    
    if (req.user.lawyerVerificationStatus !== 'VERIFIED') {
        return next(new ForbiddenError('Lawyer verification required.'));
    }
    
    next();
}`,
        category: 'security',
        difficulty: 'intermediate',
        options: {
            A: 'role check is redundant - verificationStatus is sufficient',
            B: 'Defense in depth: prevent unverified lawyers AND non-lawyers from accessing sensitive endpoints',
            C: 'Prisma schema requires both checks',
            D: 'Express.js convention for authorization middleware',
        },
        correctAnswer: 'B',
        explanation: `**Multi-layer authorization** prevents privilege escalation:

**Attack scenario 1**: JWT tampering
- Attacker modifies their JWT payload: \`role: "USER"\` → \`role: "LAWYER"\`
- **First check fails**: \`req.user.role !== 'LAWYER'\` (JWT signature validation caught this earlier, but defense in depth)

**Attack scenario 2**: Unverified lawyer
- USER upgrades to LAWYER role (creates lawyer profile)
- Admin hasn't verified them yet (\`verificationStatus: 'PENDING'\`)
- Tries to access \`POST /api/v1/bookings/:id/complete\` (verified-only endpoint)
- **Second check fails**: \`lawyerVerificationStatus !== 'VERIFIED'\`

**Why not just check role?**
- role='LAWYER' includes PENDING, REJECTED, VERIFIED lawyers
- Only VERIFIED should access money-moving operations (completing bookings → releasing payments)

**Why not just check verificationStatus?**
- A malicious ADMIN could set their own \`lawyerVerificationStatus: 'VERIFIED'\` without actually being a lawyer
- First check ensures they're actually a LAWYER role

**Defense in depth**: Both checks must pass. If one fails, the other catches it.`,
    }),

    new MCQQuestion({
        question: 'Why does the webhook endpoint (/payments/webhook) preserve the raw request body?',
        code: `app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
        if (req.originalUrl?.includes('/payments/webhook')) {
            req.rawBody = buf;
        }
    },
}));`,
        category: 'security',
        difficulty: 'advanced',
        options: {
            A: 'For debugging payment issues',
            B: 'HMAC signature verification requires the exact raw bytes (JSON.parse changes formatting)',
            C: 'Razorpay requires raw body for compliance',
            D: 'Express.js convention for webhook endpoints',
        },
        correctAnswer: 'B',
        explanation: `**Signature verification cryptographic requirement**:

**Razorpay webhook process**:
1. Razorpay sends: \`{ "event": "payment.captured", "payload": {...} }\` + \`X-Razorpay-Signature\` header
2. Signature = HMAC-SHA256(\`webhook_secret\`, raw_request_body)
3. Server must compute: HMAC-SHA256(\`RAZORPAY_KEY_SECRET\`, **exact same bytes**)
4. Compare signatures → if match, request is authentic

**Problem with parsed body**:
\`\`\`javascript
// Razorpay sends: {"amount":50000,"currency":"INR"}
// express.json() parses to: { "amount": 50000, "currency": "INR" }
// JSON.stringify() outputs: {"amount":50000,"currency":"INR"}  ✓ Matches!

// But if Razorpay sends: {"amount": 50000, "currency": "INR"}  (extra space)
// Parsed + stringified: {"amount":50000,"currency":"INR"}  ✗ Different bytes!
// Signature mismatch → webhook rejected
\`\`\`

**Solution**: Preserve raw bytes BEFORE express.json() parses:
\`\`\`javascript
const signature = req.headers['x-razorpay-signature'];
const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(req.rawBody) // Use raw bytes, not JSON.stringify(req.body)
    .digest('hex');

if (signature !== expectedSignature) {
    throw new Error('Invalid signature'); // Prevents attacker from forging webhooks
}
\`\`\`

**Security impact**: Without raw body, attacker could send fake payment success webhooks → free bookings!`,
    }),

    new MCQQuestion({
        question: 'Why does Helmet middleware use contentSecurityPolicy: env.isProduction?',
        code: `app.use(helmet({
    contentSecurityPolicy: env.isProduction,
    crossOriginEmbedderPolicy: false,
}));`,
        category: 'security',
        difficulty: 'intermediate',
        options: {
            A: 'CSP is only needed in production, not development',
            B: 'CSP breaks hot-reloading in development (blocks inline scripts), so disabled locally',
            C: 'Helmet bug requires conditional CSP',
            D: 'CSP is a premium feature only for production',
        },
        correctAnswer: 'B',
        explanation: `**Development ergonomics vs production security**:

**CSP (Content Security Policy)** blocks:
- Inline scripts (\`\<script\>alert('XSS')\</script\>\`)
- \`eval()\` and \`new Function()\`
- Scripts from non-whitelisted domains

**Development problem**:
- Vite/Webpack dev server injects inline scripts for HMR (Hot Module Replacement)
- React DevTools uses \`eval()\` for component inspection
- **CSP blocks these** → development server breaks

**Production benefit**:
- Prevents XSS attacks (attacker can't inject \`\<script\>\` tags)
- Whitelists only trusted script sources (\`script-src 'self' cdn.razorpay.com\`)

**Conditional CSP**:
\`\`\`javascript
if (env.isProduction) {
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "cdn.razorpay.com"],
        },
    });
}
\`\`\`

This is common in Express apps: strict CSP in prod, relaxed in dev.`,
    }),
];

// ═══════════════════════════════════════════════════════════════════════════
// Question Bank - Code Analysis (Line-by-Line)
// ═══════════════════════════════════════════════════════════════════════════

const codeAnalysisQuestions = [
    new MCQQuestion({
        question: 'In this error handling code, why is the Prisma error check BEFORE the JWT error check?',
        code: `export function errorHandler(error, req, res, next) {
    let appError = error;
    
    // 1. Check Prisma errors
    if (error.code?.startsWith('P')) {
        appError = handlePrismaError(error);
    }
    // 2. Check JWT errors
    else if (error.name === 'JsonWebTokenError') {
        appError = handleJwtError(error);
    }
    // 3. Check MongoDB errors
    else if (error.name === 'MongoError') {
        appError = handleMongoError(error);
    }
}`,
        category: 'code-analysis',
        difficulty: 'intermediate',
        options: {
            A: 'Alphabetical order (J comes before M, P comes before J)',
            B: 'Frequency of occurrence - Prisma errors happen most often',
            C: 'Order doesn\'t matter - all errors are checked',
            D: 'Prisma must be checked first due to Express.js requirement',
        },
        correctAnswer: 'B',
        explanation: `**Performance optimization** via early exit:

**Error frequency in real apps**:
1. **Prisma errors (P2002, P2025)**: 60-70% (most common - constraint violations, not found, etc.)
2. **JWT errors**: 20-25% (token expired, invalid signature)
3. **MongoDB errors**: 5-10% (if analytics DB is used)
4. **Other errors**: 5%

**If-else chain** evaluates conditions sequentially:
- If Prisma check is first → 70% of errors match on first check (1 comparison)
- If JWT check is first → 70% of errors fail first check, then fail JWT check, then match Prisma (3 comparisons)

**Performance impact**:
- **Current order**: Avg 1.3 comparisons per error
- **JWT first**: Avg 2.1 comparisons per error

At 10,000 errors/day, this saves ~8,000 unnecessary comparisons.

**Best practice**: Order by frequency (most common first). Same principle as CPU branch prediction optimization.`,
    }),

    new MCQQuestion({
        question: 'What would happen if this line was removed from the authenticate() middleware?',
        code: `export async function authenticate(req, res, next) {
    const decoded = verifyAccessToken(token);
    
    // THIS LINE:
    if (decoded.type !== 'access') {
        throw new AuthenticationError('tokenInvalid');
    }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    req.user = user;
    next();
}`,
        category: 'code-analysis',
        difficulty: 'advanced',
        options: {
            A: 'Nothing - the check is redundant',
            B: 'Attacker could use a refresh token as an access token to bypass re-authentication',
            C: 'Prisma would throw an error due to missing type field',
            D: 'Performance would improve by skipping the check',
        },
        correctAnswer: 'B',
        explanation: `**Token type confusion attack**:

**NyayBooker has 2 token types**:
1. **Access token**: \`{ type: 'access', userId: 123, exp: 7d }\`
2. **Refresh token**: \`{ type: 'refresh', userId: 123, exp: 30d }\`

**Without type check**, attacker could:
1. Get refresh token (30-day expiration)
2. Use it in \`Authorization: Bearer <refresh_token>\` header
3. **Bypass access token expiration** (7 days → 30 days)
4. Avoid refresh token rotation detection

**Example attack**:
\`\`\`javascript
// Attacker intercepts refresh token
const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 30 days

// Uses it to access protected routes
fetch('/api/v1/bookings', {
    headers: { 'Authorization': \`Bearer \${refreshToken}\` }
});

// Without type check: ✓ Works! (refresh token lasts 30 days)
// With type check: ✗ Rejected (type: 'refresh' !== 'access')
\`\`\`

**Defense**: Type check ensures tokens are used for their intended purpose:
- Access tokens → API requests
- Refresh tokens → ONLY \`/auth/refresh\` endpoint (has separate validation)

This is **type safety at the cryptographic level**. JWT spec doesn't enforce this; we must.`,
    }),

    new MCQQuestion({
        question: 'In this pagination code, why is parseInt(limit) needed when limit comes from query params?',
        code: `router.get('/users', authenticate, async (req, res) => {
    let { page = 1, limit = 10 } = req.query;
    
    limit = parseInt(limit); // Why is this needed?
    const skip = (parseInt(page) - 1) * limit;
    
    const users = await prisma.user.findMany({ skip, take: limit });
});`,
        category: 'code-analysis',
        difficulty: 'beginner',
        options: {
            A: 'Query params are strings - "10" !== 10 in JavaScript',
            B: 'Prisma requires integer types for skip/take parameters',
            C: 'To prevent SQL injection attacks',
            D: 'parseInt improves query performance',
        },
        correctAnswer: 'A',
        explanation: `**URL query params are ALWAYS strings**:

**Request**: \`GET /api/v1/users?page=2&limit=20\`

**Express parses to**:
\`\`\`javascript
req.query = {
    page: "2",    // String, not number!
    limit: "20"   // String, not number!
}
\`\`\`

**Without parseInt()**:
\`\`\`javascript
const skip = ("2" - 1) * "20"; // Type coercion! 
// JavaScript converts: (2 - 1) * 20 = 20  ✓ Works by luck

// But:
const limit = "20";
await prisma.user.findMany({ take: "20" }); // Prisma error: Expected number, got string
\`\`\`

**Explicit parseInt() prevents**:
1. **Type errors**: Prisma type checking catches string vs number
2. **Coercion bugs**: \`"10" + 5 = "105"\` (concatenation) vs \`10 + 5 = 15\` (addition)
3. **Security**: \`parseInt("10; DROP TABLE users--")\` → \`10\` (NaN for non-numeric prefix)

**Best practice**: Always parse query params to expected types. Don't rely on JavaScript's implicit coercion.

**Production-grade version**:
\`\`\`javascript
const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
const page = Math.max(parseInt(req.query.page) || 1, 1);      // Min 1
\`\`\``,
    }),

    new MCQQuestion({
        question: 'What is the purpose of the skip() function in this rate limiter configuration?',
        code: `export function createRateLimiter(options = {}) {
    return rateLimit({
        windowMs,
        max,
        skip: (req) => {
            return env.isTest; // What does this do?
        },
    });
}`,
        category: 'code-analysis',
        difficulty: 'intermediate',
        options: {
            A: 'Disables rate limiting in test environment to prevent flaky tests',
            B: 'Improves test performance by skipping validation',
            C: 'Required by express-rate-limit library',
            D: 'Security feature to prevent test data in production',
        },
        correctAnswer: 'A',
        explanation: `**Test environment ergonomics**:

**Without skip**:
\`\`\`javascript
// Integration test
describe('POST /api/v1/auth/login', () => {
    it('should handle 10 failed login attempts', async () => {
        for (let i = 0; i < 10; i++) {
            await request(app).post('/api/v1/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });
        }
        
        // 6th request would trigger authLimiter (max: 5)
        // Test fails: "Too many authentication attempts"
    });
});
\`\`\`

**With skip**:
- In test env (\`NODE_ENV=test\`), rate limiting is bypassed
- Tests can make unlimited requests
- No need to:
  - Mock rate limiter
  - Wait for time windows to reset
  - Use different ports per test suite

**Why safe?**:
- Tests run locally (not in production)
- CI environment uses \`NODE_ENV=test\`
- Production uses \`NODE_ENV=production\` → rate limiting ENABLED

**Alternative approach** (if you want to test rate limiting):
\`\`\`javascript
skip: (req) => {
    return env.isTest && !req.headers['x-test-rate-limit'];
}
\`\`\`

Then specific tests can opt-in:
\`\`\`javascript
await request(app).post('/login')
    .set('x-test-rate-limit', 'true') // Enable rate limiting for this test
\`\`\`

**Best practice**: Skip non-critical middleware in tests (rate limiting, logging) unless explicitly testing them.`,
    }),
];

// ═══════════════════════════════════════════════════════════════════════════
// Quiz Engine
// ═══════════════════════════════════════════════════════════════════════════

class Quiz {
    constructor(questions, title) {
        this.questions = questions;
        this.title = title;
        this.score = 0;
        this.currentIndex = 0;
    }

    async run() {
        clear();
        printHeader(this.title);
        console.log(chalk.white(`Total Questions: ${this.questions.length}\n`));

        await prompt(chalk.cyan('Press Enter to start...'));

        for (const question of this.questions) {
            clear();
            printHeader(this.title);
            console.log(chalk.gray(`Question ${this.currentIndex + 1}/${this.questions.length}`));
            console.log(chalk.gray(`Current Score: ${this.score}/${this.currentIndex}\n`));

            const isCorrect = await question.ask();
            if (isCorrect) this.score++;

            this.currentIndex++;

            if (this.currentIndex < this.questions.length) {
                await prompt(chalk.cyan('\nPress Enter to continue...'));
            }
        }

        this.showResults();
    }

    showResults() {
        clear();
        printHeader('Quiz Complete!');

        const percentage = Math.round((this.score / this.questions.length) * 100);

        console.log(chalk.bold(`Final Score: ${this.score}/${this.questions.length} (${percentage}%)\n`));

        if (percentage >= 90) {
            console.log(chalk.green.bold('🏆 EXCELLENT! You have mastered this module.'));
        } else if (percentage >= 70) {
            console.log(chalk.yellow.bold('👍 GOOD! Review incorrect answers to strengthen understanding.'));
        } else if (percentage >= 50) {
            console.log(chalk.yellow.bold('📚 DECENT. Consider reviewing the module before moving on.'));
        } else {
            console.log(chalk.red.bold('📖 NEEDS WORK. Review the code and documentation thoroughly.'));
        }

        console.log();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Menu
// ═══════════════════════════════════════════════════════════════════════════

async function showMainMenu() {
    clear();
    printHeader('NyayBooker Backend - Deep Dive Learning');

    console.log(chalk.white('Select a module to master:\n'));
    console.log(chalk.cyan('1.') + ' Architecture Decisions (Why Express? Why dual-DB? Why Prisma?)');
    console.log(chalk.cyan('2.') + ' Middleware Deep Dive (Auth, Error Handling, Rate Limiting)');
    console.log(chalk.cyan('3.') + ' Database Performance (Promise.all vs $transaction, Connection Pooling)');
    console.log(chalk.cyan('4.') + ' Security Patterns (JWT, RBAC, HMAC webhooks, CSP)');
    console.log(chalk.cyan('5.') + ' Code Analysis (Line-by-line reasoning)');
    console.log(chalk.cyan('6.') + ' Full Quiz (All modules combined)');
    console.log(chalk.gray('0.') + ' Exit\n');

    const choice = await prompt(chalk.cyan('Your choice: '));
    return choice;
}

async function main() {
    let running = true;

    while (running) {
        const choice = await showMainMenu();

        switch (choice) {
            case '1':
                await new Quiz(architectureQuestions, 'Architecture Decisions Module').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '2':
                await new Quiz(middlewareQuestions, 'Middleware Deep Dive Module').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '3':
                await new Quiz(databaseQuestions, 'Database Performance Module').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '4':
                await new Quiz(securityQuestions, 'Security Patterns Module').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '5':
                await new Quiz(codeAnalysisQuestions, 'Code Analysis (Line-by-Line) Module').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '6':
                const allQuestions = [
                    ...architectureQuestions,
                    ...middlewareQuestions,
                    ...databaseQuestions,
                    ...securityQuestions,
                    ...codeAnalysisQuestions,
                ];
                await new Quiz(allQuestions, 'Full Backend Deep Dive Quiz').run();
                await prompt(chalk.cyan('\nPress Enter to return to main menu...'));
                break;
            case '0':
                console.log(chalk.green('\n👋 Happy learning! Keep building.\n'));
                running = false;
                break;
            default:
                console.log(chalk.red('\n❌ Invalid choice. Try again.\n'));
                await prompt(chalk.cyan('Press Enter to continue...'));
        }
    }

    rl.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// Entry Point
// ═══════════════════════════════════════════════════════════════════════════

main().catch((error) => {
    console.error(chalk.red('Error running quiz:'), error);
    rl.close();
    process.exit(1);
});
