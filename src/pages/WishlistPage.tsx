import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { TREKS } from '../constants';
import TrekCard from '../components/TrekCard';

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
      const unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.data().trekId);
        setWishlistItems(ids);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/wishlist`);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const savedTreks = TREKS.filter(trek => wishlistItems.includes(trek.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-nature-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">My <span className="text-gradient">Wishlist</span></h1>
          <p className="text-nature-400">Your saved adventures waiting to be conquered.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-nature-900 px-4 py-2 rounded-full border border-white/5">
          <Heart className="w-4 h-4 text-rose-500 fill-current" />
          <span className="text-sm font-bold">{savedTreks.length} Saved</span>
        </div>
      </div>

      {savedTreks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {savedTreks.map((trek, i) => (
              <TrekCard key={trek.id} trek={trek} index={i} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 glass rounded-[3rem]"
        >
          <div className="w-20 h-20 bg-nature-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Compass className="w-10 h-10 text-nature-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-nature-400 mb-8 max-w-md mx-auto">
            Explore our curated treks and save your favorites to plan your next journey.
          </p>
          <Link 
            to="/treks" 
            className="inline-flex items-center gap-2 bg-nature-500 hover:bg-nature-400 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105"
          >
            Explore Treks
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
