import React from 'react';

export default function Head() {
  return (
    <>
      {/* Primary favicon (SVG) */}
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      {/* PNG fallback for browsers that don't support SVG favicons */}
      <link rel="icon" href="/favicon-32.png" sizes="32x32" />
      <link rel="icon" href="/favicon-16.png" sizes="16x16" />
      {/* Apple touch */}
      <link rel="apple-touch-icon" href="/favicon-180.png" />
    </>
  );
}
