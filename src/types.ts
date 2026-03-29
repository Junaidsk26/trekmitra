export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type Location = 'Maharashtra' | 'Himachal' | 'Uttarakhand' | 'Ladakh';

export interface Trek {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  duration: string;
  difficulty: Difficulty;
  location: Location;
  image: string;
  gallery: string[];
  maxAltitude: string;
  bestTime: string;
  highlights: string[];
  itinerary: { day: number; title: string; description: string }[];
  fitnessLevel: string;
  packingList: string[];
  weather: {
    temp: string;
    condition: string;
  };
  coordinates: [number, number];
  route?: [number, number][];
  waypoints?: {
    name: string;
    coordinates: [number, number];
    description?: string;
    type: 'base' | 'peak' | 'camp' | 'water' | 'view';
  }[];
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  wishlist: string[]; // Trek IDs
}

export interface Booking {
  id: string;
  userId: string;
  trekId: string;
  trekName: string;
  bookingDate: any; // Firestore Timestamp
  trekDate: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  amount: number;
  trekkersCount: number;
  guidePreference: 'Male' | 'Female' | 'No Preference';
  preferredGuides?: { id: string; name: string }[];
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
}

export interface Guide {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  photoURL: string;
  bio: string;
  experience: number;
  rating?: number;
  reviewCount?: number;
  status: 'Free' | 'Busy';
}

export interface GuideReview {
  id: string;
  guideId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
}

export interface Payment {
  id?: string;
  userId: string;
  bookingId: string;
  trekName: string;
  amount: number;
  currency: string;
  paymentMethod: {
    type: 'card' | 'saved';
    last4: string;
  };
  status: 'succeeded' | 'failed' | 'pending';
  transactionId?: string;
  createdAt: any;
}

export interface AuthLog {
  id?: string;
  userId: string;
  email: string;
  event: 'sign-in' | 'sign-out' | 'sign-up';
  timestamp: any;
  userAgent?: string;
  ipAddress?: string;
}

export interface PaymentMethod {
  id?: string;
  userId: string;
  type: 'Credit Card' | 'Debit Card' | 'UPI' | 'Wallet';
  provider: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault?: boolean;
  createdAt: any;
}
