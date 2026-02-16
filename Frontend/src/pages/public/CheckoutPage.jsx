/**
 * Checkout Page — Real Payment via Backend
 * Shows booking summary + payment form → creates booking+payment → success
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    CreditCard, Lock, ShieldCheck, CheckCircle, ArrowLeft,
    Calendar, Clock, Video, MapPin, User, Loader2
} from 'lucide-react';
import { lawyerAPI, paymentAPI } from '../../services/api';

// ─── Card formatting helpers ────────────────────────────────────────────────

function formatCardNumber(value) {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
}

// ─── Success Screen ─────────────────────────────────────────────────────────

function PaymentSuccess({ lawyer, booking, paymentResult }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center animate-fade-in">
                {/* Animated checkmark */}
                <div className="relative mx-auto mb-6 w-20 h-20">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                        <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
                <p className="text-gray-500 mb-6">Your consultation has been booked and confirmed.</p>

                {/* Booking receipt */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <img
                            src={lawyer?.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(lawyer?.name || 'L')}
                            alt={lawyer?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                            <p className="font-semibold text-gray-900">{paymentResult?.lawyerName || lawyer?.name}</p>
                            <p className="text-sm text-gray-500">{lawyer?.specialty?.[0] || 'Legal Consultation'}</p>
                        </div>
                    </div>

                    {/* Real booking details */}
                    {paymentResult?.booking && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Booking Confirmation</p>
                            <p className="text-sm font-semibold text-gray-800">#{paymentResult.booking.bookingNumber}</p>
                        </div>
                    )}
                    {paymentResult?.payment && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Transaction ID</p>
                            <p className="text-sm font-mono text-gray-800">{paymentResult.payment.transactionId}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {(paymentResult?.booking?.scheduledDate || booking.date)
                                ? new Date(paymentResult?.booking?.scheduledDate || booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                                : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {paymentResult?.booking?.scheduledTime || booking.time || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            {booking.type === 'video' || booking.meetingType === 'VIDEO'
                                ? <><Video className="w-4 h-4 text-blue-500" /> Video Call</>
                                : <><MapPin className="w-4 h-4 text-blue-500" /> In-Person</>}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            ₹{Number(paymentResult?.payment?.amount || booking.amount || 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        to="/user/appointments"
                        className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                        View My Appointments
                    </Link>
                    <Link
                        to="/"
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Checkout Page ─────────────────────────────────────────────────────

export default function CheckoutPage() {
    const { id } = useParams(); // lawyer id
    const navigate = useNavigate();

    // Booking details passed via location.state from BookingPage
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [apiError, setApiError] = useState('');
    const [errors, setErrors] = useState({});

    // Read booking info from sessionStorage (set by BookingPage)
    const [booking] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem('pendingBooking') || '{}');
        } catch { return {}; }
    });

    const [form, setForm] = useState({
        name: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
    });

    // Fetch lawyer details
    useEffect(() => {
        (async () => {
            try {
                const { data } = await lawyerAPI.getById(id);
                setLawyer(data);
            } catch (err) {
                console.error('Error fetching lawyer:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── Validation ──────────────────────────────────────────────────────────

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Cardholder name is required';
        const digits = form.cardNumber.replace(/\s/g, '');
        if (digits.length < 16) e.cardNumber = 'Enter a valid 16-digit card number';

        // Expiry Validation
        if (!form.expiry || form.expiry.length < 5) {
            e.expiry = 'Enter valid expiry (MM/YY)';
        } else {
            const [month, year] = form.expiry.split('/');
            const monthNum = parseInt(month, 10);
            if (!monthNum || monthNum < 1 || monthNum > 12) {
                e.expiry = 'Invalid month (01-12)';
            }
        }

        // CVC Validation
        if (!form.cvc || form.cvc.length !== 3) {
            e.cvc = 'CVC must be 3 digits';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // ── Submit (real API call) ───────────────────────────────────────────────

    async function handlePay(e) {
        e.preventDefault();
        if (!validate()) return;

        setProcessing(true);
        setApiError('');

        try {
            const response = await paymentAPI.checkout({
                lawyerId: id,
                scheduledDate: booking.date,
                scheduledTime: booking.time,
                duration: booking.duration || 60,
                meetingType: booking.type?.toUpperCase() || booking.meetingType || 'VIDEO',
                amount: parseFloat(amount),
                clientNotes: booking.notes || '',
                paymentMethod: 'CARD',
            });

            sessionStorage.removeItem('pendingBooking');
            setPaymentResult(response.data);
            setSuccess(true);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Payment failed. Please try again.';
            setApiError(msg);
            console.error('Checkout error:', err);
        } finally {
            setProcessing(false);
        }
    }

    // ── Derived values ──────────────────────────────────────────────────────

    const amount = booking.amount || lawyer?.consultationFee || lawyer?.hourlyRate || 0;
    const maskedCard = form.cardNumber || '**** **** **** ****';
    const displayName = form.name || 'YOUR NAME';
    const displayExpiry = form.expiry || 'MM/YY';

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    // ── Success state ───────────────────────────────────────────────────────

    if (success) {
        return <PaymentSuccess lawyer={lawyer} booking={{ ...booking, amount }} paymentResult={paymentResult} />;
    }

    // ── Main render ─────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8 md:py-12">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
                {/* Header */}
                <header className="flex items-center justify-between mb-10 pb-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-200">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Nyay Booker</h1>
                            <p className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase">Secure Payment</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Booking
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* ── LEFT: Payment Form ─────────────────────────────────── */}
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Details</h2>
                            <p className="text-gray-500">Complete your booking by providing payment information.</p>
                        </div>

                        {/* Interactive Card Preview */}
                        <div className="relative w-full max-w-md h-52 rounded-2xl p-7 text-white overflow-hidden
              bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
              shadow-2xl shadow-blue-600/20">
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10" />
                            <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full border border-white/10" />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
                                    <span className="text-xs font-bold tracking-widest opacity-60">VISA</span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xl tracking-[0.2em] font-medium font-mono">
                                        {maskedCard}
                                    </p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider opacity-50">Card Holder</p>
                                            <p className="text-sm font-semibold tracking-wide uppercase">{displayName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase tracking-wider opacity-50">Expires</p>
                                            <p className="text-sm font-semibold tracking-wide">{displayExpiry}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handlePay} className="space-y-5">
                            {/* API Error Banner */}
                            {apiError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                                    <span>{apiError}</span>
                                </div>
                            )}

                            {/* Cardholder Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Cardholder Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Full name as displayed on card"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white outline-none transition-all
                      ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-4`}
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            {/* Card Number */}
                            <div>
                                <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Card Number
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="cardNumber"
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={form.cardNumber}
                                        onChange={e => setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })}
                                        maxLength={19}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white outline-none transition-all
                      ${errors.cardNumber ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-4`}
                                    />
                                </div>
                                {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
                            </div>

                            {/* Expiry + CVC */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="expiry" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Expiry Date
                                    </label>
                                    <input
                                        id="expiry"
                                        type="text"
                                        placeholder="MM/YY"
                                        value={form.expiry}
                                        onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                                        maxLength={5}
                                        className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
                      ${errors.expiry ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-4`}
                                    />
                                    {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                                </div>
                                <div>
                                    <label htmlFor="cvc" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        CVC
                                    </label>
                                    <input
                                        id="cvc"
                                        type="password"
                                        placeholder="•••"
                                        value={form.cvc}
                                        onChange={e => setForm({ ...form, cvc: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                                        maxLength={3}
                                        className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
                      ${errors.cvc ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-4`}
                                    />
                                    {errors.cvc && <p className="text-xs text-red-500 mt-1">{errors.cvc}</p>}
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl
                  shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-lg"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Pay ₹{Number(amount).toLocaleString('en-IN')}
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-xs font-medium">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> PCI-DSS COMPLIANT</span>
                            <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> 256-BIT ENCRYPTION</span>
                            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> FRAUD PROTECTION</span>
                        </div>
                    </div>

                    {/* ── RIGHT: Booking Summary ────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Booking Summary</h3>

                            {/* Lawyer info */}
                            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                                <img
                                    src={lawyer?.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(lawyer?.name || 'L')}
                                    alt={lawyer?.name}
                                    className="w-14 h-14 rounded-xl object-cover"
                                />
                                <div>
                                    <h4 className="font-semibold text-gray-900">{lawyer?.name}</h4>
                                    <p className="text-sm text-gray-500">{lawyer?.specialty?.[0] || 'Legal Consultation'}</p>
                                </div>
                            </div>

                            {/* Booking items */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <Video className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {booking.type === 'video' || booking.meetingType === 'VIDEO' ? 'Video Consultation' : 'In-Person Consultation'} (60 min)
                                        </p>
                                        <p className="text-xs text-gray-400">Legal Advice Session</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">₹{Number(amount).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Booking details */}
                            {booking.date && (
                                <div className="space-y-2 mb-6 pb-5 border-b border-gray-100 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    {booking.time && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            {booking.time}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price breakdown */}
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{Number(amount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Platform Fee</span>
                                    <span className="text-green-500 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>GST (Estimated)</span>
                                    <span>₹0.00</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                                        <p className="text-2xl font-bold text-blue-600">₹{Number(amount).toLocaleString('en-IN')}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 pb-1">Currency: INR</p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-5 text-center text-xs text-gray-400 px-4">
                            By clicking "Pay", you agree to Nyay Booker's{' '}
                            <a href="#" className="underline hover:text-blue-500">Terms of Service</a> and{' '}
                            <a href="#" className="underline hover:text-blue-500">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
