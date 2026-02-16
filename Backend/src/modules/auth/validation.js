/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Auth Module Validation Schemas
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Joi validation schemas for authentication endpoints.
 * 
 * @module modules/auth/validation
 */

import Joi from 'joi';
import { REGEX, USER_ROLES } from '../../config/constants.js';

/**
 * Password validation rules
 */
const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(REGEX.PASSWORD)
    .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long',
    });

/**
 * Email validation
 */
const emailSchema = Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .required();

/**
 * User registration schema
 */
export const registerSchema = {
    body: Joi.object({
        email: emailSchema,
        password: passwordSchema.required(),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
            }),
        firstName: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'First name must be at least 2 characters',
            }),
        lastName: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Last name must be at least 2 characters',
            }),
        phone: Joi.string()
            .trim()
            .pattern(REGEX.PHONE_INDIA)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid phone number format',
            }),
        role: Joi.string()
            .valid(USER_ROLES.USER, USER_ROLES.LAWYER)
            .default(USER_ROLES.USER),
    }),
};

/**
 * Lawyer registration schema (extends user registration)
 */
export const registerLawyerSchema = {
    body: Joi.object({
        // User fields
        email: emailSchema,
        password: passwordSchema.required(),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
            }),
        firstName: Joi.string().trim().min(2).max(50).required(),
        lastName: Joi.string().trim().min(2).max(50).required(),
        phone: Joi.string().trim().pattern(REGEX.PHONE_INDIA).required(),

        // Lawyer-specific fields
        barCouncilId: Joi.string()
            .trim()
            .uppercase()
            .min(5)
            .max(50)
            .required()
            .messages({
                'any.required': 'Bar Council ID is required for lawyer registration',
            }),
        barCouncilState: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required(),
        enrollmentYear: Joi.number()
            .integer()
            .min(1950)
            .max(new Date().getFullYear())
            .required(),
        city: Joi.string().trim().min(2).max(100).optional(),
        state: Joi.string().trim().min(2).max(100).optional(),
    }),
};

/**
 * Login schema
 */
export const loginSchema = {
    body: Joi.object({
        email: emailSchema,
        password: Joi.string().required().messages({
            'any.required': 'Password is required',
        }),
        rememberMe: Joi.boolean().default(false),
    }),
};

/**
 * Email verification schema
 */
export const verifyEmailSchema = {
    body: Joi.object({
        token: Joi.string().required().messages({
            'any.required': 'Verification token is required',
        }),
    }),
};

/**
 * Resend verification email schema
 */
export const resendVerificationSchema = {
    body: Joi.object({
        email: emailSchema,
    }),
};

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = {
    body: Joi.object({
        email: emailSchema,
    }),
};

/**
 * Reset password schema
 */
export const resetPasswordSchema = {
    body: Joi.object({
        token: Joi.string().required(),
        password: passwordSchema.required(),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
            }),
    }),
};

/**
 * Change password schema (for authenticated users)
 */
export const changePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'Current password is required',
        }),
        newPassword: passwordSchema.required(),
        confirmPassword: Joi.string()
            .valid(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
            }),
    }),
};

/**
 * Refresh token schema
 */
export const refreshTokenSchema = {
    body: Joi.object({
        refreshToken: Joi.string().required().messages({
            'any.required': 'Refresh token is required',
        }),
    }),
};

export default {
    registerSchema,
    registerLawyerSchema,
    loginSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
};
