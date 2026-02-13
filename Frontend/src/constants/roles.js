/**
 * Shared role definitions for Login and Signup forms.
 * Single source of truth — eliminates duplication across auth pages.
 *
 * @module constants/roles
 */
import { User, Scale, ShieldCheck } from 'lucide-react';

export const LOGIN_ROLES = [
    { id: 'User', icon: User, label: 'Client', desc: 'Book consultations' },
    { id: 'Lawyer', icon: Scale, label: 'Lawyer', desc: 'Manage appointments' },
    { id: 'Admin', icon: ShieldCheck, label: 'Admin', desc: 'Full access' },
];

export const SIGNUP_ROLES = [
    { id: 'User', icon: User, label: 'Client', desc: 'Find & book lawyers' },
    { id: 'Lawyer', icon: Scale, label: 'Lawyer', desc: 'Grow your practice' },
];
