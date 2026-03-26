// WebLayout — passthrough only, no frame
// The sidebar + content layout is handled by AppNavigator on web
import React from 'react';

interface WebLayoutProps { children: React.ReactNode; }

export const WebLayout: React.FC<WebLayoutProps> = ({ children }) => (
  <>{children}</>
);
