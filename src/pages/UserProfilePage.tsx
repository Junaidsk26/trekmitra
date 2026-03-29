import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Calendar, MapPin, 
  Camera, Save, Loader2, ChevronRight,
  Clock, CheckCircle2, XCircle, Mountain, AlertTriangle, X, ShieldCheck,
  CreditCard, Receipt
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { formatCurrency, cn } from '../utils';
import { format } from 'date-fns';
import { Booking, Payment } from '../types';

export default function UserProfilePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments'>('bookings');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      // Bookings Listener
      const bookingsRef = collection(db, 'bookings');
      const bQuery = query(
        bookingsRef, 
        where('userId', '==', user.uid),
        orderBy('bookingDate', 'desc')
      );
      
      const unsubscribeBookings = onSnapshot(bQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        setBookings(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      });

      // Payments Listener
      const paymentsRef = collection(db, 'payments');
      const pQuery = query(
        paymentsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribePayments = onSnapshot(pQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Payment[];
        setPayments(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'payments');
      });

      return () => {
        unsubscribeBookings();
        unsubscribePayments();
      };
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      // Update Firebase Auth Profile
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // Update Firestore User Doc
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName,
        photoURL,
        updatedAt: new Date()
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;

    setIsCancelling(true);
    try {
      const bookingRef = doc(db, 'bookings', cancellingBooking.id);
      await updateDoc(bookingRef, {
        status: 'Cancelled',
        updatedAt: new Date()
      });
      setCancellingBooking(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${cancellingBooking.id}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-nature-500/20 to-transparent" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-nature-950 overflow-hidden bg-nature-900 flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-nature-500" />
                  )}
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 p-2 bg-nature-500 text-white rounded-full shadow-lg hover:bg-nature-400 transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-display font-bold mb-1">{user.displayName || 'Trekker'}</h2>
              <p className="text-nature-400 text-sm flex items-center gap-2 mb-6">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>

              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="text-center">
                  <p className="text-xs text-nature-400 uppercase tracking-widest mb-1">Treks</p>
                  <p className="text-xl font-bold">{bookings.filter(b => b.status === 'Confirmed').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-nature-400 uppercase tracking-widest mb-1">Member Since</p>
                  <p className="text-xl font-bold">2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[2.5rem] border border-nature-500/20"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-nature-400" />
                Edit Profile
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs text-nature-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-nature-950/50 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-xs text-nature-400 uppercase tracking-widest mb-1 block">Photo URL</label>
                  <input 
                    type="url" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full bg-nature-950/50 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-colors"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-nature-500 hover:bg-nature-400 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Booking & Payment History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-3xl font-display font-bold">Activity <span className="text-gradient">History</span></h2>
            <div className="flex items-center gap-2 bg-nature-900 p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveTab('bookings')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'bookings' ? "bg-nature-500 text-white shadow-lg" : "text-nature-400 hover:text-white"
                )}
              >
                <Mountain className="w-4 h-4" />
                Bookings
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'payments' ? "bg-nature-500 text-white shadow-lg" : "text-nature-400 hover:text-white"
                )}
              >
                <Receipt className="w-4 h-4" />
                Payments
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-10 h-10 text-nature-500 animate-spin" />
            </div>
          ) : activeTab === 'bookings' ? (
            bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={booking.id}
                    className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-nature-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                          <Mountain className="w-8 h-8 text-nature-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{booking.trekName}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-nature-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {booking.trekDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {booking.trekkersCount} Trekkers
                            </span>
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {booking.preferredGuides && booking.preferredGuides.length > 0 
                                ? `Guides: ${booking.preferredGuides.map(g => g.name).join(', ')}` 
                                : `${booking.guidePreference || 'No Preference'} Guide`}
                            </span>
                            <span className="font-bold text-nature-100">
                              {formatCurrency(booking.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-1">Status</p>
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            booking.status === 'Confirmed' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            booking.status === 'Cancelled' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                            "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>
                            {booking.status === 'Confirmed' && <CheckCircle2 className="w-3 h-3" />}
                            {booking.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                            {booking.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {booking.status}
                          </div>
                        </div>
                        
                        {booking.status === 'Pending' && (
                          <button 
                            onClick={() => setCancellingBooking(booking)}
                            className="p-2 bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all"
                            title="Cancel Booking"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        
                        <ChevronRight className="w-5 h-5 text-nature-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass p-12 rounded-[2.5rem] border border-white/5 text-center">
                <div className="w-20 h-20 bg-nature-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Mountain className="w-10 h-10 text-nature-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Bookings Yet</h3>
                <p className="text-nature-400 mb-8 max-w-sm mx-auto">
                  You haven't booked any treks yet. Start your adventure today!
                </p>
                <a 
                  href="/treks" 
                  className="inline-flex items-center gap-2 bg-nature-500 hover:bg-nature-400 text-white px-8 py-3 rounded-full font-bold transition-all"
                >
                  Explore Treks
                </a>
              </div>
            )
          ) : (
            payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={payment.id}
                    className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-nature-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                          <CreditCard className="w-8 h-8 text-nature-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">Payment for {payment.trekName}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-nature-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {payment.createdAt?.toDate ? format(payment.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {payment.paymentMethod.type === 'card' ? `Card ending in ${payment.paymentMethod.last4}` : 'Saved Method'}
                            </span>
                            <span className="font-bold text-nature-100">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-1">Status</p>
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            payment.status === 'succeeded' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            payment.status === 'failed' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                            "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>
                            {payment.status === 'succeeded' && <CheckCircle2 className="w-3 h-3" />}
                            {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                            {payment.status}
                          </div>
                        </div>
                        
                        <Receipt className="w-5 h-5 text-nature-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass p-12 rounded-[2.5rem] border border-white/5 text-center">
                <div className="w-20 h-20 bg-nature-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <CreditCard className="w-10 h-10 text-nature-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Payments Yet</h3>
                <p className="text-nature-400 mb-8 max-w-sm mx-auto">
                  You haven't made any payments yet. Book a trek to see your history here.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancellingBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-nature-950/80 backdrop-blur-md"
              onClick={() => setCancellingBooking(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[2.5rem] border border-rose-500/30 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border border-rose-500/30">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                
                <h3 className="text-2xl font-display font-bold mb-2">Cancel <span className="text-rose-500">Booking?</span></h3>
                <p className="text-nature-300 mb-8">
                  Are you sure you want to cancel your booking for <span className="text-white font-bold">{cancellingBooking.trekName}</span>? This action cannot be undone.
                </p>

                <div className="flex w-full gap-3">
                  <button 
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Cancel'}
                  </button>
                  <button 
                    onClick={() => setCancellingBooking(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-nature-300 py-4 rounded-2xl font-bold transition-all"
                  >
                    No, Keep it
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setCancellingBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-nature-400" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
