import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, ShieldCheck, X, Loader2, 
  CheckCircle2, ChevronRight, Plus, Trash2,
  Smartphone, Wallet
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { formatCurrency, cn } from '../utils';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  trekName: string;
  onPaymentSuccess: (paymentDetails: any) => void;
  bookingId: string;
}

export default function PaymentModal({ isOpen, onClose, amount, trekName, onPaymentSuccess, bookingId }: PaymentModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'add' | 'processing'>('select');
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveMethod, setSaveMethod] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
      const methodsRef = collection(db, 'users', user.uid, 'paymentMethods');
      const unsubscribe = onSnapshot(methodsRef, (snapshot) => {
        const methods = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PaymentMethod[];
        setSavedMethods(methods);
        if (methods.length > 0 && !selectedMethodId) {
          const defaultMethod = methods.find(m => m.isDefault) || methods[0];
          setSelectedMethodId(defaultMethod.id!);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/paymentMethods`);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, isOpen]);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const newMethod = {
        userId: user.uid,
        type: 'Credit Card',
        provider: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        lastFour: cardNumber.slice(-4),
        expiryDate: expiry,
        isDefault: savedMethods.length === 0,
        createdAt: serverTimestamp(),
      };

      if (saveMethod) {
        await addDoc(collection(db, 'users', user.uid, 'paymentMethods'), newMethod);
      }
      
      setStep('select');
      // Reset form
      setCardName('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/paymentMethods`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    
    setStep('processing');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const selectedMethod = savedMethods.find(m => m.id === selectedMethodId);
      const paymentData = {
        userId: user.uid,
        bookingId: bookingId,
        trekName: trekName,
        amount: amount,
        currency: 'INR',
        paymentMethod: {
          type: selectedMethod ? 'saved' : 'card',
          last4: selectedMethod ? selectedMethod.lastFour : cardNumber.slice(-4)
        },
        status: 'succeeded',
        transactionId: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: serverTimestamp(),
      };

      const paymentDoc = await addDoc(collection(db, 'payments'), paymentData);
      onPaymentSuccess({ ...paymentData, id: paymentDoc.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
      setStep('select');
    }
  };

  const deleteMethod = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'paymentMethods', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/paymentMethods`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-nature-950/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">
            {step === 'select' ? 'Payment Method' : step === 'add' ? 'Add New Card' : 'Processing...'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-nature-400" />
          </button>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {savedMethods.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id!)}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                    selectedMethodId === method.id 
                      ? "bg-nature-500/10 border-nature-500 shadow-lg shadow-nature-500/10" 
                      : "bg-nature-900/50 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedMethodId === method.id ? "bg-nature-500 text-white" : "bg-nature-800 text-nature-400"
                  )}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{method.provider} •••• {method.lastFour}</p>
                    <p className="text-xs text-nature-400">Expires {method.expiryDate}</p>
                  </div>
                  <button 
                    onClick={(e) => deleteMethod(method.id!, e)}
                    className="p-2 text-nature-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {selectedMethodId === method.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-nature-500" />
                    </div>
                  )}
                </div>
              ))}

              <button 
                onClick={() => setStep('add')}
                className="w-full p-4 rounded-2xl border border-dashed border-white/10 hover:border-nature-500/50 hover:bg-nature-500/5 transition-all flex items-center justify-center gap-2 text-nature-400 hover:text-nature-300"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-bold">Add New Payment Method</span>
              </button>
            </div>

            <div className="bg-nature-900/50 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-nature-400">Amount to Pay</span>
                <span className="text-xl font-bold">{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-nature-500 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                256-bit SSL Secure Encryption
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={!selectedMethodId || loading}
              className="w-full bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Pay Now
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'add' && (
          <form onSubmit={handleAddMethod} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">Cardholder Name</label>
              <input 
                type="text" 
                placeholder="JOHN DOE"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-nature-500 uppercase text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nature-500" />
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  required
                  className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-nature-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                  required
                  className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-nature-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">CVV</label>
                <input 
                  type="password" 
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  required
                  className="w-full bg-nature-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-nature-500 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group py-2">
              <div className={cn(
                "w-5 h-5 rounded border transition-all flex items-center justify-center",
                saveMethod ? "bg-nature-500 border-nature-500" : "border-white/20 group-hover:border-white/40"
              )}>
                {saveMethod && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={saveMethod}
                onChange={() => setSaveMethod(!saveMethod)}
              />
              <span className="text-sm text-nature-300">Save this card for future payments</span>
            </label>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 bg-white/5 hover:bg-white/10 text-nature-300 py-4 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-nature-500 hover:bg-nature-400 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Card'}
              </button>
            </div>
          </form>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-nature-500/20 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-t-nature-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-nature-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Securing Transaction</h3>
            <p className="text-nature-400 text-sm max-w-[200px]">Please do not refresh or close this window.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
