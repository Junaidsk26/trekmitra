import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Compass, User, Heart, LogIn, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../App';
import { logout } from '../firebase';
import { logAuthEvent } from '../lib/auth-logger';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    if (user) {
      await logAuthEvent(user, 'sign-out');
    }
    await logout();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Guides', path: '/guides' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        scrolled ? 'glass-dark py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-nature-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Compass className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tighter">
            Trekk<span className="text-nature-400">Mitra</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'text-sm font-medium hover:text-nature-400 transition-colors',
                location.pathname === link.path ? 'text-nature-400' : 'text-nature-100'
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-[1px] bg-white/10" />
          <Link to="/wishlist" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Heart className="w-5 h-5 text-nature-100" />
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="p-2 hover:bg-white/5 rounded-full transition-colors text-nature-400 hover:text-nature-300" title="Admin Dashboard">
              <Shield className="w-5 h-5" />
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-nature-400" />
                )}
                <span className="text-sm font-medium">{user.displayName?.split(' ')[0]}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-nature-400 hover:text-rose-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-nature-500 hover:bg-nature-400 text-white px-5 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Join Now
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-nature-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 glass-dark border-t border-white/5 p-6 md:hidden flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-nature-100"
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-nature-400 flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-nature-500 text-white p-3 rounded-xl text-center font-bold"
            >
              Join TrekkMitra
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
