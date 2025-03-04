/// <reference types="vite/client" />

interface Window {
  db?: {
    undo?: () => Promise<boolean>;
    [key: string]: any;
  };
}