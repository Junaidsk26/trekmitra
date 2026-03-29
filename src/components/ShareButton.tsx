import React, { useState } from 'react';
import { Share2, MessageCircle, Facebook, Instagram, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  iconOnly?: boolean;
}

export default function ShareButton({ title, text, url, className, iconOnly = false }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(`${title}\n${text}\n\nCheck it out here: `);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#25D366]',
      href: `https://wa.me/?text=${shareText}${shareUrl}`,
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      href: `https://www.instagram.com/`, // Instagram doesn't support direct web sharing, usually just copy link
      isCopy: true,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className={cn(
          "flex items-center justify-center gap-2 transition-all",
          iconOnly ? "p-4 rounded-full glass hover:bg-white/10" : className
        )}
        title="Share"
      >
        <Share2 className={cn("w-5 h-5", iconOnly ? "w-6 h-6" : "")} />
        {!iconOnly && <span>Share</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-dark p-8 rounded-[2.5rem] border border-white/10 z-[101] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold">Share <span className="text-nature-400">Trek</span></h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {shareOptions.map((option) => (
                  <a
                    key={option.name}
                    href={option.isCopy ? undefined : option.href}
                    onClick={option.isCopy ? handleCopy : undefined}
                    target={option.isCopy ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg",
                      option.color
                    )}>
                      {option.icon}
                    </div>
                    <span className="text-xs font-bold text-nature-400 group-hover:text-white transition-colors">
                      {option.name}
                    </span>
                  </a>
                ))}
              </div>

              <div className="relative">
                <p className="text-xs text-nature-400 uppercase tracking-widest mb-2 ml-1">Copy Link</p>
                <div className="flex items-center gap-2 bg-nature-950/50 border border-white/5 rounded-2xl p-2 pl-4">
                  <span className="text-sm text-nature-300 truncate flex-1">{url}</span>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs",
                      copied ? "bg-emerald-500 text-white" : "bg-nature-500 text-white hover:bg-nature-400"
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
