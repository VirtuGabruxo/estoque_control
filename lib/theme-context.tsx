'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'escuro' | 'claro';
export type PrimaryColor = 'azul' | 'esmeralda' | 'roxo' | 'indigo' | 'rosa' | 'ambar';

interface ThemeContextType {
  mode: ThemeMode;
  primaryColor: PrimaryColor;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  toggleMode: () => void;
}

const colorPalettes: Record<PrimaryColor, {
  name: string;
  hex: string;
  darkBorder: string;
  lightBorder: string;
  brand: string;
  brandHover: string;
  brandLight: string;
  glow: string;
}> = {
  azul: {
    name: 'Azul Oceano (Padrão)',
    hex: '#3B82F6',
    darkBorder: '#1E3A8A',
    lightBorder: '#BFDBFE',
    brand: '#3B82F6',
    brandHover: '#2563EB',
    brandLight: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.35)',
  },
  esmeralda: {
    name: 'Verde Esmeralda',
    hex: '#10B981',
    darkBorder: '#064E3B',
    lightBorder: '#A7F3D0',
    brand: '#10B981',
    brandHover: '#059669',
    brandLight: '#34D399',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  roxo: {
    name: 'Roxo Real',
    hex: '#A855F7',
    darkBorder: '#581C87',
    lightBorder: '#DDD6FE',
    brand: '#A855F7',
    brandHover: '#9333EA',
    brandLight: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  indigo: {
    name: 'Índigo Profundo',
    hex: '#6366F1',
    darkBorder: '#312E81',
    lightBorder: '#C7D2FE',
    brand: '#6366F1',
    brandHover: '#4F46E5',
    brandLight: '#818CF8',
    glow: 'rgba(99, 102, 241, 0.35)',
  },
  rosa: {
    name: 'Rosa Rubi',
    hex: '#F43F5E',
    darkBorder: '#881337',
    lightBorder: '#FECDD3',
    brand: '#F43F5E',
    brandHover: '#E11D48',
    brandLight: '#FB7185',
    glow: 'rgba(244, 63, 94, 0.35)',
  },
  ambar: {
    name: 'Âmbar Dourado',
    hex: '#F59E0B',
    darkBorder: '#78350F',
    lightBorder: '#FDE68A',
    brand: '#F59E0B',
    brandHover: '#D97706',
    brandLight: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'escuro',
  primaryColor: 'azul',
  setMode: () => {},
  setPrimaryColor: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('escuro');
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>('azul');

  // Load from database / local storage on mount
  useEffect(() => {
    // 1. Check local storage first
    const savedMode = localStorage.getItem('app_theme_mode') as ThemeMode;
    const savedColor = localStorage.getItem('app_primary_color') as PrimaryColor;
    if (savedMode) setModeState(savedMode);
    if (savedColor && colorPalettes[savedColor]) setPrimaryColorState(savedColor);

    // 2. Fetch server configuration
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((data) => {
        if (data.tema) {
          setModeState(data.tema);
          localStorage.setItem('app_theme_mode', data.tema);
        }
        if (data.cor_primaria && colorPalettes[data.cor_primaria as PrimaryColor]) {
          setPrimaryColorState(data.cor_primaria as PrimaryColor);
          localStorage.setItem('app_primary_color', data.cor_primaria);
        }
      })
      .catch(() => {});
  }, []);

  // Apply CSS variables whenever mode or color changes
  useEffect(() => {
    const root = document.documentElement;
    const palette = colorPalettes[primaryColor] || colorPalettes.azul;

    if (mode === 'escuro') {
      root.classList.add('dark');
      root.style.setProperty('--background', '#0B1120');
      root.style.setProperty('--foreground', '#F8FAFC');
      root.style.setProperty('--card-bg', '#111827');
      root.style.setProperty('--card-border', palette.darkBorder);
      root.style.setProperty('--card-glow', palette.glow);
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--background', '#F8FAFC');
      root.style.setProperty('--foreground', '#0F172A');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--card-border', palette.lightBorder);
      root.style.setProperty('--card-glow', 'rgba(0, 0, 0, 0.05)');
    }

    // Set brand color variables
    root.style.setProperty('--brand-500', palette.brand);
    root.style.setProperty('--brand-600', palette.brandHover);
    root.style.setProperty('--brand-400', palette.brandLight);
    root.style.setProperty('--brand-glow', palette.glow);
  }, [mode, primaryColor]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('app_theme_mode', newMode);
  };

  const setPrimaryColor = (newColor: PrimaryColor) => {
    setPrimaryColorState(newColor);
    localStorage.setItem('app_primary_color', newColor);
  };

  const toggleMode = () => {
    setMode(mode === 'escuro' ? 'claro' : 'escuro');
  };

  return (
    <ThemeContext.Provider value={{ mode, primaryColor, setMode, setPrimaryColor, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { colorPalettes };
