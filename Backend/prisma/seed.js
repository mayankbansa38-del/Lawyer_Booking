/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Database Seeder
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Seeds the database with initial data for development and testing.
 * 
 * Usage: node prisma/seed.js
 * 
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const PRACTICE_AREAS = [
    { name: 'Criminal Lawyer', slug: 'criminal-lawyer', description: 'Defense and prosecution in criminal cases', icon: 'gavel', displayOrder: 1 },
    { name: 'Family Lawyer', slug: 'family-lawyer', description: 'Divorce, custody, adoption, and family matters', icon: 'family', displayOrder: 2 },
    { name: 'Corporate Lawyer', slug: 'corporate-lawyer', description: 'Business formation, contracts, and compliance', icon: 'business', displayOrder: 3 },
    { name: 'Cyber Lawyer', slug: 'cyber-lawyer', description: 'Cyber crimes, data protection, and digital rights', icon: 'lock', displayOrder: 4 },
    { name: 'Civil Lawyer', slug: 'civil-lawyer', description: 'Civil disputes, property, and lawsuits', icon: 'scale', displayOrder: 5 },
    { name: 'Immigration Law', slug: 'immigration-law', description: 'Visas, citizenship, and immigration matters', icon: 'flight', displayOrder: 6 },
    { name: 'Human Rights', slug: 'human-rights', description: 'Protection of fundamental human rights', icon: 'accessibility', displayOrder: 7 },
    { name: 'Real Estate Law', slug: 'real-estate-law', description: 'Property transactions and disputes', icon: 'home', displayOrder: 8 },
    { name: 'Tax Law', slug: 'tax-law', description: 'Tax planning, disputes, and compliance', icon: 'receipt', displayOrder: 9 },
];

const ADMIN_USERS = [
    {
        email: 'mayank@nyaybooker.com',
        password: 'Admin@123456',
        firstName: 'Mayank',
        lastName: 'Admin',
        role: 'ADMIN',
        isEmailVerified: true,
    },
    {
        email: 'ashruf@nyaybooker.com',
        password: 'Admin@123456',
        firstName: 'Ashruf',
        lastName: 'Admin',
        role: 'ADMIN',
        isEmailVerified: true,
    },
    {
        email: 'piyush@nyaybooker.com',
        password: 'Admin@123456',
        firstName: 'Piyush',
        lastName: 'Admin',
        role: 'ADMIN',
        isEmailVerified: true,
    }
];

const TEST_USERS = [
    { email: 'user1@example.com', password: 'User@123456', firstName: 'Rahul', lastName: 'Sharma', phone: '+919876543210', isEmailVerified: true },
    { email: 'user2@example.com', password: 'User@123456', firstName: 'Priya', lastName: 'Patel', phone: '+919876543211', isEmailVerified: true },
    { email: 'user3@example.com', password: 'User@123456', firstName: 'Amit', lastName: 'Kumar', phone: '+919876543212', isEmailVerified: true },
];

