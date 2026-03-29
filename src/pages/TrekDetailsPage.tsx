import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Clock, MapPin, Mountain, Thermometer, 
  CheckCircle2, AlertCircle, Calendar, 
  ArrowLeft, Heart, Share2, ShieldCheck, Loader2, X
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { TREKS } from '../constants';
import { formatCurrency, cn } from '../utils';
import { Guide } from '../types';
import TrekMap from '../components/TrekMap';
import ShareButton from '../components/ShareButton';
import PaymentModal from '../components/PaymentModal';
import { AnimatePresence } from 'motion/react';

export default function TrekDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const trek = TREKS.find(t => t.id === id);
  
  const [bookingDate, setBookingDate] = useState('');
  const [trekkersCount, setTrekkersCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [guidePreference, setGuidePreference] = useState<'Male' | 'Female' | 'No Preference'>('No Preference');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tempBookingId, setTempBookingId] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuides, setSelectedGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'guides'), where('status', '==', 'Free'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guidesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guide[];
      setGuides(guidesData);
      setLoadingGuides(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guides');
      setLoadingGuides(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && trek) {
      const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
      const q = query(wishlistRef, where('trekId', '==', trek.id));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setIsWishlisted(true);
          setWishlistDocId(snapshot.docs[0].id);
        } else {
          setIsWishlisted(false);
          setWishlistDocId(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/wishlist`);
      });

      return () => unsubscribe();
    }
  }, [user, trek]);

  if (!trek) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Trek Not Found</h1>
        <Link to="/treks" className="text-nature-400 hover:underline">Back to Explore</Link>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookingDate) {
      alert('Please select a trek date.');
      return;
    }

    setIsBooking(true);
    try {
      // Create a pending booking first to get an ID
      const bookingData = {
        userId: user.uid,
        trekId: trek.id,
        trekName: trek.name,
        trekDate: bookingDate,
        bookingDate: serverTimestamp(),
        status: 'Pending',
        amount: trek.price * trekkersCount,
        trekkersCount: trekkersCount,
        guidePreference: guidePreference,
        preferredGuides: selectedGuides.map(g => ({ id: g.id, name: g.name })),
      };

      const bookingDoc = await addDoc(collection(db, 'bookings'), bookingData);
      setTempBookingId(bookingDoc.id);
      setConfirmedBooking({ ...bookingData, id: bookingDoc.id });
      setIsPaymentModalOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsBooking(false);
    }
  };

  const onPaymentSuccess = async (paymentDetails: any) => {
    if (!tempBookingId || !confirmedBooking) return;

    try {
      // Update booking status to Confirmed
      await updateDoc(doc(db, 'bookings', tempBookingId), {
        status: 'Confirmed'
      });

      setConfirmedBooking({ ...confirmedBooking, status: 'Confirmed' });
      setIsPaymentModalOpen(false);
      setShowConfirmation(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${tempBookingId}`);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
      if (isWishlisted && wishlistDocId) {
        await deleteDoc(doc(wishlistRef, wishlistDocId));
      } else {
        await addDoc(wishlistRef, {
          userId: user.uid,
          trekId: trek.id,
          addedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/wishlist`);
    }
  };

  return (
    <div className="pt-20 pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] md:h-[70vh] w-full group">
        <img 
          src={trek.image} 
          alt={trek.name} 
          className="w-full h-full object-cover cursor-pointer"
          referrerPolicy="no-referrer"
          onClick={() => setSelectedImage(trek.image)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nature-950 via-nature-950/20 to-transparent" />
        
        <button 
          onClick={() => setSelectedImage(trek.image)}
          className="absolute top-24 right-6 bg-nature-950/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Original
        </button>
        
        <div className="absolute bottom-12 left-0 right-0">
          <div className="max-w-7xl mx-auto px-6">
            <Link to="/treks" className="inline-flex items-center gap-2 text-nature-300 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-nature-500 text-white text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                  {trek.location} • {trek.difficulty}
                </span>
                <h1 className="text-4xl md:text-6xl font-display font-bold">{trek.name}</h1>
                <p className="text-xl text-nature-200 mt-2 font-light">{trek.tagline}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={toggleWishlist}
                  className={`p-4 rounded-full glass transition-colors ${isWishlisted ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'hover:bg-white/10'}`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <ShareButton 
                  title={trek.name}
                  text={trek.tagline}
                  url={window.location.href}
                  iconOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Clock className="w-5 h-5" />, label: 'Duration', value: trek.duration },
              { icon: <Mountain className="w-5 h-5" />, label: 'Max Altitude', value: trek.maxAltitude },
              { icon: <Calendar className="w-5 h-5" />, label: 'Best Time', value: trek.bestTime },
              { icon: <Thermometer className="w-5 h-5" />, label: 'Weather', value: trek.weather.temp },
            ].map((stat, i) => (
              <div key={i} className="glass p-4 rounded-2xl">
                <div className="text-nature-400 mb-1">{stat.icon}</div>
                <p className="text-xs text-nature-400 uppercase tracking-wider">{stat.label}</p>
                <p className="font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <section>
            <h2 className="text-2xl font-bold mb-4">About the Trek</h2>
            <p className="text-nature-300 leading-relaxed">{trek.description}</p>
          </section>

          {/* Highlights */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Trek Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trek.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3 bg-nature-900/50 p-4 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-nature-400" />
                  <span className="text-nature-200">{h}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Itinerary */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Itinerary</h2>
            <div className="space-y-6">
              {trek.itinerary.map((item, i) => (
                <div key={i} className="relative pl-8 border-l border-nature-800 pb-6 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-nature-500" />
                  <h3 className="font-bold text-lg mb-1">Day {item.day}: {item.title}</h3>
                  <p className="text-nature-300 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Location Map */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Trek Map & Route</h2>
            <TrekMap 
              center={trek.coordinates} 
              name={trek.name} 
              route={trek.route}
              waypoints={trek.waypoints}
            />
          </section>

          {/* Gallery */}
          {trek.gallery && trek.gallery.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trek.gallery.map((img, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 cursor-pointer group"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img 
                      src={img} 
                      alt={`${trek.name} gallery ${i}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-nature-950/60 px-3 py-1 rounded-full">View Original</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 glass p-8 rounded-3xl border border-nature-500/20">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm text-nature-400">Starting from</p>
                <p className="text-4xl font-display font-bold">{formatCurrency(trek.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-nature-400">Per Person</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-nature-950/50 rounded-xl border border-white/5">
                <p className="text-xs text-nature-400 uppercase tracking-widest mb-1">Select Date</p>
                <input 
                  type="date" 
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="bg-transparent w-full text-white focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-nature-400 uppercase tracking-widest mb-2">Number of Trekkers</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTrekkersCount(n)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-bold transition-all border",
                        trekkersCount === n 
                          ? "bg-nature-500 border-nature-500 text-white shadow-lg shadow-nature-500/20" 
                          : "bg-nature-950/50 border-white/5 text-nature-400 hover:border-white/20"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-nature-400 uppercase tracking-widest mb-2">Guide Preference</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'No Preference', label: 'No Preference' },
                    { id: 'Male', label: 'Male Guide' },
                    { id: 'Female', label: 'Female Guide' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGuidePreference(opt.id as any)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-bold transition-all border flex items-center justify-between",
                        guidePreference === opt.id 
                          ? "bg-nature-500 border-nature-500 text-white shadow-lg shadow-nature-500/20" 
                          : "bg-nature-950/50 border-white/5 text-nature-400 hover:border-white/20"
                      )}
                    >
                      {opt.label}
                      {guidePreference === opt.id && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple Guide Selection */}
              <div className="space-y-2">
                <p className="text-xs text-nature-400 uppercase tracking-widest mb-2">Choose Specific Guides (Optional)</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingGuides ? (
                    <div className="flex items-center gap-2 text-nature-400 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Loading guides...</span>
                    </div>
                  ) : guides.length === 0 ? (
                    <p className="text-xs text-nature-500 italic">No specific guides available right now.</p>
                  ) : (
                    guides.map((guide) => {
                      const isSelected = selectedGuides.some(g => g.id === guide.id);
                      return (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGuides(selectedGuides.filter(g => g.id !== guide.id));
                            } else {
                              setSelectedGuides([...selectedGuides, guide]);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-xl border transition-all",
                            isSelected 
                              ? "bg-nature-500/20 border-nature-500/50 text-white" 
                              : "bg-nature-950/50 border-white/5 text-nature-400 hover:border-white/20"
                          )}
                        >
                          <img 
                            src={guide.photoURL} 
                            alt={guide.name} 
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold">{guide.name}</p>
                            <p className="text-[10px] text-nature-500">{guide.experience}y exp • {guide.rating?.toFixed(1) || 'New'}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-nature-500" />}
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedGuides.length > 0 && (
                  <p className="text-[10px] text-nature-400 mt-1">
                    {selectedGuides.length} guide{selectedGuides.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={handleBooking}
              disabled={isBooking}
              className="w-full bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] mb-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking...
                </>
              ) : 'Book Now'}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-nature-400">
              <ShieldCheck className="w-4 h-4" />
              Secure Payment • Free Cancellation
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-nature-400" />
                Fitness Requirement
              </h4>
              <p className="text-sm text-nature-300 leading-relaxed">
                {trek.fitnessLevel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && trek && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            amount={trek.price * trekkersCount}
            trekName={trek.name}
            bookingId={tempBookingId || ''}
            onPaymentSuccess={onPaymentSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmation && confirmedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-nature-950/80 backdrop-blur-md"
              onClick={() => setShowConfirmation(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass p-8 md:p-12 rounded-[3rem] border border-nature-500/30 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-nature-500" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-nature-500/20 rounded-full flex items-center justify-center mb-6 border border-nature-500/30">
                  <CheckCircle2 className="w-10 h-10 text-nature-500" />
                </div>
                
                <h2 className="text-3xl font-display font-bold mb-2">Booking <span className="text-nature-400">Confirmed!</span></h2>
                <p className="text-nature-300 mb-8">Your adventure to {confirmedBooking.trekName} is secured. Get ready for an unforgettable journey!</p>
                
                <div className="w-full bg-nature-900/50 rounded-3xl p-6 mb-8 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-nature-400">Trek Date</span>
                    <span className="font-bold">{confirmedBooking.trekDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-nature-400">Trekkers</span>
                    <span className="font-bold">{confirmedBooking.trekkersCount} Person{confirmedBooking.trekkersCount > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-nature-400">Guide Preference</span>
                    <span className="font-bold">{confirmedBooking.guidePreference}</span>
                  </div>
                  {confirmedBooking.preferredGuides && confirmedBooking.preferredGuides.length > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-nature-400">Selected Guides</span>
                      <div className="text-right">
                        {confirmedBooking.preferredGuides.map((g: any) => (
                          <p key={g.id} className="font-bold">{g.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="h-[1px] bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-nature-400">Total Amount</span>
                    <span className="text-xl font-bold text-nature-50">{formatCurrency(confirmedBooking.amount)}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View My Bookings
                  </button>
                  <button 
                    onClick={() => setShowConfirmation(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-nature-300 py-4 rounded-2xl font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirmation(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-nature-400" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full"
            >
              <img 
                src={selectedImage} 
                alt="Original" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-nature-400 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="absolute -bottom-12 left-0 right-0 text-center">
                <a 
                  href={selectedImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-nature-400 hover:text-white text-sm font-bold underline"
                >
                  Open Original Image in New Tab
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
