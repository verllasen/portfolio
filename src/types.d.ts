export {}

declare global {
  interface Window {
  electron?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  electronAPI?: {
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;
  };
}
}