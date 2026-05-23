'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const HomeInteractive = dynamic(() => import('./HomeInteractive'));

export default function HomeInteractiveClient() {
  return <HomeInteractive />;
}
