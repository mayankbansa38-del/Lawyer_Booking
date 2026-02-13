/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Admin Controller
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * HTTP request handlers for admin endpoints.
 * 
 * @module modules/admin/controller
 */

import { getAllUsers, getUserById, updateUserStatus, deleteUser } from './service.js';
import { getAllLawyers, getPendingLawyers, getLawyerById, verifyLawyer, updateLawyer, deleteLawyer } from './service.js';
import logger from '../../utils/logger.js';
import { formatSuccessResponse } from '../../utils/response.js';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  USER MANAGEMENT                                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Get all users
 * 
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req, res) => {
    const users = await getAllUsers();
    res.json(formatSuccessResponse(users, 'Users retrieved successfully'));
};

/**
 * Update user status (active/inactive)
 * 
 * @route   PUT /api/v1/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatusHandler = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await updateUserStatus(id, isActive);
    res.json(formatSuccessResponse(user, 'User status updated successfully'));
};

/**
 * Delete user
 * 
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
export const deleteUserHandler = async (req, res) => {
    const { id } = req.params;

    await deleteUser(id);
    res.json(formatSuccessResponse(null, 'User deleted successfully'));
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  LAWYER MANAGEMENT                                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Get all lawyers
 * 
 * @route   GET /api/v1/admin/lawyers
 * @access  Private (Admin only)
 */
export const getLawyers = async (req, res) => {
    const lawyers = await getAllLawyers();
    res.json(formatSuccessResponse({ lawyers }, 'Lawyers retrieved successfully'));
};

/**
 * Get pending lawyer verifications
 * 
 * @route   GET /api/v1/admin/lawyers/pending
 * @access  Private (Admin only)
 */
export const getPendingLawyersHandler = async (req, res) => {
    const lawyers = await getPendingLawyers();
    res.json(formatSuccessResponse({ lawyers }, 'Pending lawyers retrieved successfully'));
};

/**
 * Verify or reject lawyer
 * 
 * @route   PUT /api/v1/admin/lawyers/:id/verify
 * @access  Private (Admin only)
 */
export const verifyLawyerHandler = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lawyer = await verifyLawyer(id, status, notes);
    res.json(formatSuccessResponse(lawyer, `Lawyer ${status.toLowerCase()} successfully`));
};

/**
 * Update lawyer details
 * 
 * @route   PUT /api/v1/admin/lawyers/:id
 * @access  Private (Admin only)
 */
export const updateLawyerHandler = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const lawyer = await updateLawyer(id, updateData);
    res.json(formatSuccessResponse(lawyer, 'Lawyer updated successfully'));
};

/**
 * Delete lawyer
 * 
 * @route   DELETE /api/v1/admin/lawyers/:id
 * @access  Private (Admin only)
 */
export const deleteLawyerHandler = async (req, res) => {
    const { id } = req.params;

    await deleteLawyer(id);
    res.json(formatSuccessResponse(null, 'Lawyer deleted successfully'));
};
