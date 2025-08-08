'use client';

import React from 'react';

export const StatButtonsGrid: React.FC<{ children: React.ReactNode }>=({ children })=>{
  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
      {children}
    </div>
  );
}

