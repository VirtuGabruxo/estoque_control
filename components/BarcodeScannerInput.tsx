'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ScanBarcode, CornerDownLeft, Sparkles } from 'lucide-react';

interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function BarcodeScannerInput({
  onScan,
  placeholder = 'Bipar código com leitor ou digitar...',
  autoFocus = true,
}: BarcodeScannerInputProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    onScan(trimmed);
    setCode('');
    // Re-focus immediately for continuous physical scanner operation
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-brand-500 pointer-events-none flex items-center">
          <ScanBarcode className="w-5 h-5 animate-pulse" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-24 rounded-2xl bg-card border border-[var(--card-border)] text-foreground text-sm font-mono placeholder:text-foreground/40 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!code.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500 text-white font-medium text-xs hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 transition-all shadow-sm"
          >
            <span>Bipar</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-foreground/50 flex items-center gap-1 pl-1">
        <Sparkles className="w-3 h-3 text-brand-500" />
        Pronto para leitor físico de código de barras (tecla Enter automática).
      </p>
    </form>
  );
}
