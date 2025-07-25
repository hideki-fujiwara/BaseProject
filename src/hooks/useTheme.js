import { useState, useEffect } from 'react';

export function useTheme({ defaultTheme = 'blue', defaultDarkMode = true } = {}) {
  const [theme, setTheme] = useState(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState(defaultDarkMode);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || defaultTheme;
    const savedDarkMode = localStorage.getItem('isDarkMode') === 'true';

    setTheme(savedTheme);
    setIsDarkMode(savedDarkMode);

    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, [defaultTheme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('isDarkMode', String(isDarkMode));

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [theme, isDarkMode]);

  return { theme, isDarkMode, setTheme, setIsDarkMode };
}
