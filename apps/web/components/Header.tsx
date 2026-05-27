'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const nav = [
  ['Beranda', '#beranda'], ['Tentang', '#tentang'], ['Layanan', '#layanan'],
  ['Portofolio', '#portofolio'], ['Legalitas', '#legalitas'], ['Kontak', '#kontak']
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'border-b border-slate-200/50 bg-navy/90 backdrop-blur-md shadow-lg shadow-navy/5' 
        : 'border-b border-white/10 bg-navy/95'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold font-black text-navy transition-transform duration-300 hover:scale-105">
            J
          </div>
          <div>
            <p className="font-extrabold text-white tracking-wide">PT Jurti Agung Mulia</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Electrical Contractor</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
          {nav.map(([label, href]) => (
            <a 
              key={label} 
              href={href} 
              className="relative py-1 transition-colors duration-300 hover:text-gold after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link 
            href="/login" 
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
          >
            Login
          </Link>
          <a 
            href="#penawaran" 
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-md shadow-orange-500/10 transition-all duration-300 hover:bg-orange-400 hover:shadow-lg active:scale-95"
          >
            Minta Penawaran
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="rounded-xl border border-white/10 p-2 text-white hover:bg-white/5 md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-x-0 top-[73px] z-40 border-b border-slate-800 bg-navy px-4 py-6 transition-all duration-300 ease-in-out md:hidden ${
        isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible h-0 pointer-events-none'
      }`}>
        <nav className="flex flex-col gap-4">
          {nav.map(([label, href]) => (
            <a 
              key={label} 
              href={href} 
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-semibold text-slate-200 transition-colors hover:bg-white/5 hover:text-gold"
            >
              {label}
            </a>
          ))}
          <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-white/20 py-3 text-center text-sm font-semibold text-white hover:bg-white/5"
            >
              Login Internal
            </Link>
            <a 
              href="#penawaran" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-gold py-3 text-center text-sm font-bold text-navy"
            >
              Minta Penawaran
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
