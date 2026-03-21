/**
 * CancelReasonModal - captures cancellation reason
 */
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function CancelReasonModal({ isOpen, onClose, onConfirm, appointment }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const isConfirmed = appointment?.status === 'CONFIRMED';

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            onClose();
        } catch (error) {
            console.error('Error confirming cancellation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                {/* Header with Background Pattern */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
                
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>

                    <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {isConfirmed 
                                ? 'This is a confirmed appointment. The lawyer has already blocked this time for you. Are you sure you want to cancel?'
                                : 'Are you sure you want to cancel this appointment? This action cannot be undone.'
                            }
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason for cancellation
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please let us know why you are cancelling..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none h-32"
                                required
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                                No, Keep It
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting || !reason.trim()}
                                className="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : null}
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
