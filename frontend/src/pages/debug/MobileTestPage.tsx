import React, { useState, useEffect } from 'react';
import { useMobileDetection } from '../../utils/mobileOptimization';

export const MobileTestPage: React.FC = () => {
  const deviceInfo = useMobileDetection();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const results: string[] = [];
    
    // Test viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      results.push(`✅ Viewport meta: ${(viewportMeta as HTMLMetaElement).content}`);
    } else {
      results.push('❌ Viewport meta tag not found');
    }

    // Test data attributes
    const html = document.documentElement;
    results.push(`Mobile data attr: ${html.getAttribute('data-mobile') || 'not set'}`);
    results.push(`Touch data attr: ${html.getAttribute('data-touch') || 'not set'}`);
    results.push(`iOS data attr: ${html.getAttribute('data-ios') || 'not set'}`);
    results.push(`Android data attr: ${html.getAttribute('data-android') || 'not set'}`);

    // Test CSS custom properties
    const vhProperty = getComputedStyle(html).getPropertyValue('--vh');
    results.push(`CSS --vh property: ${vhProperty || 'not set'}`);

    setTestResults(results);
  }, [deviceInfo]);

  const runTouchTest = () => {
    alert('Touch test: If you see this on a mobile device, touch events are working!');
  };

  if (!deviceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading mobile detection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-center mb-8 text-gray-900">
          🔧 Mobile Optimization Test Page
        </h1>

        {/* Device Detection Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            📱 Device Detection Results
          </h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className={`p-3 rounded ${deviceInfo.isMobile ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>Mobile Device:</strong> {deviceInfo.isMobile ? 'YES ✅' : 'NO ❌'}
              </div>
              <div className={`p-3 rounded ${deviceInfo.isTablet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Tablet:</strong> {deviceInfo.isTablet ? 'YES ✅' : 'NO ❌'}
              </div>
              <div className={`p-3 rounded ${deviceInfo.touchEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>Touch Enabled:</strong> {deviceInfo.touchEnabled ? 'YES ✅' : 'NO ❌'}
              </div>
              <div className={`p-3 rounded ${deviceInfo.isIOS ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                <strong>iOS:</strong> {deviceInfo.isIOS ? 'YES 🍎' : 'NO ❌'}
              </div>
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded ${deviceInfo.isAndroid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Android:</strong> {deviceInfo.isAndroid ? 'YES 🤖' : 'NO ❌'}
              </div>
              <div className={`p-3 rounded ${deviceInfo.isSafari ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Safari:</strong> {deviceInfo.isSafari ? 'YES 🌐' : 'NO ❌'}
              </div>
              <div className={`p-3 rounded ${deviceInfo.isChrome ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Chrome:</strong> {deviceInfo.isChrome ? 'YES 🔍' : 'NO ❌'}
              </div>
              <div className="p-3 rounded bg-blue-100 text-blue-800">
                <strong>Viewport:</strong> {deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            🔧 Technical Test Results
          </h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded font-mono text-sm">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* User Agent Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            🌐 User Agent Information
          </h2>
          <div className="p-4 bg-gray-50 rounded font-mono text-sm break-all">
            {navigator.userAgent}
          </div>
        </div>

        {/* Interactive Tests */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            🧪 Interactive Tests
          </h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <button
              onClick={runTouchTest}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors min-h-[44px] touch-manipulation"
            >
              Test Touch Events
            </button>
            <button
              onClick={() => window.orientation !== undefined ? alert(`Orientation: ${window.orientation}°`) : alert('Orientation API not supported')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors min-h-[44px] touch-manipulation"
            >
              Test Orientation
            </button>
          </div>
        </div>

        {/* Form Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            📝 Form Zoom Prevention Test
          </h2>
          <p className="text-gray-600 mb-4">
            These inputs should not cause zoom on mobile devices (16px font size minimum):
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Test input field"
              className="w-full p-3 border border-gray-300 rounded-lg text-base min-h-[44px]"
              style={{ fontSize: '16px' }}
            />
            <textarea
              placeholder="Test textarea"
              className="w-full p-3 border border-gray-300 rounded-lg text-base min-h-[44px] resize-y"
              rows={3}
              style={{ fontSize: '16px' }}
            />
            <select className="w-full p-3 border border-gray-300 rounded-lg text-base min-h-[44px]" style={{ fontSize: '16px' }}>
              <option>Test select option 1</option>
              <option>Test select option 2</option>
            </select>
          </div>
        </div>

        {/* Responsive Grid Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl xs:text-2xl font-semibold mb-4 text-gray-800">
            📐 Responsive Grid Test
          </h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-400 to-pink-500 p-4 rounded-lg text-white text-center font-semibold">
                Box {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition-colors min-h-[44px] touch-manipulation"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage;
