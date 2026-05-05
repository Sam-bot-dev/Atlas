import React from 'react';

export function Pages({ business, onRefresh, initialTab }) {
  // Placeholder for page routing
  return (
    <div style={{ padding: '20px' }}>
      <h1>{initialTab.charAt(0).toUpperCase() + initialTab.slice(1)} Page</h1>
      <p>This page is under construction.</p>
      {business && <p>Business: {business.name}</p>}
    </div>
  );
}