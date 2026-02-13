/**
 * Benchmark: Promise.all vs prisma.$transaction
 * 
 * Tests the performance difference between parallel and batched queries
 * on a local PostgreSQL database.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
    ],
});

// Track query execution
const queryLog = [];
prisma.$on('query', (e) => {
    queryLog.push({
        query: e.query.substring(0, 100),
        duration: e.duration,
        timestamp: Date.now(),
    });
});

/**
 * Benchmark function
 */
async function benchmark(name, fn, iterations = 100) {
    console.log(`\n🔬 Benchmarking: ${name}`);
    console.log('━'.repeat(60));

    // Warmup
    await fn();
    await new Promise(resolve => setTimeout(resolve, 100));

    const times = [];
    queryLog.length = 0; // Clear log

    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await fn();
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1_000_000); // Convert to ms
    }

    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const min = times[0];
    const max = times[times.length - 1];

    console.log(`Iterations:   ${iterations}`);
    console.log(`Average:      ${avg.toFixed(2)}ms`);
    console.log(`Median (p50): ${p50.toFixed(2)}ms`);
    console.log(`p95:          ${p95.toFixed(2)}ms`);
    console.log(`p99:          ${p99.toFixed(2)}ms`);
    console.log(`Min:          ${min.toFixed(2)}ms`);
    console.log(`Max:          ${max.toFixed(2)}ms`);

    return { avg, p50, p95, p99, min, max };
}

/**
 * Test 1: Simple pagination (findMany + count)
 */
async function testPromiseAll() {
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            take: 10,
            select: { id: true, email: true, firstName: true },
        }),
        prisma.user.count(),
    ]);
    return { users, total };
}

async function testTransaction() {
    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            take: 10,
            select: { id: true, email: true, firstName: true },
        }),
        prisma.user.count(),
    ]);
    return { users, total };
}

/**
 * Test 2: Triple query (like notifications endpoint)
 */
async function testPromiseAllTriple() {
    const [users, total, activeCount] = await Promise.all([
        prisma.user.findMany({ take: 10 }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
    ]);
    return { users, total, activeCount };
}

async function testTransactionTriple() {
    const [users, total, activeCount] = await prisma.$transaction([
        prisma.user.findMany({ take: 10 }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
    ]);
    return { users, total, activeCount };
}

/**
 * Main execution
 */
async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Promise.all vs $transaction Performance Benchmark');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Database: ${process.env.DATABASE_URL?.includes('localhost') ? 'Local PostgreSQL' : 'Remote'}`);
    console.log(`Node.js:  ${process.version}`);
    console.log(`Time:     ${new Date().toISOString()}`);

    const iterations = 100;

    // Test 1: Dual query (standard pagination)
    const promiseAllDual = await benchmark(
        'Promise.all (findMany + count)',
        testPromiseAll,
        iterations
    );

    const transactionDual = await benchmark(
        '$transaction (findMany + count)',
        testTransaction,
        iterations
    );

    // Test 2: Triple query (notifications-style)
    const promiseAllTriple = await benchmark(
        'Promise.all (3 queries)',
        testPromiseAllTriple,
        iterations
    );

    const transactionTriple = await benchmark(
        '$transaction (3 queries)',
        testTransactionTriple,
        iterations
    );

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const dualDiff = ((transactionDual.avg - promiseAllDual.avg) / promiseAllDual.avg * 100);
    const tripleDiff = ((transactionTriple.avg - promiseAllTriple.avg) / promiseAllTriple.avg * 100);

    console.log('📊 Dual Query (findMany + count):');
    console.log(`   Promise.all:  ${promiseAllDual.avg.toFixed(2)}ms`);
    console.log(`   $transaction: ${transactionDual.avg.toFixed(2)}ms`);
    console.log(`   Difference:   ${dualDiff > 0 ? '+' : ''}${dualDiff.toFixed(1)}% ${dualDiff > 0 ? '❌ SLOWER' : '✅ FASTER'}\n`);

    console.log('📊 Triple Query (3 counts):');
    console.log(`   Promise.all:  ${promiseAllTriple.avg.toFixed(2)}ms`);
    console.log(`   $transaction: ${transactionTriple.avg.toFixed(2)}ms`);
    console.log(`   Difference:   ${tripleDiff > 0 ? '+' : ''}${tripleDiff.toFixed(1)}% ${tripleDiff > 0 ? '❌ SLOWER' : '✅ FASTER'}\n`);

    console.log('🎯 Recommendation:');
    if (dualDiff > 5) {
        console.log('   ⚠️  $transaction is SLOWER locally. Consider:');
        console.log('      1. Keep Promise.all for local development');
        console.log('      2. Use $transaction only in production (remote DB)');
        console.log('      3. Or revert changes entirely\n');
    } else if (dualDiff < -5) {
        console.log('   ✅ $transaction is faster! Current implementation is optimal.\n');
    } else {
        console.log('   ⚖️  Performance is similar. Other factors (consistency, simplicity) matter more.\n');
    }

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Benchmark failed:', e);
    process.exit(1);
});
