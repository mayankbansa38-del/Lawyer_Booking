/**
 * Mock Data Service
 * Centralized mock data for the Lawyer Booking application.
 * This file serves as a temporary data source until backend integration.
 * 
 * @module services/mockData
 */

// ============================================================================
// LAWYERS DATA
// ============================================================================

export const mockLawyers = [
    {
        id: '1',
        name: 'Adv. Rahul Sharma',
        email: 'rahul.sharma@nyaybooker.com',
        phone: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        location: 'Shimla, HP',
        address: '123 Mall Road, Shimla, Himachal Pradesh 171001',
        experience: 12,
        casesWon: 145,
        totalCases: 168,
        specialty: ['Criminal Lawyer', 'Civil Lawyer'],
        languages: ['Hindi', 'English', 'Punjabi'],
        avgCostPerCase: 15000,
        consultationFee: 1500,
        availability: 'Available',
        rating: 4.7,
        totalReviews: 89,
        description: 'Specializing in criminal defense with extensive experience in high-profile cases across Himachal.',
        education: [
            { degree: 'LL.B', institution: 'Delhi University', year: 2012 },
            { degree: 'LL.M (Criminal Law)', institution: 'National Law School', year: 2014 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh'],
        workingHours: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: null
        },
        joinedDate: '2020-03-15'
    },
    {
        id: '2',
        name: 'Adv. Neha Verma',
        email: 'neha.verma@nyaybooker.com',
        phone: '+91 98765 43211',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
        location: 'Dharamshala, HP',
        address: '45 Temple Road, Dharamshala, Himachal Pradesh 176215',
        experience: 8,
        casesWon: 132,
        totalCases: 156,
        specialty: ['Family Lawyer', 'Property Lawyer'],
        languages: ['Hindi', 'English'],
        avgCostPerCase: 8500,
        consultationFee: 1000,
        availability: 'Available',
        rating: 4.8,
        totalReviews: 124,
        description: 'Dedicated family law attorney with a compassionate approach to sensitive domestic matters.',
        education: [
            { degree: 'LL.B', institution: 'Punjab University', year: 2015 },
            { degree: 'LL.M (Family Law)', institution: 'Jammu University', year: 2017 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh'],
        workingHours: {
            monday: { start: '10:00', end: '19:00' },
            tuesday: { start: '10:00', end: '19:00' },
            wednesday: { start: '10:00', end: '19:00' },
            thursday: { start: '10:00', end: '19:00' },
            friday: { start: '10:00', end: '18:00' },
            saturday: { start: '10:00', end: '15:00' },
            sunday: null
        },
        joinedDate: '2021-06-20'
    },
    {
        id: '3',
        name: 'Adv. Aman Gupta',
        email: 'aman.gupta@nyaybooker.com',
        phone: '+91 98765 43212',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        location: 'Mandi, HP',
        address: '78 Court Complex, Mandi, Himachal Pradesh 175001',
        experience: 15,
        casesWon: 178,
        totalCases: 195,
        specialty: ['Corporate Lawyer', 'Tax Law'],
        languages: ['Hindi', 'English', 'Gujarati'],
        avgCostPerCase: 20000,
        consultationFee: 2500,
        availability: 'Busy',
        rating: 4.9,
        totalReviews: 156,
        description: 'Leading expert in corporate law and business regulations in Mandi district.',
        education: [
            { degree: 'LL.B', institution: 'Gujarat National Law University', year: 2008 },
            { degree: 'LL.M (Corporate Law)', institution: 'ILS Law College Pune', year: 2010 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh', 'Supreme Court of India'],
        workingHours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '16:00' },
            saturday: null,
            sunday: null
        },
        joinedDate: '2019-01-10'
    },
    {
        id: '4',
        name: 'Adv. Riya Malhotra',
        email: 'riya.malhotra@nyaybooker.com',
        phone: '+91 98765 43213',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
        location: 'Kangra, HP',
        address: '22 Civil Lines, Kangra, Himachal Pradesh 176001',
        experience: 10,
        casesWon: 121,
        totalCases: 142,
        specialty: ['Property Lawyer', 'Real Estate Law'],
        languages: ['Hindi', 'English', 'Dogri'],
        avgCostPerCase: 12000,
        consultationFee: 1200,
        availability: 'Available',
        rating: 4.6,
        totalReviews: 98,
        description: 'Expert in property disputes and real estate transactions in Kangra valley.',
        education: [
            { degree: 'LL.B', institution: 'Himachal Pradesh University', year: 2013 },
            { degree: 'LL.M (Property Law)', institution: 'Delhi University', year: 2015 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh'],
        workingHours: {
            monday: { start: '09:30', end: '18:30' },
            tuesday: { start: '09:30', end: '18:30' },
            wednesday: { start: '09:30', end: '18:30' },
            thursday: { start: '09:30', end: '18:30' },
            friday: { start: '09:30', end: '17:30' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: null
        },
        joinedDate: '2020-09-05'
    },
    {
        id: '5',
        name: 'Adv. Kunal Mehta',
        email: 'kunal.mehta@nyaybooker.com',
        phone: '+91 98765 43214',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        location: 'Bilaspur, HP',
        address: '56 Station Road, Bilaspur, Himachal Pradesh 174001',
        experience: 6,
        casesWon: 156,
        totalCases: 178,
        specialty: ['Cyber Lawyer', 'Corporate Lawyer'],
        languages: ['Hindi', 'English'],
        avgCostPerCase: 6500,
        consultationFee: 800,
        availability: 'Available',
        rating: 4.8,
        totalReviews: 112,
        description: 'Specialized in cyber crime and digital law with expertise in data protection cases.',
        education: [
            { degree: 'LL.B', institution: 'Amity Law School', year: 2017 },
            { degree: 'Diploma in Cyber Law', institution: 'Asian School of Cyber Laws', year: 2018 }
        ],
        certifications: ['Bar Council of India', 'Certified Cyber Law Consultant'],
        workingHours: {
            monday: { start: '10:00', end: '20:00' },
            tuesday: { start: '10:00', end: '20:00' },
            wednesday: { start: '10:00', end: '20:00' },
            thursday: { start: '10:00', end: '20:00' },
            friday: { start: '10:00', end: '18:00' },
            saturday: { start: '11:00', end: '16:00' },
            sunday: null
        },
        joinedDate: '2022-02-14'
    },
    {
        id: '6',
        name: 'Adv. Tanya Kashyap',
        email: 'tanya.kashyap@nyaybooker.com',
        phone: '+91 98765 43215',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        location: 'Solan, HP',
        address: '89 Lawrence Road, Solan, Himachal Pradesh 173212',
        experience: 20,
        casesWon: 138,
        totalCases: 152,
        specialty: ['Civil Lawyer', 'Human Rights'],
        languages: ['Hindi', 'English', 'Punjabi'],
        avgCostPerCase: 18000,
        consultationFee: 2000,
        availability: 'Limited',
        rating: 4.7,
        totalReviews: 145,
        description: 'Veteran civil rights attorney with decades of experience in landmark cases.',
        education: [
            { degree: 'LL.B', institution: 'Delhi University', year: 2004 },
            { degree: 'LL.M (Human Rights)', institution: 'Jawaharlal Nehru University', year: 2006 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh', 'Supreme Court of India'],
        workingHours: {
            monday: { start: '09:00', end: '16:00' },
            tuesday: { start: '09:00', end: '16:00' },
            wednesday: { start: '09:00', end: '16:00' },
            thursday: { start: '09:00', end: '16:00' },
            friday: { start: '09:00', end: '14:00' },
            saturday: null,
            sunday: null
        },
        joinedDate: '2019-05-22'
    },
    {
        id: '7',
        name: 'Adv. Vikram Singh',
        email: 'vikram.singh@nyaybooker.com',
        phone: '+91 98765 43216',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
        location: 'Kullu, HP',
        address: '34 Akhara Bazaar, Kullu, Himachal Pradesh 175101',
        experience: 9,
        casesWon: 192,
        totalCases: 215,
        specialty: ['Criminal Lawyer', 'Civil Lawyer'],
        languages: ['Hindi', 'English', 'Kulluvi'],
        avgCostPerCase: 9500,
        consultationFee: 1100,
        availability: 'Available',
        rating: 4.9,
        totalReviews: 178,
        description: 'Known for meticulous case preparation and exceptional courtroom presence in Kullu.',
        education: [
            { degree: 'LL.B', institution: 'Himachal Pradesh University', year: 2014 },
            { degree: 'LL.M (Criminal Law)', institution: 'Panjab University', year: 2016 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh'],
        workingHours: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: null
        },
        joinedDate: '2020-11-30'
    },
    {
        id: '8',
        name: 'Adv. Priya Desai',
        email: 'priya.desai@nyaybooker.com',
        phone: '+91 98765 43217',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        location: 'Hamirpur, HP',
        address: '67 Bus Stand Road, Hamirpur, Himachal Pradesh 177001',
        experience: 14,
        casesWon: 167,
        totalCases: 189,
        specialty: ['Family Lawyer', 'Immigration Law'],
        languages: ['Hindi', 'English', 'Marathi'],
        avgCostPerCase: 16500,
        consultationFee: 1800,
        availability: 'Limited',
        rating: 4.8,
        totalReviews: 134,
        description: 'Expert in family law and immigration cases with a client-first approach.',
        education: [
            { degree: 'LL.B', institution: 'Mumbai University', year: 2009 },
            { degree: 'LL.M (Immigration Law)', institution: 'Symbiosis Law School', year: 2011 }
        ],
        certifications: ['Bar Council of India', 'High Court of Himachal Pradesh'],
        workingHours: {
            monday: { start: '10:00', end: '18:00' },
            tuesday: { start: '10:00', end: '18:00' },
            wednesday: { start: '10:00', end: '18:00' },
            thursday: { start: '10:00', end: '18:00' },
            friday: { start: '10:00', end: '16:00' },
            saturday: null,
            sunday: null
        },
        joinedDate: '2019-08-12'
    },
    {
        id: '9',
        name: 'Adv. Suresh Thakur',
        email: 'suresh.thakur@nyaybooker.com',
        phone: '+91 98765 43218',
        image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=400&fit=crop',
        location: 'Bilaspur, HP',
        address: '12 Main Market, Bilaspur, Himachal Pradesh 174001',
        experience: 5,
        casesWon: 45,
        totalCases: 58,
        specialty: ['Civil Lawyer', 'Property Lawyer'],
        languages: ['Hindi', 'English'],
        avgCostPerCase: 5000,
        consultationFee: 600,
        availability: 'Available',
        rating: 4.5,
        totalReviews: 42,
        description: 'Experienced in local civil disputes and property matters in Bilaspur district.',
        education: [
            { degree: 'LL.B', institution: 'Himachal Pradesh University', year: 2018 }
        ],
        certifications: ['Bar Council of India'],
        workingHours: {
            monday: { start: '09:00', end: '19:00' },
            tuesday: { start: '09:00', end: '19:00' },
            wednesday: { start: '09:00', end: '19:00' },
            thursday: { start: '09:00', end: '19:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '10:00', end: '15:00' },
            sunday: null
        },
        joinedDate: '2023-01-05'
    }
];

// ============================================================================
// USERS/CLIENTS DATA
// ============================================================================

export const mockUsers = [
    {
        id: 'u1',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98111 22333',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        location: 'Shimla, HP',
        joinedDate: '2024-01-15',
        totalBookings: 5
    },
    {
        id: 'u2',
        name: 'Priyanka Singh',
        email: 'priyanka.singh@example.com',
        phone: '+91 98222 33444',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priyanka',
        location: 'Dharamshala, HP',
        joinedDate: '2024-02-20',
        totalBookings: 3
    },
    {
        id: 'u3',
        name: 'Amit Sharma',
        email: 'amit.sharma@example.com',
        phone: '+91 98333 44555',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
        location: 'Mandi, HP',
        joinedDate: '2024-03-10',
        totalBookings: 8
    },
    {
        id: 'u4',
        name: 'Sunita Devi',
        email: 'sunita.devi@example.com',
        phone: '+91 98444 55666',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita',
        location: 'Kangra, HP',
        joinedDate: '2024-04-05',
        totalBookings: 2
    },
    {
        id: 'u5',
        name: 'Vikash Verma',
        email: 'vikash.verma@example.com',
        phone: '+91 98555 66777',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikash',
        location: 'Kullu, HP',
        joinedDate: '2024-05-18',
        totalBookings: 4
    }
];

// ============================================================================
// APPOINTMENTS DATA
// ============================================================================

export const mockAppointments = [
    {
        id: 'apt1',
        lawyerId: '1',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        clientEmail: 'rajesh.kumar@example.com',
        clientPhone: '+91 98111 22333',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        lawyerName: 'Adv. Rahul Sharma',
        lawyerImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        date: '2026-02-05',
        time: '10:00',
        duration: 60,
        type: 'Online Consultation',
        status: 'confirmed',
        fee: 1500,
        notes: 'Initial consultation regarding property dispute case',
        caseType: 'Property Dispute',
        createdAt: '2026-01-28T10:30:00'
    },
    {
        id: 'apt2',
        lawyerId: '1',
        clientId: 'u2',
        clientName: 'Priyanka Singh',
        clientEmail: 'priyanka.singh@example.com',
        clientPhone: '+91 98222 33444',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priyanka',
        lawyerName: 'Adv. Rahul Sharma',
        lawyerImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        date: '2026-02-06',
        time: '14:00',
        duration: 45,
        type: 'Chamber Visit',
        status: 'pending',
        fee: 1500,
        notes: 'Follow-up on criminal case documentation',
        caseType: 'Criminal Defense',
        createdAt: '2026-01-30T15:45:00'
    },
    {
        id: 'apt3',
        lawyerId: '2',
        clientId: 'u3',
        clientName: 'Amit Sharma',
        clientEmail: 'amit.sharma@example.com',
        clientPhone: '+91 98333 44555',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
        lawyerName: 'Adv. Neha Verma',
        lawyerImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
        date: '2026-02-04',
        time: '11:30',
        duration: 60,
        type: 'Online Consultation',
        status: 'confirmed',
        fee: 1000,
        notes: 'Divorce proceedings discussion',
        caseType: 'Family Law',
        createdAt: '2026-01-25T09:00:00'
    },
    {
        id: 'apt4',
        lawyerId: '1',
        clientId: 'u4',
        clientName: 'Sunita Devi',
        clientEmail: 'sunita.devi@example.com',
        clientPhone: '+91 98444 55666',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita',
        lawyerName: 'Adv. Rahul Sharma',
        lawyerImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        date: '2026-01-28',
        time: '16:00',
        duration: 60,
        type: 'Chamber Visit',
        status: 'completed',
        fee: 1500,
        notes: 'Land registration case review',
        caseType: 'Property Law',
        createdAt: '2026-01-20T11:20:00'
    },
    {
        id: 'apt5',
        lawyerId: '3',
        clientId: 'u5',
        clientName: 'Vikash Verma',
        clientEmail: 'vikash.verma@example.com',
        clientPhone: '+91 98555 66777',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikash',
        lawyerName: 'Adv. Aman Gupta',
        lawyerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        date: '2026-02-07',
        time: '09:30',
        duration: 90,
        type: 'Chamber Visit',
        status: 'pending',
        fee: 2500,
        notes: 'Business incorporation legal requirements',
        caseType: 'Corporate Law',
        createdAt: '2026-02-01T08:15:00'
    },
    {
        id: 'apt6',
        lawyerId: '1',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        clientEmail: 'rajesh.kumar@example.com',
        clientPhone: '+91 98111 22333',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        lawyerName: 'Adv. Rahul Sharma',
        lawyerImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        date: '2026-01-15',
        time: '11:00',
        duration: 60,
        type: 'Online Consultation',
        status: 'completed',
        fee: 1500,
        notes: 'Initial case assessment completed',
        caseType: 'Property Dispute',
        createdAt: '2026-01-10T14:00:00'
    }
];

// ============================================================================
// CASES DATA
// ============================================================================

export const mockCases = [
    {
        id: 'case1',
        title: 'Property Dispute - Land Registration',
        caseNumber: 'NB-2026-0001',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        lawyerId: '1',
        lawyerName: 'Adv. Rahul Sharma',
        type: 'Property Law',
        status: 'active',
        priority: 'high',
        filedDate: '2026-01-15',
        nextHearing: '2026-02-15',
        court: 'District Court, Shimla',
        description: 'Dispute regarding ancestral land registration and ownership transfer.',
        timeline: [
            { date: '2026-01-15', event: 'Case filed', description: 'Initial documentation submitted' },
            { date: '2026-01-20', event: 'First hearing', description: 'Preliminary hearing conducted' },
            { date: '2026-02-05', event: 'Document review', description: 'Additional documents requested' }
        ],
        documents: ['property_deed.pdf', 'land_survey.pdf', 'ownership_certificate.pdf']
    },
    {
        id: 'case2',
        title: 'Divorce Proceedings',
        caseNumber: 'NB-2026-0002',
        clientId: 'u3',
        clientName: 'Amit Sharma',
        lawyerId: '2',
        lawyerName: 'Adv. Neha Verma',
        type: 'Family Law',
        status: 'active',
        priority: 'medium',
        filedDate: '2026-01-25',
        nextHearing: '2026-02-20',
        court: 'Family Court, Dharamshala',
        description: 'Mutual consent divorce proceedings with settlement of assets.',
        timeline: [
            { date: '2026-01-25', event: 'Case initiated', description: 'Mutual consent application filed' },
            { date: '2026-02-04', event: 'Consultation', description: 'Mediation session conducted' }
        ],
        documents: ['marriage_certificate.pdf', 'asset_declaration.pdf']
    },
    {
        id: 'case3',
        title: 'Criminal Defense - Fraud Allegation',
        caseNumber: 'NB-2026-0003',
        clientId: 'u2',
        clientName: 'Priyanka Singh',
        lawyerId: '1',
        lawyerName: 'Adv. Rahul Sharma',
        type: 'Criminal Law',
        status: 'pending',
        priority: 'high',
        filedDate: '2026-01-30',
        nextHearing: '2026-02-10',
        court: 'Sessions Court, Shimla',
        description: 'Defense against fraud allegations in business transaction.',
        timeline: [
            { date: '2026-01-30', event: 'Case registered', description: 'FIR copy obtained, defense preparation started' }
        ],
        documents: ['fir_copy.pdf', 'transaction_records.pdf']
    },
    {
        id: 'case4',
        title: 'Business Incorporation',
        caseNumber: 'NB-2026-0004',
        clientId: 'u5',
        clientName: 'Vikash Verma',
        lawyerId: '3',
        lawyerName: 'Adv. Aman Gupta',
        type: 'Corporate Law',
        status: 'active',
        priority: 'low',
        filedDate: '2026-02-01',
        nextHearing: null,
        court: null,
        description: 'Legal assistance for private limited company registration.',
        timeline: [
            { date: '2026-02-01', event: 'Engagement started', description: 'Document collection initiated' }
        ],
        documents: ['business_plan.pdf', 'partner_agreement.pdf']
    }
];

// ============================================================================
// PAYMENTS DATA
// ============================================================================

export const mockPayments = [
    {
        id: 'pay1',
        appointmentId: 'apt4',
        caseId: 'case1',
        clientId: 'u4',
        clientName: 'Sunita Devi',
        lawyerId: '1',
        lawyerName: 'Adv. Rahul Sharma',
        amount: 1500,
        platformFee: 150,
        lawyerEarnings: 1350,
        status: 'completed',
        paymentMethod: 'UPI',
        transactionId: 'TXN2026012800001',
        date: '2026-01-28',
        description: 'Consultation fee - Land registration case'
    },
    {
        id: 'pay2',
        appointmentId: 'apt6',
        caseId: 'case1',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        lawyerId: '1',
        lawyerName: 'Adv. Rahul Sharma',
        amount: 1500,
        platformFee: 150,
        lawyerEarnings: 1350,
        status: 'completed',
        paymentMethod: 'Debit Card',
        transactionId: 'TXN2026011500001',
        date: '2026-01-15',
        description: 'Initial consultation - Property dispute'
    },
    {
        id: 'pay3',
        appointmentId: 'apt1',
        caseId: 'case1',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        lawyerId: '1',
        lawyerName: 'Adv. Rahul Sharma',
        amount: 1500,
        platformFee: 150,
        lawyerEarnings: 1350,
        status: 'pending',
        paymentMethod: 'UPI',
        transactionId: 'TXN2026020500001',
        date: '2026-02-05',
        description: 'Follow-up consultation - Property dispute'
    },
    {
        id: 'pay4',
        appointmentId: 'apt3',
        caseId: 'case2',
        clientId: 'u3',
        clientName: 'Amit Sharma',
        lawyerId: '2',
        lawyerName: 'Adv. Neha Verma',
        amount: 1000,
        platformFee: 100,
        lawyerEarnings: 900,
        status: 'completed',
        paymentMethod: 'Net Banking',
        transactionId: 'TXN2026020400001',
        date: '2026-02-04',
        description: 'Consultation - Divorce proceedings'
    }
];

// ============================================================================
// NOTIFICATIONS DATA
// ============================================================================

export const mockNotifications = [
    {
        id: 'notif1',
        userId: 'u1',
        type: 'appointment',
        title: 'Appointment Confirmed',
        message: 'Your appointment with Adv. Rahul Sharma on Feb 5, 2026 at 10:00 AM has been confirmed.',
        read: false,
        createdAt: '2026-02-01T09:00:00'
    },
    {
        id: 'notif2',
        userId: 'u1',
        type: 'reminder',
        title: 'Upcoming Appointment',
        message: 'Reminder: You have an appointment with Adv. Rahul Sharma tomorrow at 10:00 AM.',
        read: false,
        createdAt: '2026-02-04T18:00:00'
    },
    {
        id: 'notif3',
        userId: 'u3',
        type: 'case',
        title: 'Case Update',
        message: 'Your case NB-2026-0002 has a new hearing scheduled for Feb 20, 2026.',
        read: true,
        createdAt: '2026-01-30T14:00:00'
    },
    {
        id: 'notif4',
        userId: '1',
        userType: 'lawyer',
        type: 'appointment',
        title: 'New Appointment Request',
        message: 'You have a new appointment request from Priyanka Singh for Feb 6, 2026.',
        read: false,
        createdAt: '2026-01-30T15:50:00'
    },
    {
        id: 'notif5',
        userId: '1',
        userType: 'lawyer',
        type: 'payment',
        title: 'Payment Received',
        message: 'Payment of ₹1,500 received from Rajesh Kumar for consultation.',
        read: true,
        createdAt: '2026-01-15T12:00:00'
    }
];

// ============================================================================
// REVIEWS DATA
// ============================================================================

export const mockReviews = [
    {
        id: 'rev1',
        lawyerId: '1',
        clientId: 'u1',
        clientName: 'Rajesh Kumar',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        rating: 5,
        comment: 'Excellent lawyer with deep knowledge of property law. Very professional and responsive.',
        date: '2026-01-20'
    },
    {
        id: 'rev2',
        lawyerId: '1',
        clientId: 'u4',
        clientName: 'Sunita Devi',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita',
        rating: 4,
        comment: 'Good experience overall. Helped me understand the legal process clearly.',
        date: '2026-01-29'
    },
    {
        id: 'rev3',
        lawyerId: '2',
        clientId: 'u3',
        clientName: 'Amit Sharma',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
        rating: 5,
        comment: 'Adv. Neha handled my case with great sensitivity and professionalism. Highly recommended for family law matters.',
        date: '2026-02-04'
    },
    {
        id: 'rev4',
        lawyerId: '7',
        clientId: 'u5',
        clientName: 'Vikash Verma',
        clientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikash',
        rating: 5,
        comment: 'Outstanding courtroom presence. Won my case with compelling arguments.',
        date: '2026-01-25'
    }
];

// ============================================================================
// DOCUMENTS DATA
// ============================================================================

export const mockDocuments = [
    {
        id: 'doc1',
        name: 'Property Deed',
        filename: 'property_deed.pdf',
        type: 'pdf',
        size: '2.4 MB',
        caseId: 'case1',
        uploadedBy: 'lawyer',
        uploaderId: '1',
        createdAt: '2026-01-15T10:30:00',
        category: 'Legal Document'
    },
    {
        id: 'doc2',
        name: 'Land Survey Report',
        filename: 'land_survey.pdf',
        type: 'pdf',
        size: '5.1 MB',
        caseId: 'case1',
        uploadedBy: 'client',
        uploaderId: 'u1',
        createdAt: '2026-01-16T14:20:00',
        category: 'Evidence'
    },
    {
        id: 'doc3',
        name: 'Marriage Certificate',
        filename: 'marriage_certificate.pdf',
        type: 'pdf',
        size: '1.2 MB',
        caseId: 'case2',
        uploadedBy: 'client',
        uploaderId: 'u3',
        createdAt: '2026-01-25T11:00:00',
        category: 'Legal Document'
    },
    {
        id: 'doc4',
        name: 'FIR Copy',
        filename: 'fir_copy.pdf',
        type: 'pdf',
        size: '856 KB',
        caseId: 'case3',
        uploadedBy: 'lawyer',
        uploaderId: '1',
        createdAt: '2026-01-30T16:45:00',
        category: 'Court Document'
    }
];

// ============================================================================
// ANALYTICS DATA (For Lawyer Dashboard)
// ============================================================================

export const mockAnalytics = {
    lawyerId: '1',
    profileViews: {
        total: 1247,
        thisMonth: 312,
        lastMonth: 289,
        trend: 'up',
        trendPercentage: 8
    },
    bookingRate: {
        total: 78,
        percentage: 42,
        trend: 'up',
        trendPercentage: 5
    },
    responseRate: {
        percentage: 95,
        avgResponseTime: '2 hours'
    },
    earnings: {
        thisMonth: 45000,
        lastMonth: 38000,
        trend: 'up',
        trendPercentage: 18
    },
    monthlyData: [
        { month: 'Aug', views: 180, bookings: 12, earnings: 28000 },
        { month: 'Sep', views: 210, bookings: 15, earnings: 32000 },
        { month: 'Oct', views: 245, bookings: 18, earnings: 35000 },
        { month: 'Nov', views: 268, bookings: 20, earnings: 36000 },
        { month: 'Dec', views: 289, bookings: 22, earnings: 38000 },
        { month: 'Jan', views: 312, bookings: 25, earnings: 45000 }
    ]
};

// ============================================================================
// TIME SLOTS DATA (For Booking)
// ============================================================================

export const generateTimeSlots = (date, lawyerId) => {
    const lawyer = mockLawyers.find(l => l.id === lawyerId);
    if (!lawyer) return [];

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = lawyer.workingHours[dayOfWeek];

    if (!workingHours) return [];

    const slots = [];
    const [startHour] = workingHours.start.split(':').map(Number);
    const [endHour] = workingHours.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
        const isBooked = mockAppointments.some(
            apt => apt.lawyerId === lawyerId && apt.date === date && apt.time === `${hour.toString().padStart(2, '0')}:00`
        );

        slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: !isBooked
        });

        if (hour + 0.5 < endHour) {
            const isHalfBooked = mockAppointments.some(
                apt => apt.lawyerId === lawyerId && apt.date === date && apt.time === `${hour.toString().padStart(2, '0')}:30`
            );
            slots.push({
                time: `${hour.toString().padStart(2, '0')}:30`,
                available: !isHalfBooked
            });
        }
    }

    return slots;
};

// ============================================================================
// FAVORITES DATA
// ============================================================================

export const mockFavorites = [
    { id: 'fav1', userId: 'u1', lawyerId: '1', addedAt: '2026-01-10' },
    { id: 'fav2', userId: 'u1', lawyerId: '2', addedAt: '2026-01-12' },
    { id: 'fav3', userId: 'u3', lawyerId: '2', addedAt: '2026-01-20' },
    { id: 'fav4', userId: 'u5', lawyerId: '3', addedAt: '2026-01-25' }
];
