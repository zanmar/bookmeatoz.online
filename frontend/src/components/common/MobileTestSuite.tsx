import React, { useState } from 'react';

const MobileTestSuite: React.FC = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const tests = [
    {
      id: 'viewport',
      title: 'Viewport Meta Tag Test',
      description: 'Tests if viewport is properly configured',
      component: () => (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-900">Current Viewport:</h4>
            <p className="text-sm text-blue-700">
              Width: {window.innerWidth}px, Height: {window.innerHeight}px
            </p>
            <p className="text-sm text-blue-700">
              Device Pixel Ratio: {window.devicePixelRatio}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            ✅ If you can see this text clearly without zooming, viewport is working.
          </div>
        </div>
      )
    },
    {
      id: 'touch-targets',
      title: 'Touch Target Size Test',
      description: 'Tests if buttons are large enough for mobile',
      component: () => (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Tap these buttons - they should be easy to press on mobile:
          </div>
          <button className="w-full py-3 px-4 bg-blue-500 text-white rounded min-h-[44px] hover:bg-blue-600">
            ✅ Good Touch Target (44px+ height)
          </button>
          <button className="w-full py-1 px-2 bg-red-500 text-white rounded text-xs hover:bg-red-600">
            ❌ Bad Touch Target (too small)
          </button>
          <div className="text-sm text-gray-600">
            The first button should be much easier to tap accurately.
          </div>
        </div>
      )
    },
    {
      id: 'responsive-text',
      title: 'Responsive Text Test',
      description: 'Tests text scaling across screen sizes',
      component: () => (
        <div className="space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
            Responsive Heading
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700">
            This text should scale appropriately: small on mobile, larger on tablet/desktop.
          </p>
          <div className="text-xs text-gray-500">
            Current breakpoint classes should be visible in the debugger above.
          </div>
        </div>
      )
    },
    {
      id: 'horizontal-scroll',
      title: 'Horizontal Scroll Test',
      description: 'Tests for unwanted horizontal scrolling',
      component: () => (
        <div className="space-y-4">
          <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded text-white">
            <h4 className="font-semibold">Full Width Container</h4>
            <p className="text-sm opacity-90">This should fit the screen width exactly</p>
          </div>
          <div className="text-sm text-gray-600">
            ✅ No horizontal scrollbar should appear
            <br />
            ❌ If you can scroll left/right, there's a layout issue
          </div>
          <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800">
              <strong>Test:</strong> Try swiping left/right on this page. 
              You should NOT be able to scroll horizontally.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'mobile-navigation',
      title: 'Mobile Navigation Test',
      description: 'Tests mobile menu functionality',
      component: () => (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            On mobile screens (below 768px):
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></span>
              <span>Hamburger menu should be visible in header</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></span>
              <span>Desktop navigation should be hidden</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></span>
              <span>Tapping hamburger should open mobile menu</span>
            </li>
          </ul>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>Test now:</strong> Look at the header above and verify the mobile menu works.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'grid-layout',
      title: 'Responsive Grid Test',
      description: 'Tests how grids adapt to screen size',
      component: () => (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Grid should change columns based on screen size:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-red-100 p-4 rounded text-center">
              <div className="text-red-800 font-semibold">Item 1</div>
              <div className="text-xs text-red-600 mt-1">Mobile: 1 col</div>
            </div>
            <div className="bg-blue-100 p-4 rounded text-center">
              <div className="text-blue-800 font-semibold">Item 2</div>
              <div className="text-xs text-blue-600 mt-1">Tablet: 2 cols</div>
            </div>
            <div className="bg-green-100 p-4 rounded text-center">
              <div className="text-green-800 font-semibold">Item 3</div>
              <div className="text-xs text-green-600 mt-1">Desktop: 3 cols</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            • Mobile (&lt;640px): 1 column
            • Tablet (640px+): 2 columns  
            • Desktop (1024px+): 3 columns
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📱 Mobile Responsiveness Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Use this page to identify and test mobile display issues. 
            Open browser dev tools and test different device sizes.
          </p>

          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setActiveTest(activeTest === test.id ? null : test.id)}
                  className="w-full px-4 py-3 text-left font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{test.title}</div>
                    <div className="text-sm text-gray-600">{test.description}</div>
                  </div>
                  <div className="ml-4">
                    {activeTest === test.id ? '−' : '+'}
                  </div>
                </button>
                
                {activeTest === test.id && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="pt-4">
                      <test.component />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">
              🔧 How to Use This Test Suite:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
              <li>Open browser Developer Tools (F12)</li>
              <li>Enable device toolbar/responsive mode</li>
              <li>Test different device sizes (iPhone, iPad, etc.)</li>
              <li>Expand each test above and verify the behaviors</li>
              <li>Report any issues you find with specific device sizes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestSuite;
