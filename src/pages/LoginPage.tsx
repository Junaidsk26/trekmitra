import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Github, Chrome, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { logAuthEvent } from '../lib/auth-logger';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        await logAuthEvent(user, 'sign-in');
      }
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await logAuthEvent(userCredential.user, 'sign-in');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Auth Profile
        await updateProfile(user, {
          displayName: fullName
        });

        // Create/Update Firestore Document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const role = user.email === 'js9897449@gmail.com' ? 'admin' : 'user';
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: fullName,
            photoURL: null,
            role: role,
            createdAt: serverTimestamp(),
          });
        } else {
          await setDoc(userDocRef, {
            displayName: fullName,
          }, { merge: true });
        }
        await logAuthEvent(user, 'sign-in');
      }
      navigate('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-8 md:p-12 rounded-[2.5rem] border border-white/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-nature-400 text-sm">
            {isLogin ? 'Ready for your next adventure?' : 'Join the TrekkMitra community today.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-nature-900 py-3 rounded-xl font-bold hover:bg-nature-50 transition-colors disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            {loading && !email ? 'Connecting...' : 'Continue with Google'}
          </button>
          <button className="w-full flex items-center justify-center gap-3 bg-nature-900 text-white py-3 rounded-xl font-bold border border-white/5 hover:bg-nature-800 transition-colors">
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-nature-950 px-4 text-nature-500">Or continue with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-nature-400 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-nature-500"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-nature-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nature-500" />
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-nature-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-nature-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nature-500" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-nature-500"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && email ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-nature-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-nature-300 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
