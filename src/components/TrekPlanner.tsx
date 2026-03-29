import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mountain, User, ArrowRight, Check, RefreshCw, Users, ShieldCheck, Users2, Loader2, CheckCircle2, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { TREKS } from '../constants';
import { Difficulty, Trek, Guide } from '../types';
import TrekCard from './TrekCard';
import { cn, formatCurrency } from '../utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';

interface TrekPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrek?: Trek | null;
}

type Step = 'difficulty' | 'count' | 'groupGender' | 'guideSelection' | 'results' | 'pickGuide' | 'success';

export default function TrekPlanner({ isOpen, onClose, initialTrek }: TrekPlannerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(initialTrek ? 'count' : 'difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initialTrek?.difficulty || '');
  const [trekkerCount, setTrekkerCount] = useState<number>(2);
  const [groupGender, setGroupGender] = useState<'Male' | 'Female' | 'Both' | ''>('');
  const [guideConfig, setGuideConfig] = useState<'Standard' | 'Special' | ''>('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookedTrek, setBookedTrek] = useState<Trek | null>(initialTrek || null);
  const [selectedTrek, setSelectedTrek] = useState<Trek | null>(initialTrek || null);
  const [availableGuides, setAvailableGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStep(initialTrek ? 'count' : 'difficulty');
      setDifficulty(initialTrek?.difficulty || '');
      setTrekkerCount(2);
      setGroupGender('');
      setGuideConfig('');
      setBookedTrek(initialTrek || null);
      setSelectedTrek(initialTrek || null);
      setSelectedGuide(null);
    }
  }, [isOpen, initialTrek]);

  const fetchAvailableGuides = async () => {
    setIsLoadingGuides(true);
    try {
      const q = query(collection(db, 'guides'), where('status', '==', 'Free'));
      const querySnapshot = await getDocs(q);
      const guides: Guide[] = [];
      querySnapshot.forEach((doc) => {
        guides.push({ id: doc.id, ...doc.data() } as Guide);
      });
      setAvailableGuides(guides);
    } catch (error) {
      console.error("Error fetching guides:", error);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const filteredTreks = initialTrek ? [initialTrek] : TREKS.filter(t => t.difficulty === difficulty);

  const reset = () => {
    setStep(initialTrek ? 'count' : 'difficulty');
    setDifficulty(initialTrek?.difficulty || '');
    setTrekkerCount(2);
    setGroupGender('');
    setGuideConfig('');
    setBookedTrek(initialTrek || null);
    setSelectedTrek(initialTrek || null);
    setSelectedGuide(null);
  };

  const handleGroupGenderSelect = (gender: 'Male' | 'Female' | 'Both') => {
    setGroupGender(gender);
    if (gender === 'Female') {
      setStep('guideSelection');
    } else {
      setStep('results');
    }
  };

  const handleTrekSelect = (trek: Trek) => {
    setSelectedTrek(trek);
    fetchAvailableGuides();
    setStep('pickGuide');
  };

  const handleBookTrek = async () => {
    if (!user || !selectedTrek) {
      onClose();
      navigate('/login');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        userId: user.uid,
        trekId: selectedTrek.id,
        trekName: selectedTrek.name,
        trekDate: '2026-04-15', // Defaulting to a future date for simulation
        bookingDate: serverTimestamp(),
        status: 'Pending',
        amount: selectedTrek.price * trekkerCount,
        trekkersCount: trekkerCount,
        guidePreference: guideConfig || 'Standard',
        groupGender: groupGender,
        preferredGuideId: selectedGuide?.id || null,
        preferredGuideName: selectedGuide?.name || null
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      setBookedTrek(selectedTrek);
      setStep('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-nature-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl glass-dark rounded-[2.5rem] border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">Plan Your <span className="text-nature-400">Trek</span></h2>
              <p className="text-sm text-nature-400">Find the perfect adventure for you</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-nature-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 'difficulty' && (
                <motion.div
                  key="difficulty"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-nature-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nature-400">
                      <Mountain className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold">What's your preferred difficulty?</h3>
                    <p className="text-nature-400 mt-2">Choose a level that matches your fitness and experience.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['Easy', 'Moderate', 'Hard'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setDifficulty(level);
                          setStep('count');
                        }}
                        className={cn(
                          "p-6 rounded-2xl border transition-all text-left group",
                          difficulty === level 
                            ? "bg-nature-500 border-nature-400 text-white" 
                            : "bg-white/5 border-white/10 hover:border-nature-500/50 text-nature-100"
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            level === 'Easy' ? "bg-emerald-500/20 text-emerald-400" :
                            level === 'Moderate' ? "bg-amber-500/20 text-amber-400" :
                            "bg-rose-500/20 text-rose-400"
                          )}>
                            {level}
                          </span>
                          {difficulty === level && <Check className="w-5 h-5" />}
                        </div>
                        <h4 className="text-lg font-bold mb-1">{level}</h4>
                        <p className="text-xs text-nature-400 group-hover:text-nature-300 transition-colors">
                          {level === 'Easy' ? 'Perfect for beginners and families.' :
                           level === 'Moderate' ? 'Requires good stamina and some experience.' :
                           'Challenging trails for experienced trekkers.'}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'count' && (
                <motion.div
                  key="count"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-nature-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nature-400">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold">How many trekkers?</h3>
                    <p className="text-nature-400 mt-2">Enter the number of people in your group (Minimum 2).</p>
                  </div>

                  <div className="max-w-xs mx-auto space-y-6">
                    <div className="flex items-center justify-center gap-6">
                      <button 
                        onClick={() => setTrekkerCount(Math.max(2, trekkerCount - 1))}
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-2xl"
                      >
                        -
                      </button>
                      <span className="text-5xl font-display font-bold w-20 text-center">{trekkerCount}</span>
                      <button 
                        onClick={() => setTrekkerCount(trekkerCount + 1)}
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-2xl"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => setStep('groupGender')}
                      className="w-full bg-nature-500 hover:bg-nature-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      Next Step
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                      <button 
                        onClick={() => setStep('difficulty')}
                        className="text-nature-400 hover:text-white text-sm font-medium transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'groupGender' && (
                <motion.div
                  key="groupGender"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-nature-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nature-400">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Group Gender</h3>
                    <p className="text-nature-400 mt-2">Who is joining the trek?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {[
                      { id: 'Male', label: 'All Male', icon: <User className="w-6 h-6" /> },
                      { id: 'Female', label: 'All Female', icon: <User className="w-6 h-6" /> },
                      { id: 'Both', label: 'Mixed Group', icon: <Users2 className="w-6 h-6" /> },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleGroupGenderSelect(g.id as any)}
                        className={cn(
                          "p-8 rounded-2xl border transition-all text-center group flex flex-col items-center gap-4",
                          groupGender === g.id 
                            ? "bg-nature-500 border-nature-400 text-white" 
                            : "bg-white/5 border-white/10 hover:border-nature-500/50 text-nature-100"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          groupGender === g.id ? "bg-white/20" : "bg-nature-500/10"
                        )}>
                          {g.icon}
                        </div>
                        <span className="text-xl font-bold">{g.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <button 
                      onClick={() => setStep('count')}
                      className="text-nature-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'guideSelection' && (
                <motion.div
                  key="guideSelection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-nature-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nature-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Guide Preference</h3>
                    <p className="text-nature-400 mt-2">Since your group is all female, would you like a special guide configuration?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {[
                      { id: 'Standard', label: 'Standard Guide', desc: '1 Professional Guide' },
                      { id: 'Special', label: 'Special Security', desc: '2 Male Guides + 1 Female Guide' },
                    ].map((config) => (
                      <button
                        key={config.id}
                        onClick={() => {
                          setGuideConfig(config.id as any);
                          setStep('results');
                        }}
                        className={cn(
                          "p-8 rounded-2xl border transition-all text-left group flex flex-col gap-2",
                          guideConfig === config.id 
                            ? "bg-nature-500 border-nature-400 text-white" 
                            : "bg-white/5 border-white/10 hover:border-nature-500/50 text-nature-100"
                        )}
                      >
                        <h4 className="text-xl font-bold">{config.label}</h4>
                        <p className={cn(
                          "text-sm",
                          guideConfig === config.id ? "text-white/80" : "text-nature-400"
                        )}>
                          {config.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <button 
                      onClick={() => setStep('groupGender')}
                      className="text-nature-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Recommended Treks</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-nature-300">
                          {difficulty} Difficulty
                        </span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-nature-300">
                          {trekkerCount} Trekkers
                        </span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-nature-300">
                          {groupGender === 'Both' ? 'Mixed Group' : `All ${groupGender}`}
                        </span>
                        {guideConfig === 'Special' && (
                          <span className="px-3 py-1 bg-nature-500/20 border border-nature-500/30 rounded-full text-xs text-nature-400">
                            2M + 1F Guides
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={reset}
                      className="flex items-center gap-2 text-nature-400 hover:text-nature-300 text-sm font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Start Over
                    </button>
                  </div>

                  {filteredTreks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredTreks.map((trek, i) => (
                        <motion.div
                          key={trek.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="glass p-6 rounded-3xl border border-white/5 hover:border-nature-500/30 transition-all group relative overflow-hidden"
                        >
                          <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                            <img 
                              src={trek.image} 
                              alt={trek.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-bold">{trek.name}</h4>
                              <span className="text-nature-400 font-bold">{formatCurrency(trek.price)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-nature-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {trek.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                4.8
                              </span>
                            </div>
                            <button
                              onClick={() => handleTrekSelect(trek)}
                              className="w-full bg-nature-500 hover:bg-nature-400 text-white font-bold py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all"
                            >
                              Book Directly
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 glass rounded-3xl border border-white/5">
                      <Mountain className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-nature-400">No treks found matching your criteria. Try another difficulty!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'pickGuide' && (
                <motion.div
                  key="pickGuide"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-nature-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nature-400">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Choose Your Guide</h3>
                    <p className="text-nature-400 mt-2">Select a preferred guide for your trek or skip to let us assign one.</p>
                  </div>

                  {isLoadingGuides ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-nature-500" />
                      <p className="text-nature-400">Finding available guides...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                      {availableGuides.map((guide) => (
                        <button
                          key={guide.id}
                          onClick={() => setSelectedGuide(guide)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all text-left flex items-center gap-4 group",
                            selectedGuide?.id === guide.id 
                              ? "bg-nature-500 border-nature-400 text-white" 
                              : "bg-white/5 border-white/10 hover:border-nature-500/50 text-nature-100"
                          )}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img 
                              src={guide.photoURL} 
                              alt={guide.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold truncate">{guide.name}</h4>
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {guide.rating}
                              </div>
                            </div>
                            <p className={cn(
                              "text-xs truncate",
                              selectedGuide?.id === guide.id ? "text-white/80" : "text-nature-400"
                            )}>
                              {guide.experience} years exp • {guide.gender}
                            </p>
                          </div>
                          {selectedGuide?.id === guide.id && <Check className="w-5 h-5" />}
                        </button>
                      ))}
                      
                      {availableGuides.length === 0 && (
                        <div className="col-span-full text-center py-8 glass rounded-2xl border border-white/5">
                          <p className="text-nature-400">No guides available at the moment. We'll assign one for you!</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="max-w-xs mx-auto space-y-4">
                    <button
                      onClick={handleBookTrek}
                      disabled={isBooking}
                      className="w-full bg-nature-500 hover:bg-nature-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedGuide ? 'Confirm with Guide' : 'Confirm Booking')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                      <button 
                        onClick={() => setStep('results')}
                        className="text-nature-400 hover:text-white text-sm font-medium transition-colors"
                      >
                        Back to Treks
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold">Booking Successful!</h3>
                    <p className="text-nature-400 mt-2">
                      Your trek to <span className="text-white font-bold">{bookedTrek?.name}</span> has been booked for <span className="text-white font-bold">{trekkerCount}</span> trekkers.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/profile');
                      }}
                      className="bg-nature-500 hover:bg-nature-400 text-white px-8 py-4 rounded-2xl font-bold transition-all"
                    >
                      View in My Profile
                    </button>
                    <button
                      onClick={reset}
                      className="bg-white/5 hover:bg-white/10 text-nature-300 px-8 py-4 rounded-2xl font-bold transition-all"
                    >
                      Plan Another Trek
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 bg-nature-900/50 border-t border-white/5 flex justify-center">
            <div className="flex gap-2">
              {(['difficulty', 'count', 'groupGender', 'results', 'pickGuide'] as Step[]).map((s, i) => (
                <div 
                  key={s}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    step === s ? "w-8 bg-nature-500" : "w-2 bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
