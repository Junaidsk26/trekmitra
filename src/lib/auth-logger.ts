import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';

export const logAuthEvent = async (user: FirebaseUser, event: 'sign-in' | 'sign-out' | 'sign-up') => {
  try {
    await addDoc(collection(db, 'authLogs'), {
      userId: user.uid,
      email: user.email,
      event: event,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
};
