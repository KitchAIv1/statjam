'use client';

export function TestComponent() {
  return (
    <div className="container-section">
      <div className="card-visible">
        <h1 className="text-visible-white text-4xl font-bold mb-4">
          🔧 Layout Test Component
        </h1>
        <p className="text-visible-gray text-lg mb-4">
          This is a minimal test to verify our CSS architecture is working.
        </p>
        
        <div className="grid-stats">
          <div className="card-visible">
            <h3 className="text-visible-yellow font-semibold">Test Card 1</h3>
            <p className="text-visible-white">Should be yellow title, white text</p>
          </div>
          <div className="card-visible">
            <h3 className="text-visible-yellow font-semibold">Test Card 2</h3>
            <p className="text-visible-white">Should be yellow title, white text</p>
          </div>
          <div className="card-visible">
            <h3 className="text-visible-yellow font-semibold">Test Card 3</h3>
            <p className="text-visible-white">Should be yellow title, white text</p>
          </div>
        </div>

        <div className="mt-8 p-4 border border-red-500 bg-red-900">
          <h3 className="text-white font-bold">CSS Debug Info:</h3>
          <ul className="text-red-200 text-sm space-y-1">
            <li>• Container: container-section (should be centered, max-width)</li>
            <li>• Cards: card-visible (should have dark background, borders)</li>
            <li>• Grid: grid-stats (should be responsive grid)</li>
            <li>• Colors: text-visible-* classes (should override any conflicts)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}