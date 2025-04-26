'use client';

import * as React from 'react';
import { Outlet } from "react-router-dom";

export default function RouterOutelet() {
  console.log('RouterOutelet rendered [DEBUG RSC]');
  React.useEffect(() => {
    console.log('RouterOutelet mounted [DEBUG RSC]');
  }, []);
  return React.createElement(Outlet);
}
