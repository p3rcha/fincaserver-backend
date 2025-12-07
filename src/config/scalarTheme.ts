/**
 * Scalar API Documentation Theme Configuration
 * Custom dark theme matching FINCA SERVER's jungle aesthetic
 */

export const scalarCustomCss = `
  :root {
    /* Background colors - Jungle dark palette */
    --scalar-background-1: #0a0f0a;
    --scalar-background-2: #0f1a0f;
    --scalar-background-3: #152315;
    --scalar-background-4: #1a2e1a;
    
    /* Text colors */
    --scalar-color-1: #f8fafc;
    --scalar-color-2: #e2e8f0;
    --scalar-color-3: #94a3b8;
    
    /* Accent colors - Tropical greens */
    --scalar-color-accent: #22c55e;
    --scalar-color-green: #10b981;
    --scalar-color-red: #ef4444;
    --scalar-color-yellow: #f59e0b;
    --scalar-color-blue: #3b82f6;
    --scalar-color-orange: #f97316;
    --scalar-color-purple: #a855f7;
    
    /* Borders */
    --scalar-border-color: rgba(34, 197, 94, 0.15);
    
    /* Buttons */
    --scalar-button-1: #22c55e;
    --scalar-button-1-hover: #16a34a;
    --scalar-button-1-color: #0a0f0a;
    
    /* Scrollbar */
    --scalar-scrollbar-color: #228B22;
    --scalar-scrollbar-color-active: #16a34a;
    
    /* Sidebar */
    --scalar-sidebar-background-1: #0a0f0a;
    --scalar-sidebar-border-color: rgba(34, 197, 94, 0.1);
    --scalar-sidebar-color-1: #f8fafc;
    --scalar-sidebar-color-2: #94a3b8;
    --scalar-sidebar-color-active: #22c55e;
    
    /* Cards */
    --scalar-card-background: #0f1a0f;
  }
  
  /* Custom scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0a0f0a;
  }
  ::-webkit-scrollbar-thumb {
    background: #228B22;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #16a34a;
  }
  
  /* HTTP Method badges with tropical colors */
  [data-method="get"] { background: #10b981 !important; }
  [data-method="post"] { background: #3b82f6 !important; }
  [data-method="put"] { background: #f59e0b !important; }
  [data-method="delete"] { background: #ef4444 !important; }
  [data-method="patch"] { background: #a855f7 !important; }
`;

export const scalarConfig = {
  theme: 'deepSpace' as const,
  layout: 'modern' as const,
  darkMode: true,
  hideModels: false,
  hideDownloadButton: false,
  showSidebar: true,
  customCss: scalarCustomCss,
  metaData: {
    title: 'FINCA SERVER API Documentation',
    description: 'Interactive API documentation for FINCA SERVER Minecraft',
    ogDescription: 'Explore and test the FINCA SERVER API endpoints',
  },
};

