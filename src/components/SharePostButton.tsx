import React, { useEffect, useRef, useState } from 'react';
import { Copy, Facebook, Linkedin, Share2, Check, MessageCircle, X } from 'lucide-react';

interface SharePostButtonProps {
  title: string;
  url: string;
  variant?: 'compact' | 'full';
  className?: string;
}

const buildShareLinks = (title: string, url: string) => {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
};

export default function SharePostButton({
  title,
  url,
  variant = 'compact',
  className = '',
}: SharePostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shareLinks = buildShareLinks(title, url);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setIsOpen(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying share URL:', error);
    }
  };

  const buttonBaseClass = variant === 'full'
    ? 'inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-brand-red'
    : 'inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-blue/5';

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonBaseClass}
        aria-expanded={isOpen}
        aria-label="Compartir publicación"
      >
        <Share2 size={variant === 'full' ? 18 : 16} />
        <span>Compartir</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-3 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
            Compartir en redes
          </p>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Facebook size={16} />
              <span>Facebook</span>
            </a>
            <a
              href={shareLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              <X size={16} />
              <span>X</span>
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              <Linkedin size={16} />
              <span>LinkedIn</span>
            </a>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link copiado' : 'Copiar link'}</span>
          </button>
        </div>
      )}
    </div>
  );
}