const TEST_LAWYERS = [
    {
        user: {
            email: 'advocate.singh@example.com',
            password: 'Lawyer@123456',
            firstName: 'Vikram',
            lastName: 'Singh',
            phone: '+919876543220',
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/1234/2015',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2015,
            bio: 'Practicing primarily at the Himachal Pradesh High Court, Shimla and District & Sessions Court, Shimla. Experienced criminal defense attorney with over 9 years of practice. Specialized in bail matters, criminal appeals, and white-collar crimes. Successfully represented clients in over 500 cases.',
            headline: 'Senior Criminal Defense Advocate | HP High Court Practitioner',
            experience: 9,
            hourlyRate: 3000,
            consultationFee: 1500,
            city: 'Shimla',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['criminal-lawyer', 'civil-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.mehra@example.com',
            password: 'Lawyer@123456',
            firstName: 'Anjali',
            lastName: 'Mehra',
            phone: '+919876543221',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/5678/2018',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2018,
            bio: 'Practicing at the District & Sessions Court, Hamirpur and Supreme Court of India. Passionate family law practitioner dedicated to helping families through difficult times. Expertise in divorce, custody, and adoption cases with a compassionate approach.',
            headline: 'Family Law Specialist | District Court Practitioner',
            experience: 6,
            hourlyRate: 2500,
            consultationFee: 1000,
            city: 'Hamirpur',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['family-lawyer', 'civil-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.reddy@example.com',
            password: 'Lawyer@123456',
            firstName: 'Suresh',
            lastName: 'Reddy',
            phone: '+919876543222',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/9012/2012',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2012,
            bio: 'Practicing primarily at the National Company Law Tribunal (Chandigarh Bench) and HP High Court, Shimla. Corporate law expert with extensive experience in startups, M&A, and venture capital transactions. Advised over 100 companies from startups to Fortune 500.',
            headline: 'Corporate & Startup Attorney | National Company Law Tribunal Practitioner',
            experience: 12,
            hourlyRate: 5000,
            consultationFee: 2500,
            city: 'Dharamshala',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            featured: true,
            featuredOrder: 1,
            specializations: ['corporate-lawyer', 'tax-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.gupta@example.com',
            password: 'Lawyer@123456',
            firstName: 'Neha',
            lastName: 'Gupta',
            phone: '+919876543223',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/3456/2016',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2016,
            bio: 'Practicing at the District & Sessions Court, Solan and the Real Estate Regulatory Authority (RERA) Shimla. Real estate law specialist with deep knowledge of property registration, title verification, and dispute resolution. Helped clients secure investments worth over ₹500 crores.',
            headline: 'Real Estate & Property Law Expert | Real Estate Regulatory Authority Practitioner',
            experience: 8,
            hourlyRate: 2000,
            consultationFee: 800,
            city: 'Solan',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['real-estate-law', 'civil-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.khan@example.com',
            password: 'Lawyer@123456',
            firstName: 'Imran',
            lastName: 'Khan',
            phone: '+919876543224',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/7890/2019',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2019,
            bio: 'Practicing at the Income Tax Appellate Tribunal (Chandigarh Bench) and District & Sessions Court, Mandi. Young and dynamic tax law practitioner specializing in GST, income tax disputes, and international taxation. Certified by ICAI.',
            headline: 'Tax Law & GST Consultant | Income Tax Appellate Tribunal Practitioner',
            experience: 5,
            hourlyRate: 1800,
            consultationFee: 500,
            city: 'Mandi',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['tax-law', 'corporate-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.rao@example.com',
            password: 'Lawyer@123456',
            firstName: 'Lakshmi',
            lastName: 'Rao',
            phone: '+919876543225',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/2345/2010',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2010,
            bio: 'Immigration law veteran based in Kullu, Himachal Pradesh with expertise in US, UK, Canada, and Australia visas. Practices at the District & Sessions Court, Kullu and appears before the HP High Court, Shimla for immigration-related appeals. Former consulate consultant with over 14 years of experience.',
            headline: 'Immigration & Visa Specialist | Former Consulate Advisor',
            experience: 14,
            hourlyRate: 4000,
            consultationFee: 2000,
            city: 'Kullu',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            featured: true,
            featuredOrder: 2,
            specializations: ['immigration-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.thakur@example.com',
            password: 'Lawyer@123456',
            firstName: 'Rajesh',
            lastName: 'Thakur',
            phone: '+919876543226',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/4567/2014',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2014,
            bio: 'Practicing advocate at the District & Sessions Court, Bilaspur, Himachal Pradesh with over 10 years of courtroom experience. Regularly appears before the HP High Court, Shimla Bench for civil and criminal appeals. Specializes in land revenue matters, property disputes, and criminal defense cases in the Bilaspur district judiciary.',
            headline: 'District Court Advocate | Bilaspur | HP High Court Practitioner',
            experience: 10,
            hourlyRate: 2500,
            consultationFee: 1200,
            city: 'Bilaspur',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['criminal-lawyer', 'real-estate-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.verma@example.com',
            password: 'Lawyer@123456',
            firstName: 'Sunita',
            lastName: 'Verma',
            phone: '+919876543227',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/6789/2017',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2017,
            bio: 'Dedicated civil and family law practitioner based in Kangra, Himachal Pradesh. Appears regularly before the District & Sessions Court, Kangra at Dharamshala and the Sub-Divisional Judicial Magistrate Court, Kangra. Also handles appeals before the HP High Court. Known for expertise in matrimonial disputes, domestic violence cases, and civil litigation across the Kangra district courts.',
            headline: 'Civil & Family Law Advocate | Kangra District Court',
            experience: 7,
            hourlyRate: 2200,
            consultationFee: 1000,
            city: 'Kangra',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['family-lawyer', 'civil-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    // ── 2nd Lawyer per District ──────────────────────────────────────────
    {
        user: {
            email: 'advocate.chauhan@example.com',
            password: 'Lawyer@123456',
            firstName: 'Deepak',
            lastName: 'Chauhan',
            phone: '+919876543228',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/1122/2013',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2013,
            bio: 'Seasoned civil litigation expert with over 11 years of practice. Regularly appears before the District & Sessions Court, Shimla and the Himachal Pradesh High Court, Shimla. Handles property disputes, contract matters, and writ petitions. Well-known for representing clients in landmark civil cases across Shimla district judiciary.',
            headline: 'Senior Civil Advocate | HP High Court, Shimla',
            experience: 11,
            hourlyRate: 3500,
            consultationFee: 1500,
            city: 'Shimla',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['civil-lawyer', 'real-estate-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.negi@example.com',
            password: 'Lawyer@123456',
            firstName: 'Pooja',
            lastName: 'Negi',
            phone: '+919876543229',
            avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/3344/2016',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2016,
            bio: 'Dedicated criminal law advocate practicing at the District & Sessions Court, Hamirpur, Himachal Pradesh. Also appears before the Chief Judicial Magistrate Court, Hamirpur and handles criminal appeals at the HP High Court. Specializes in bail applications, criminal trials, and NDPS cases across Hamirpur district.',
            headline: 'Criminal Defense Advocate | District Court Hamirpur',
            experience: 8,
            hourlyRate: 2200,
            consultationFee: 900,
            city: 'Hamirpur',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['criminal-lawyer', 'human-rights'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.kapoor@example.com',
            password: 'Lawyer@123456',
            firstName: 'Manish',
            lastName: 'Kapoor',
            phone: '+919876543230',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/5566/2011',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2011,
            bio: 'Experienced cyber law and digital rights advocate based in Dharamshala. Practices at the District & Sessions Court, Kangra at Dharamshala and appears before the HP High Court for cyber crime appeals. Expert in IT Act cases, data privacy, online fraud, and digital intellectual property disputes across Kangra district.',
            headline: 'Cyber Law & Digital Rights Expert | Dharamshala',
            experience: 13,
            hourlyRate: 4000,
            consultationFee: 2000,
            city: 'Dharamshala',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['cyber-lawyer', 'criminal-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.sharma.solan@example.com',
            password: 'Lawyer@123456',
            firstName: 'Ankit',
            lastName: 'Sharma',
            phone: '+919876543231',
            avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/7788/2019',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2019,
            bio: 'Dynamic corporate and tax law practitioner based in Solan, Himachal Pradesh. Appears before the District & Sessions Court, Solan and handles corporate litigation and tax appeals at the HP High Court, Shimla. Specializes in company law, GST disputes, startup compliance, and commercial arbitration across Solan district.',
            headline: 'Corporate & Tax Advocate | District Court Solan',
            experience: 5,
            hourlyRate: 2000,
            consultationFee: 800,
            city: 'Solan',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['corporate-lawyer', 'tax-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.devi.mandi@example.com',
            password: 'Lawyer@123456',
            firstName: 'Kavita',
            lastName: 'Devi',
            phone: '+919876543232',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/9900/2015',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2015,
            bio: 'Prominent human rights and family law advocate in Mandi, Himachal Pradesh. Regularly appears before the District & Sessions Court, Mandi and the Sub-Divisional Judicial Magistrate Court, Mandi. Also handles PIL and human rights petitions at the HP High Court. Known for fighting domestic violence, child rights, and women empowerment cases across Mandi district.',
            headline: 'Human Rights & Family Law Advocate | Mandi',
            experience: 9,
            hourlyRate: 2500,
            consultationFee: 1000,
            city: 'Mandi',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['human-rights', 'family-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.rathore.kullu@example.com',
            password: 'Lawyer@123456',
            firstName: 'Arun',
            lastName: 'Rathore',
            phone: '+919876543233',
            avatar: 'https://images.unsplash.com/photo-1480429370612-2cd1e144a1e4?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/1133/2014',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2014,
            bio: 'Experienced civil and real estate law advocate based in Kullu, Himachal Pradesh. Practices at the District & Sessions Court, Kullu and the Sub-Divisional Judicial Magistrate Court, Kullu. Handles property appeals and land revenue matters at the HP High Court, Shimla. Expertise in land acquisition, mutation cases, and property registration disputes across Kullu valley.',
            headline: 'Civil & Property Law Expert | District Court Kullu',
            experience: 10,
            hourlyRate: 2800,
            consultationFee: 1200,
            city: 'Kullu',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['real-estate-law', 'civil-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.kumari.bilaspur@example.com',
            password: 'Lawyer@123456',
            firstName: 'Meena',
            lastName: 'Kumari',
            phone: '+919876543234',
            avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/2244/2017',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2017,
            bio: 'Skilled family and immigration law advocate in Bilaspur, Himachal Pradesh. Practices at the District & Sessions Court, Bilaspur and the Family Court, Bilaspur. Also appears before the HP High Court for matrimonial and immigration appeals. Specializes in divorce, child custody, NRI matrimonial disputes, and passport/visa related legal matters across Bilaspur district.',
            headline: 'Family & Immigration Advocate | Bilaspur District Court',
            experience: 7,
            hourlyRate: 2000,
            consultationFee: 800,
            city: 'Bilaspur',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['family-lawyer', 'immigration-law'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
    {
        user: {
            email: 'advocate.dogra.kangra@example.com',
            password: 'Lawyer@123456',
            firstName: 'Vikrant',
            lastName: 'Dogra',
            phone: '+919876543235',
            avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'HP/3355/2012',
            barCouncilState: 'Himachal Pradesh',
            enrollmentYear: 2012,
            bio: 'Senior criminal and cyber law advocate based in Kangra, Himachal Pradesh. Regularly appears before the District & Sessions Court, Kangra at Dharamshala and the Chief Judicial Magistrate Court, Kangra. Handles criminal and cyber crime appeals at the HP High Court, Shimla. Known for expertise in cyber fraud, digital forgery, bail matters, and serious criminal trial defense across Kangra district.',
            headline: 'Criminal & Cyber Law Specialist | Kangra District Court',
            experience: 12,
            hourlyRate: 3500,
            consultationFee: 1500,
            city: 'Kangra',
            state: 'Himachal Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['cyber-lawyer', 'criminal-lawyer'],
            averageRating: 0,
            totalReviews: 0,
        },
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function seedPracticeAreas() {
    console.log('🌱 Seeding practice areas...');

    // 1. Delete practice areas that are NOT in our list
    const slugList = PRACTICE_AREAS.map(p => p.slug);
    await prisma.practiceArea.deleteMany({
        where: {
            slug: { notIn: slugList }
        }
    });

    // 2. Upsert the valid ones
    for (const area of PRACTICE_AREAS) {
        await prisma.practiceArea.upsert({
            where: { slug: area.slug },
            update: area,
            create: area,
        });
    }

    console.log(`✅ ${PRACTICE_AREAS.length} practice areas seeded and verified`);
}

async function seedAdmin() {
    console.log('🌱 Seeding admin users...');

    for (const admin of ADMIN_USERS) {
        const hashedPassword = await hashPassword(admin.password);

        await prisma.user.upsert({
            where: { email: admin.email },
            update: {},
            create: {
                ...admin,
                password: hashedPassword,
            },
        });
    }

    console.log(`✅ ${ADMIN_USERS.length} admin users seeded`);
}

async function seedTestUsers() {
    console.log('🌱 Seeding test users...');

    for (const user of TEST_USERS) {
        const hashedPassword = await hashPassword(user.password);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                ...user,
                password: hashedPassword,
                role: 'USER',
            },
        });
    }

    console.log(`✅ ${TEST_USERS.length} test users seeded`);
}

async function seedTestLawyers() {
    console.log('🌱 Seeding test lawyers...');

    // Get practice areas
    const practiceAreaMap = {};
    const areas = await prisma.practiceArea.findMany();
    areas.forEach(a => { practiceAreaMap[a.slug] = a.id; });

    for (const data of TEST_LAWYERS) {
        const hashedPassword = await hashPassword(data.user.password);

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email: data.user.email },
            update: {
                avatar: data.user.avatar
            },
            create: {
                ...data.user,
                password: hashedPassword,
                role: 'LAWYER',
                isEmailVerified: true,
            },
        });

        // Create or update lawyer
        const lawyer = await prisma.lawyer.upsert({
            where: { userId: user.id },
            update: {
                bio: data.lawyer.bio,
                headline: data.lawyer.headline,
                verificationStatus: data.lawyer.verificationStatus,
                consultationFee: data.lawyer.consultationFee || data.lawyer.hourlyRate,
                featured: data.lawyer.featured,
                featuredOrder: data.lawyer.featuredOrder,
                city: data.lawyer.city,
                state: data.lawyer.state,
                barCouncilId: data.lawyer.barCouncilId,
                barCouncilState: data.lawyer.barCouncilState,
                averageRating: data.lawyer.averageRating,
                totalReviews: data.lawyer.totalReviews,
            },
            create: {
                userId: user.id,
                barCouncilId: data.lawyer.barCouncilId,
                barCouncilState: data.lawyer.barCouncilState,
                enrollmentYear: data.lawyer.enrollmentYear,
                bio: data.lawyer.bio,
                headline: data.lawyer.headline,
                experience: data.lawyer.experience,
                hourlyRate: data.lawyer.hourlyRate,
                consultationFee: data.lawyer.consultationFee || data.lawyer.hourlyRate,
                city: data.lawyer.city,
                state: data.lawyer.state,
                isAvailable: data.lawyer.isAvailable,
                verificationStatus: data.lawyer.verificationStatus,
                verifiedAt: data.lawyer.verificationStatus === 'VERIFIED' ? new Date() : null,
                featured: data.lawyer.featured || false,
                featuredOrder: data.lawyer.featuredOrder,
                averageRating: data.lawyer.averageRating,
                totalReviews: data.lawyer.totalReviews,
                availability: {
                    monday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    tuesday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    wednesday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    thursday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    friday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }],
                    saturday: [],
                    sunday: [],
                },
            },
        });

        // Create specializations
        if (data.lawyer.specializations) {
            for (let i = 0; i < data.lawyer.specializations.length; i++) {
                const slug = data.lawyer.specializations[i];
                const practiceAreaId = practiceAreaMap[slug];

                if (practiceAreaId) {
                    await prisma.lawyerSpecialization.upsert({
                        where: {
                            lawyerId_practiceAreaId: {
                                lawyerId: lawyer.id,
                                practiceAreaId,
                            },
                        },
                        update: {},
                        create: {
                            lawyerId: lawyer.id,
                            practiceAreaId,
                            isPrimary: i === 0,
                            yearsExperience: data.lawyer.experience,
                        },
                    });
                }
            }
        }
    }

    console.log(`✅ ${TEST_LAWYERS.length} test lawyers seeded`);
}

async function seedSampleBookingsAndReviews() {
    console.log('🌱 Seeding sample bookings and reviews...');

    const users = await prisma.user.findMany({ where: { role: 'USER' } });
    const lawyers = await prisma.lawyer.findMany({ where: { verificationStatus: 'VERIFIED' } });

    if (users.length === 0 || lawyers.length === 0) {
        console.log('⏭️ Skipping bookings/reviews - no users or lawyers found');
        return;
    }

    let bookingsCreated = 0;
    let reviewsCreated = 0;

    for (const user of users) {
        // Create 1-2 completed bookings per user
        const numBookings = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < numBookings && i < lawyers.length; i++) {
            const lawyer = lawyers[i % lawyers.length];
            const bookingNumber = `NYB${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // Random date in the past month
            const daysAgo = Math.floor(Math.random() * 30) + 1;
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() - daysAgo);

            const booking = await prisma.booking.create({
                data: {
                    bookingNumber,
                    clientId: user.id,
                    lawyerId: lawyer.id,
                    scheduledDate,
                    scheduledTime: '10:00',
                    duration: 60,
                    meetingType: Math.random() > 0.5 ? 'VIDEO' : 'IN_PERSON',
                    status: 'COMPLETED',
                    amount: lawyer.hourlyRate,
                    confirmedAt: scheduledDate,
                    completedAt: scheduledDate,
                },
            });

            bookingsCreated++;

            // Create payment
            await prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: lawyer.hourlyRate,
                    status: 'COMPLETED',
                    method: 'UPI',
                    gatewayOrderId: `order_${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
                    gatewayPaymentId: `pay_${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
                    processedAt: scheduledDate,
                },
            });

            // Not generating any reviews automatically to ensure starting state is clean for this feature
        }
    }

    // Recalculate actual averageRating and totalReviews from real reviews
    for (const lawyer of lawyers) {
        const aggregation = await prisma.review.aggregate({
            where: { lawyerId: lawyer.id, isPublished: true },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                averageRating: aggregation._avg.rating || 0,
                totalReviews: aggregation._count.rating || 0,
            },
        });
    }

    console.log(`✅ ${bookingsCreated} bookings and ${reviewsCreated} reviews seeded`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           NyayBooker Database Seeder                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        await seedPracticeAreas();
        await seedAdmin();
        await seedTestUsers();
        await seedTestLawyers();
        await seedSampleBookingsAndReviews();

        console.log('');
        console.log('✅ Database seeding completed successfully!');
        console.log('');
        console.log('Test Credentials:');
        console.log('─────────────────');
        console.log('Admin:  admin@nyaybooker.com / Admin@123456');
        console.log('User:   user1@example.com / User@123456');
        console.log('Lawyer: advocate.singh@example.com / Lawyer@123456');
        console.log('');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
