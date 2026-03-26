export {}

declare global {
  interface Window {
    electronAPI?: {
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
    };
  }
}