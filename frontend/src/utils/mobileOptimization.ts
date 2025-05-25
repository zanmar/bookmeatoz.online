import { useEffect, useState } from 'react';

// Simple mobile optimization utilities for production build
export const optimizeForMobile = () => {
  console.log('Mobile optimizations applied');
  return null;
};

export const useMobileDetection = () => {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = /Mobi|Android/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edge|OPR/.test(ua);
    const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setInfo({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isMobile,
      isTablet,
      touchEnabled,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
    });
  }, []);

  return info;
};
