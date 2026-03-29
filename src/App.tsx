import React, { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import HomePage from './pages/HomePage';
import TrekDetailsPage from './pages/TrekDetailsPage';
import LoginPage from './pages/LoginPage';
import WishlistPage from './pages/WishlistPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserProfilePage from './pages/UserProfilePage';
import ReviewsPage from './pages/ReviewsPage';
import GuidesPage from './pages/GuidesPage';

// Context for Auth
interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check/Create user profile in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const role = firebaseUser.email === 'js9897449@gmail.com' ? 'admin' : 'user';
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Trekker',
            photoURL: firebaseUser.photoURL || null,
            role: role,
            createdAt: serverTimestamp(),
          });
          setIsAdmin(firebaseUser.email === 'js9897449@gmail.com');
        } else {
          setIsAdmin(firebaseUser.email === 'js9897449@gmail.com');
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      <div className="min-h-screen bg-nature-950 text-nature-50">
        <Navbar />
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/trek/:id" element={<TrekDetailsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/guides" element={user ? <GuidesPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/wishlist" element={user ? <WishlistPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <UserProfilePage /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/" />} />
          </Routes>
        </AnimatePresence>

        <Chatbot />

        <footer className="bg-nature-900 border-t border-white/5 py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-display font-bold mb-4">Trekk<span className="text-nature-400">Mitra</span></h3>
              <p className="text-nature-300 max-w-sm">
                India's most trusted trekking community. We help you find your path and conquer the peaks with safety and style.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-nature-400 text-sm">
                <li><Link to="/" className="hover:text-nature-300">Home</Link></li>
                <li><Link to="/reviews" className="hover:text-nature-300">Reviews</Link></li>
                <li><Link to="/about" className="hover:text-nature-300">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-nature-400 text-sm">
                <li>support@trekkmitra.com</li>
                <li>+91 98765 43210</li>
                <li>Mumbai, Maharashtra</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs text-nature-500">
            © 2026 TrekkMitra. All rights reserved. Made with ❤️ for the mountains.
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}
