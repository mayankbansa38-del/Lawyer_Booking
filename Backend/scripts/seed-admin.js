/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Admin User Seeder
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Creates the default admin user if not exists.
 * Run with: node scripts/seed-admin.js
 * 
 * @module scripts/seed-admin
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const ADMIN_EMAIL = 'admin@nyaybooker.com';
const ADMIN_PASSWORD = 'Admin@123';

async function seedAdmin() {
    console.log('🌱 Seeding admin user...\n');

    try {
        // Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
        });

        if (existingAdmin) {
            // Update password to ensure login works
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
            await prisma.user.update({
                where: { email: ADMIN_EMAIL },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    isEmailVerified: true,
                    isActive: true,
                },
            });
            console.log('✅ Admin user password updated:');
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log(`   Password: ${ADMIN_PASSWORD}`);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                role: 'ADMIN',
                isEmailVerified: true,
                isActive: true,
            },
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('   ┌─────────────────────────────────────┐');
        console.log('   │  Admin Login Credentials            │');
        console.log('   ├─────────────────────────────────────┤');
        console.log(`   │  Username: admin                    │`);
        console.log(`   │  Email:    ${ADMIN_EMAIL}  │`);
        console.log(`   │  Password: ${ADMIN_PASSWORD}              │`);
        console.log('   └─────────────────────────────────────┘\n');
        console.log('   You can login with username "admin" or email.');

    } catch (error) {
        console.error('❌ Failed to seed admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
