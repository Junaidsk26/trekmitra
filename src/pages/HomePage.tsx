import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Calendar, Map, Mountain } from 'lucide-react';
import Hero from '../components/Hero';
import TrekCard from '../components/TrekCard';
import DifficultyCalculator from '../components/DifficultyCalculator';
import TrekPlanner from '../components/TrekPlanner';
import { TREKS } from '../constants';
import { Difficulty, Location, Trek } from '../types';

export default function HomePage() {
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [selectedTrek, setSelectedTrek] = useState<Trek | null>(null);
  const [filter, setFilter] = useState<{
    difficulty: Difficulty | 'All';
  }>({
    difficulty: 'All',
  });

  const handleBookTrek = (trek: Trek) => {
    setSelectedTrek(trek);
    setIsPlannerOpen(true);
  };

  const closePlanner = () => {
    setIsPlannerOpen(false);
    setSelectedTrek(null);
  };

  const filteredTreks = TREKS.filter((trek) => {
    const diffMatch = filter.difficulty === 'All' || trek.difficulty === filter.difficulty;
    return diffMatch;
  });

  return (
    <div className="pb-20">
      <TrekPlanner 
        isOpen={isPlannerOpen} 
        onClose={closePlanner} 
        initialTrek={selectedTrek}
      />
      <Hero />

      {/* Featured Treks Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-nature-400 font-bold uppercase tracking-widest text-sm">Our Selection</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-2">Sahyadri Treks</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              className="bg-nature-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-nature-500"
              onChange={(e) => setFilter({ ...filter, difficulty: e.target.value as any })}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTreks.map((trek, i) => (
            <TrekCard 
              key={trek.id} 
              trek={trek} 
              index={i} 
              onBook={handleBookTrek}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-nature-900/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="text-4xl font-display font-bold mb-4">Why Choose TrekkMitra?</h2>
                <p className="text-nature-300 max-w-2xl">We don't just organize treks; we create life-changing experiences with a focus on safety, community, and sustainability.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: <Mountain className="w-6 h-6" />, title: 'Safety First', desc: 'Certified guides and high-quality equipment for every trek.' },
                  { icon: <Map className="w-6 h-6" />, title: 'Expert Guides', desc: 'Local experts who know the mountains like the back of their hand.' },
                  { icon: <Search className="w-6 h-6" />, title: 'Budget Friendly', desc: 'Premium experiences at prices that won\'t break the bank.' },
                  { icon: <Calendar className="w-6 h-6" />, title: 'Eco-Friendly', desc: 'We follow Leave No Trace principles to protect our trails.' },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl glass hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-nature-500/20 rounded-xl flex items-center justify-center mb-4 text-nature-400">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-nature-300 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <DifficultyCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Trek Preparation */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=1000" 
              alt="Trekker" 
              className="rounded-3xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-8 -right-8 glass p-8 rounded-3xl hidden md:block max-w-xs">
              <p className="text-nature-300 text-sm italic">"The mountains are calling, and I must go."</p>
              <p className="font-bold mt-2">— John Muir</p>
            </div>
          </div>
          <div>
            <span className="text-nature-400 font-bold uppercase tracking-widest text-sm">Get Ready</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-2 mb-8">Trek Preparation Guide</h2>
            
            <div className="space-y-8">
              {[
                { title: 'Fitness Training', desc: 'Start with cardio and leg strength exercises 4 weeks before your trek.' },
                { title: 'Packing Essentials', desc: 'Layering is key. Don\'t forget your headlamp and a good pair of boots.' },
                { title: 'Altitude Awareness', desc: 'Learn about AMS and how to stay hydrated at high altitudes.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-nature-800 flex items-center justify-center font-bold text-nature-400 border border-white/5">
                    0{i + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-nature-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative rounded-[3rem] overflow-hidden bg-nature-500 p-12 md:p-24 text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Start Your Journey Today</h2>
            <p className="text-nature-100 text-lg mb-10 max-w-xl mx-auto">Join thousands of trekkers exploring the wild. Your next adventure is just a click away.</p>
            <button 
              onClick={() => setIsPlannerOpen(true)}
              className="bg-white text-nature-900 px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
            >
              Plan My First Trek
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
