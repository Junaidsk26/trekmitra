import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Star, ArrowUpRight, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Trek } from '../types';
import { formatCurrency } from '../utils';
import ShareButton from './ShareButton';

interface TrekCardProps {
  trek: Trek;
  index: number;
  onBook?: (trek: Trek) => void;
}

export default function TrekCard({ trek, index, onBook }: TrekCardProps) {
  const difficultyColor = {
    Easy: 'bg-emerald-500/20 text-emerald-400',
    Moderate: 'bg-amber-500/20 text-amber-400',
    Hard: 'bg-rose-500/20 text-rose-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-nature-900 rounded-3xl overflow-hidden border border-white/5 hover:border-nature-500/30 transition-all flex flex-col"
    >
      <Link to={`/trek/${trek.id}`} className="block flex-1">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={trek.image}
            alt={trek.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nature-950 via-transparent to-transparent opacity-80" />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${difficultyColor[trek.difficulty]}`}>
              {trek.difficulty}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-1 text-nature-400 text-xs font-medium mb-1">
              <MapPin className="w-3 h-3" />
              {trek.location}
            </div>
            <h3 className="text-2xl font-display font-bold mb-2 group-hover:text-nature-300 transition-colors">
              {trek.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-nature-200">
                  <Clock className="w-4 h-4" />
                  {trek.duration}
                </div>
                <div className="flex items-center gap-1 text-sm text-nature-200">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  4.8
                </div>
              </div>
              <div className="text-xl font-display font-bold text-nature-50">
                {formatCurrency(trek.price)}
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="p-4 bg-nature-900/50 backdrop-blur-sm border-t border-white/5 flex gap-2">
        {onBook && (
          <button
            onClick={() => onBook(trek)}
            className="flex-1 bg-nature-500 hover:bg-nature-400 text-white font-bold py-2 rounded-xl text-sm transition-all"
          >
            Book Now
          </button>
        )}
        <Link 
          to={`/trek/${trek.id}`}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-nature-300 rounded-xl text-sm font-bold transition-all"
        >
          Details
        </Link>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShareButton 
          title={trek.name}
          text={trek.tagline}
          url={`${window.location.origin}/trek/${trek.id}`}
          className="p-2 rounded-full glass hover:bg-nature-500 hover:text-white transition-all shadow-lg"
          iconOnly
        />
        <Link 
          to={`/trek/${trek.id}`}
          className="p-2 rounded-full glass hover:bg-nature-500 hover:text-white transition-all shadow-lg"
        >
          <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>
    </motion.div>
  );
}
