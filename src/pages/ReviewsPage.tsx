import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Star, MessageSquare, Send, Trash2, User as UserIcon, Mountain } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../App';
import { TREKS } from '../constants';
import { cn } from '../utils';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  trekId: string;
  trekName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ReviewsPage() {
  const { user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    trekId: '',
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReview.trekId || !newReview.comment) return;

    setIsSubmitting(true);
    const selectedTrek = TREKS.find(t => t.id === newReview.trekId);

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Trekker',
        userPhoto: user.photoURL || null,
        trekId: newReview.trekId,
        trekName: selectedTrek?.name || 'Unknown Trek',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });
      setNewReview({ trekId: '', rating: 5, comment: '' });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold mb-4"
          >
            Trekker <span className="text-nature-400">Reviews</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-nature-300 text-lg"
          >
            Share your experiences and help others find their next adventure.
          </motion.p>
        </header>

        {user ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark p-8 rounded-3xl border border-white/10 mb-16"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="text-nature-400 w-5 h-5" />
              Share Your Opinion
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-nature-300 mb-2">Select Trek</label>
                  <select
                    required
                    value={newReview.trekId}
                    onChange={(e) => setNewReview({ ...newReview, trekId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-nature-100 focus:outline-none focus:ring-2 focus:ring-nature-500 transition-all"
                  >
                    <option value="" className="bg-nature-900">Choose a trek...</option>
                    {TREKS.map(trek => (
                      <option key={trek.id} value={trek.id} className="bg-nature-900">
                        {trek.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nature-300 mb-2">Rating</label>
                  <div className="flex items-center gap-2 h-[50px]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={cn(
                            "w-8 h-8 transition-colors",
                            star <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-nature-300 mb-2">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Tell us about the trail, the views, and any tips for fellow trekkers..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-nature-100 focus:outline-none focus:ring-2 focus:ring-nature-500 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-nature-500 hover:bg-nature-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Post Review
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="text-center p-12 glass-dark rounded-3xl border border-white/10 mb-16">
            <p className="text-nature-300 mb-6">Log in to share your trekking experience!</p>
            <button className="bg-nature-500 hover:bg-nature-400 text-white px-8 py-3 rounded-full font-bold transition-all">
              Login to Review
            </button>
          </div>
        )}

        <div className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            Recent Reviews
            <span className="text-sm font-normal text-nature-400 bg-white/5 px-3 py-1 rounded-full">
              {reviews.length}
            </span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-nature-500/30 border-t-nature-500 rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 glass-dark rounded-3xl border border-white/5">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-nature-400">No reviews yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-dark p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-nature-800 flex items-center justify-center overflow-hidden border border-white/10">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-nature-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-nature-100">{review.userName}</h3>
                          <div className="flex items-center gap-2 text-xs text-nature-400 mt-1">
                            <Mountain className="w-3 h-3" />
                            <span className="text-nature-300 font-medium">{review.trekName}</span>
                            <span>•</span>
                            <span>{review.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "w-3 h-3",
                                  i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {(isAdmin || (user && user.uid === review.userId)) && (
                        <button 
                          onClick={() => handleDelete(review.id)}
                          className="p-2 text-rose-400/50 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-4 text-nature-300 leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
