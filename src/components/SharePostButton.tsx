import React, { useEffect, useState } from 'react';
import { Copy, Facebook, Linkedin, Share2, Check, MessageCircle, X } from 'lucide-react';

interface SharePostButtonProps {
  title: string;
  url: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export const buildShareLinks = (title: string, url: string) => {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
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
  const shareLinks = buildShareLinks(title, url);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
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

  const shareOptions = [
    {
      href: shareLinks.whatsapp,
      label: 'WhatsApp',
      icon: MessageCircle,
      className: 'bg-green-50 text-green-700 hover:bg-green-100',
    },
    {
      href: shareLinks.facebook,
      label: 'Facebook',
      icon: Facebook,
      className: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    },
    {
      href: shareLinks.x,
      label: 'X',
      icon: X,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      href: shareLinks.linkedin,
      label: 'LinkedIn',
      icon: Linkedin,
      className: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonBaseClass}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Compartir publicación"
      >
        <Share2 size={variant === 'full' ? 18 : 16} />
        <span>Compartir</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Compartir publicación"
            className={`w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ${className}`.trim()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                  Compartir publicación
                </p>
                <h3 className="mt-2 text-xl font-black text-brand-blue">Elige dónde compartir</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-brand-blue"
                aria-label="Cerrar modal de compartir"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <a
                    key={option.label}
                    href={option.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${option.className}`}
                  >
                    <Icon size={18} />
                    <span>{option.label}</span>
                  </a>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-blue hover:text-brand-blue"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Link copiado' : 'Copiar link'}</span>
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              El enlace se abrirá en una nueva pestaña.
            </p>
          </div>
        </div>
      )}
    </>
  );
}