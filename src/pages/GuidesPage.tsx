import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, User as UserIcon, Plus, X, Loader2, Award, ShieldCheck, Heart } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { Guide, GuideReview } from '../types';
import { cn } from '../utils';

export default function GuidesPage() {
  const { user, isAdmin } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'guides'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guidesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guide[];
      setGuides(guidesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guides');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredGuides = guides.filter(guide => 
    filter === 'All' || guide.gender === filter
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-nature-400 font-bold uppercase tracking-widest text-sm">Expert Team</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mt-2">Our Trek Guides</h1>
            <p className="text-nature-300 mt-4 max-w-2xl">
              Meet our certified professionals who ensure your safety and make every trek an unforgettable experience.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-nature-900/50 p-1 rounded-xl border border-white/5">
              {(['All', 'Male', 'Female'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filter === option 
                      ? "bg-nature-500 text-white shadow-lg" 
                      : "text-nature-400 hover:text-white"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const sampleGuides = [
                      {
                        name: 'Aman Singh',
                        gender: 'Male',
                        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
                        bio: 'Expert in Himalayan treks with over 8 years of experience. Specializes in high-altitude survival.',
                        experience: 8,
                        rating: 4.8,
                        reviewCount: 15,
                        status: 'Free'
                      },
                      {
                        name: 'Khushi Kapoor',
                        gender: 'Female',
                        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
                        bio: 'Passionate about nature and local culture. Leading treks for 5 years with a focus on sustainable tourism.',
                        experience: 5,
                        rating: 4.9,
                        reviewCount: 10,
                        status: 'Free'
                      },
                      {
                        name: 'Dev Sharma',
                        gender: 'Male',
                        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                        bio: 'Former army personnel with extensive knowledge of navigation and first aid. 12 years of experience.',
                        experience: 12,
                        rating: 4.7,
                        reviewCount: 20,
                        status: 'Free'
                      },
                      {
                        name: 'Rashmika Mandanna',
                        gender: 'Female',
                        photoURL: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400',
                        bio: 'Adventure enthusiast and certified mountaineer. Specializes in technical climbs and rock scrambling.',
                        experience: 7,
                        rating: 4.9,
                        reviewCount: 14,
                        status: 'Free'
                      }
                    ];
                    for (const guide of sampleGuides) {
                      await addDoc(collection(db, 'guides'), {
                        ...guide,
                        createdAt: serverTimestamp()
                      });
                    }
                  }}
                  className="flex items-center gap-2 bg-nature-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-nature-700 transition-all"
                >
                  Seed Samples
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-white text-nature-950 px-4 py-2 rounded-xl font-bold text-sm hover:bg-nature-200 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Guide
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-nature-500 animate-spin mb-4" />
            <p className="text-nature-400">Loading our experts...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-20 bg-nature-900/30 rounded-3xl border border-white/5">
            <UserIcon className="w-16 h-16 text-nature-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No guides found</h3>
            <p className="text-nature-400">Try changing your filter or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide, index) => (
              <GuideCard 
                key={guide.id} 
                guide={guide} 
                index={index} 
                onReview={() => setSelectedGuide(guide)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddGuideModal onClose={() => setIsAddModalOpen(false)} />
        )}
        {selectedGuide && (
          <GuideReviewModal 
            guide={selectedGuide} 
            onClose={() => setSelectedGuide(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideCard({ guide, index, onReview }: { guide: Guide; index: number; onReview: () => void }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group bg-nature-900/40 rounded-3xl border border-white/5 overflow-hidden hover:border-nature-500/30 transition-all hover:shadow-2xl hover:shadow-nature-500/5"
      >
        <div className="relative h-72 overflow-hidden">
          <img 
            src={guide.photoURL} 
            alt={guide.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nature-950 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
              guide.gender === 'Female' 
                ? "bg-pink-500/20 text-pink-300 border-pink-500/30" 
                : "bg-blue-500/20 text-blue-300 border-blue-500/30"
            )}>
              {guide.gender} Guide
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
              guide.status === 'Free' 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
            )}>
              {guide.status}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold text-white">{guide.name}</h3>
              <div className="flex items-center gap-1 text-nature-400 text-sm mt-1">
                <Award className="w-4 h-4 text-nature-500" />
                <span>{guide.experience}+ Years Experience</span>
              </div>
            </div>
            <div className="bg-nature-950/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold">{guide.rating?.toFixed(1) || 'New'}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-nature-300 text-sm leading-relaxed mb-6 line-clamp-3 italic">
            "{guide.bio}"
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-2 text-nature-400 text-[10px] uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Safety</span>
              </div>
              <p className="text-xs font-bold text-white">Certified Expert</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-2 text-nature-400 text-[10px] uppercase tracking-widest mb-1">
                <Heart className="w-3 h-3" />
                <span>Reviews</span>
              </div>
              <p className="text-xs font-bold text-white">{guide.reviewCount || 0} Feedback</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl font-bold transition-all text-sm"
            >
              View Profile
            </button>
            <button
              onClick={onReview}
              className="flex-1 bg-nature-500 hover:bg-nature-400 text-white py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Reviews
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isProfileOpen && (
          <GuideProfileModal guide={guide} onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function GuideProfileModal({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-nature-950/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-nature-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="h-80 md:h-auto relative">
            <img 
              src={guide.photoURL} 
              alt={guide.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-nature-900 md:bg-gradient-to-r md:from-transparent md:to-nature-900/80" />
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 p-2 bg-nature-950/50 backdrop-blur-md rounded-full hover:bg-nature-950 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                guide.status === 'Free' 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
              )}>
                {guide.status}
              </span>
              <span className="text-nature-400 text-xs font-bold uppercase tracking-widest">
                {guide.gender} Guide
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-bold mb-2">{guide.name}</h2>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{guide.rating?.toFixed(1) || 'New'}</span>
              </div>
              <div className="w-1 h-1 bg-nature-700 rounded-full" />
              <div className="text-nature-400 text-sm">{guide.reviewCount || 0} Reviews</div>
              <div className="w-1 h-1 bg-nature-700 rounded-full" />
              <div className="text-nature-400 text-sm">{guide.experience} Years Exp.</div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-nature-500 uppercase tracking-widest mb-3">About the Guide</h4>
                <p className="text-nature-200 leading-relaxed italic">
                  "{guide.bio}"
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-nature-500/20 rounded-xl flex items-center justify-center text-nature-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Safety Certified</p>
                    <p className="text-xs text-nature-400">Advanced first aid & rescue training</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-nature-500/20 rounded-xl flex items-center justify-center text-nature-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Local Expert</p>
                    <p className="text-xs text-nature-400">Deep knowledge of Sahyadri trails</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-nature-500/20"
            >
              Close Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddGuideModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female',
    photoURL: '',
    bio: '',
    experience: 1,
    status: 'Free' as 'Free' | 'Busy'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'guides'), {
        ...formData,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'guides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-nature-950/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-nature-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">Add New Guide</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all"
              placeholder="e.g. Rajesh Kumar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all"
              >
                <option value="Free">Free</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Experience (Years)</label>
              <input
                required
                type="number"
                min="1"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Photo URL</label>
            <input
              required
              type="url"
              value={formData.photoURL}
              onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
              className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest">Biography</label>
            <textarea
              required
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-nature-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all resize-none"
              placeholder="Tell us about the guide's expertise..."
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-white text-nature-950 py-4 rounded-2xl font-bold hover:bg-nature-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Adding...' : 'Create Guide Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function GuideReviewModal({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<GuideReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const q = query(
      collection(db, 'guideReviews'),
      where('guideId', '==', guide.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideReview[];
      
      // Sort by date manually since we might not have an index yet
      reviewsData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setReviews(reviewsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guideReviews');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [guide.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'guideReviews'), {
        guideId: guide.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });

      // Update guide's average rating and count
      const newCount = (guide.reviewCount || 0) + 1;
      const newRating = ((guide.rating || 0) * (guide.reviewCount || 0) + newReview.rating) / newCount;

      await updateDoc(doc(db, 'guides', guide.id), {
        rating: newRating,
        reviewCount: newCount
      });

      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'guideReviews');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-nature-950/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-nature-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-nature-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <img 
              src={guide.photoURL} 
              alt={guide.name} 
              className="w-12 h-12 rounded-full object-cover border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-xl font-display font-bold leading-tight">{guide.name}</h2>
              <p className="text-xs text-nature-400">Reviews & Feedback</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Review Form */}
          {user ? (
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 transition-all hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "w-6 h-6",
                          star <= newReview.rating ? "text-yellow-500 fill-yellow-500" : "text-nature-700"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={3}
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full bg-nature-950 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-nature-500 transition-all resize-none text-sm"
                  placeholder="Share your experience with this guide..."
                />
                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full bg-nature-500 text-white py-3 rounded-2xl font-bold hover:bg-nature-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-nature-950/50 rounded-3xl p-6 border border-dashed border-white/10 text-center">
              <p className="text-nature-400 text-sm">Please sign in to leave a review for {guide.name}.</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Recent Reviews</h3>
              <span className="text-xs text-nature-400">{reviews.length} Reviews</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-nature-500 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-nature-500 italic text-sm">
                No reviews yet. Be the first to review!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {review.userPhoto ? (
                          <img 
                            src={review.userPhoto} 
                            alt={review.userName} 
                            className="w-8 h-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-nature-800 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-nature-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{review.userName}</p>
                          <p className="text-[10px] text-nature-500">
                            {review.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-nature-800"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-nature-300 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
