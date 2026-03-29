import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import TrekPlanner from './TrekPlanner';

export default function Hero() {
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <TrekPlanner isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} />
      
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-nature-950/60 via-nature-950/40 to-nature-950" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full glass text-nature-300 text-sm font-semibold tracking-wider uppercase">
            Adventure Awaits
          </span>
          <h1 className="text-5xl md:text-8xl font-display font-bold mb-6 leading-[0.9] tracking-tighter">
            Explore the <span className="text-gradient">Sahyadris.</span><br />
            Trek with Mitra.
          </h1>
          <p className="text-lg md:text-xl text-nature-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Discover the ancient forts, misty peaks, and lush valleys of Maharashtra. 
            Join the most vibrant trekking community in the Sahyadris.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/reviews"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-nature-500 hover:bg-nature-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-nature-500/20"
            >
              Read Reviews
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setIsPlannerOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 glass hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              Plan My Trek
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats/Quick Info */}
      <div className="absolute bottom-12 left-0 right-0 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div className="flex gap-12">
            <div>
              <p className="text-3xl font-display font-bold">50+</p>
              <p className="text-sm text-nature-400 uppercase tracking-widest">Active Treks</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">10k+</p>
              <p className="text-sm text-nature-400 uppercase tracking-widest">Happy Trekkers</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">4.9/5</p>
              <p className="text-sm text-nature-400 uppercase tracking-widest">User Rating</p>
            </div>
          </div>
          <div className="text-right max-w-xs">
            <p className="text-sm italic text-nature-300">
              "The best way to find yourself is to get lost in the mountains."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
