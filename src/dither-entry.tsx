import React from 'react';
import ReactDOM from 'react-dom/client';
import Dither from './Dither';

const rootEl = document.getElementById('hero-r3f-root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Dither
        waveSpeed={0.05}
        waveFrequency={3}
        waveAmplitude={0.3}
        waveColor={[0.48, 0.29, 0.93]} // #7c3aed purple
        colorNum={6}
        pixelSize={2.5}
        disableAnimation={false}
        enableMouseInteraction={true}
        mouseRadius={1}
      />
    </React.StrictMode>
  );
}
