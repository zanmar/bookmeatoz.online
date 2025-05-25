import React from 'react';
import { useMobileDetection } from '../../utils/mobileOptimization';

export const MobileDebugInfo: React.FC = () => {
  const deviceInfo = useMobileDetection();

  if (!deviceInfo) {
    return <div className="p-4 bg-gray-100 rounded">Loading device info...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black bg-opacity-80 text-white rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">📱 Mobile Debug Info</h3>
      <div className="space-y-1">
        <div>📏 Viewport: {deviceInfo.viewportWidth}x{deviceInfo.viewportHeight}</div>
        <div>📱 Mobile: {deviceInfo.isMobile ? '✅' : '❌'}</div>
        <div>📟 Tablet: {deviceInfo.isTablet ? '✅' : '❌'}</div>
        <div>👆 Touch: {deviceInfo.touchEnabled ? '✅' : '❌'}</div>
        <div>🍎 iOS: {deviceInfo.isIOS ? '✅' : '❌'}</div>
        <div>🤖 Android: {deviceInfo.isAndroid ? '✅' : '❌'}</div>
        <div>🌐 Safari: {deviceInfo.isSafari ? '✅' : '❌'}</div>
        <div>🔍 Chrome: {deviceInfo.isChrome ? '✅' : '❌'}</div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-500">
        <div className="text-xs opacity-75">
          UA: {navigator.userAgent.substring(0, 40)}...
        </div>
      </div>
    </div>
  );
};

export default MobileDebugInfo;
