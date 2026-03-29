import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, Clock, Filter, 
  Search, Calendar, User, Mountain, 
  ArrowRight, ShieldCheck, Loader2, AlertCircle,
  Receipt, History, LogIn, LogOut
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { formatCurrency, cn } from '../utils';
import { format } from 'date-fns';
import { Booking, Payment, AuthLog } from '../types';

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments' | 'logs'>('bookings');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      // Bookings Listener
      const bookingsRef = collection(db, 'bookings');
      const bQuery = query(bookingsRef, orderBy('bookingDate', 'desc'));
      
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
      const pQuery = query(paymentsRef, orderBy('createdAt', 'desc'));

      const unsubscribePayments = onSnapshot(pQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Payment[];
        setPayments(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'payments');
      });

      // Auth Logs Listener
      const logsRef = collection(db, 'authLogs');
      const lQuery = query(logsRef, orderBy('timestamp', 'desc'));

      const unsubscribeLogs = onSnapshot(lQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AuthLog[];
        setAuthLogs(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'authLogs');
      });

      return () => {
        unsubscribeBookings();
        unsubscribePayments();
        unsubscribeLogs();
      };
    }
  }, [isAdmin]);

  const updateBookingStatus = async (id: string, newStatus: 'Confirmed' | 'Cancelled') => {
    setUpdatingId(id);
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchesSearch = b.trekName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-nature-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-4">Access Denied</h1>
        <p className="text-nature-400 max-w-md mb-8">
          You do not have administrative privileges to access this dashboard.
        </p>
        <Link to="/" className="bg-nature-500 text-white px-8 py-3 rounded-full font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Admin <span className="text-gradient">Dashboard</span></h1>
          <p className="text-nature-400">Manage all trek bookings and user requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-nature-900 px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-nature-500" />
            <span className="text-sm font-bold">Admin Access Verified</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: <Calendar className="text-blue-400" /> },
          { label: 'Pending', value: bookings.filter(b => b.status === 'Pending').length, icon: <Clock className="text-amber-400" /> },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'Confirmed').length, icon: <CheckCircle2 className="text-emerald-400" /> },
          { label: 'Revenue', value: formatCurrency(bookings.reduce((acc, b) => acc + (b.status === 'Confirmed' ? b.amount : 0), 0)), icon: <Mountain className="text-nature-400" /> },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/5 rounded-2xl">{stat.icon}</div>
            </div>
            <p className="text-sm text-nature-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-nature-900 p-1 rounded-2xl border border-white/5 mb-8 w-fit">
        {[
          { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
          { id: 'payments', label: 'Payments', icon: <Receipt className="w-4 h-4" /> },
          { id: 'logs', label: 'Auth Logs', icon: <History className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === tab.id ? "bg-nature-500 text-white shadow-lg" : "text-nature-400 hover:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (Only for Bookings) */}
      {activeTab === 'bookings' && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nature-500" />
            <input 
              type="text" 
              placeholder="Search by trek name or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-nature-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-nature-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 bg-nature-900 p-1 rounded-2xl border border-white/5">
            {['All', 'Pending', 'Confirmed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-bold transition-all",
                  filterStatus === status ? "bg-nature-500 text-white shadow-lg" : "text-nature-400 hover:text-white"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'bookings' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-nature-400 text-xs uppercase tracking-widest">
                  <th className="px-8 py-6 font-bold">Trek & Date</th>
                  <th className="px-8 py-6 font-bold">Booking Date</th>
                  <th className="px-8 py-6 font-bold">User ID</th>
                  <th className="px-8 py-6 font-bold">Trekkers</th>
                  <th className="px-8 py-6 font-bold">Guides</th>
                  <th className="px-8 py-6 font-bold">Total Amount</th>
                  <th className="px-8 py-6 font-bold">Status</th>
                  <th className="px-8 py-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredBookings.map((booking) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={booking.id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-nature-50">{booking.trekName}</span>
                          <span className="text-xs text-nature-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Trek: {booking.trekDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-nature-300">
                          {booking.bookingDate?.toDate ? format(booking.bookingDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-nature-800 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-nature-400" />
                          </div>
                          <span className="text-sm text-nature-300 font-mono" title={booking.userId}>
                            {booking.userId.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-nature-300">{booking.trekkersCount}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-nature-400 uppercase tracking-widest">{booking.guidePreference}</span>
                          {booking.preferredGuides && booking.preferredGuides.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {booking.preferredGuides.map((g: any) => (
                                <span key={g.id} className="text-xs font-bold text-nature-200 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-nature-500 italic">No specific guides</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-bold text-nature-50">{formatCurrency(booking.amount)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          booking.status === 'Confirmed' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                          booking.status === 'Cancelled' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {booking.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'Confirmed')}
                                disabled={updatingId === booking.id}
                                className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                                title="Confirm Booking"
                              >
                                {updatingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'Cancelled')}
                                disabled={updatingId === booking.id}
                                className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                title="Cancel Booking"
                              >
                                {updatingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                          <Link 
                            to={`/trek/${booking.trekId}`}
                            className="p-2 bg-white/5 text-nature-400 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                            title="View Trek"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-nature-400 text-xs uppercase tracking-widest">
                  <th className="px-8 py-6 font-bold">Payment ID</th>
                  <th className="px-8 py-6 font-bold">Date</th>
                  <th className="px-8 py-6 font-bold">User ID</th>
                  <th className="px-8 py-6 font-bold">Trek</th>
                  <th className="px-8 py-6 font-bold">Amount</th>
                  <th className="px-8 py-6 font-bold">Method</th>
                  <th className="px-8 py-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <span className="text-xs text-nature-400 font-mono">{payment.id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-nature-300">
                        {payment.createdAt?.toDate ? format(payment.createdAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-nature-300 font-mono">{payment.userId.slice(0, 8)}...</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-nature-300">{payment.trekName}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-nature-50">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-nature-400">
                        {payment.paymentMethod.type === 'card' ? `Card ${payment.paymentMethod.last4}` : 'Saved'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        payment.status === 'succeeded' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      )}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'logs' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-nature-400 text-xs uppercase tracking-widest">
                  <th className="px-8 py-6 font-bold">Timestamp</th>
                  <th className="px-8 py-6 font-bold">Event</th>
                  <th className="px-8 py-6 font-bold">User Email</th>
                  <th className="px-8 py-6 font-bold">User ID</th>
                  <th className="px-8 py-6 font-bold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {authLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <span className="text-sm text-nature-300">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM dd, HH:mm:ss') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                        log.event === 'sign-in' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        log.event === 'sign-up' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      )}>
                        {log.event === 'sign-in' && <LogIn className="w-3 h-3" />}
                        {log.event === 'sign-up' && <User className="w-3 h-3" />}
                        {log.event === 'sign-out' && <LogOut className="w-3 h-3" />}
                        {log.event}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-nature-300">{log.email}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-nature-400 font-mono">{log.userId.slice(0, 8)}...</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-nature-400">{log.ipAddress || 'Unknown'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {((activeTab === 'bookings' && filteredBookings.length === 0) || 
          (activeTab === 'payments' && payments.length === 0) || 
          (activeTab === 'logs' && authLogs.length === 0)) && (
          <div className="py-20 text-center">
            <p className="text-nature-400">No records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
