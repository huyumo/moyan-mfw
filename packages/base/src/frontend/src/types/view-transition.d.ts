/**
 * View Transitions API 类型声明。
 * 用于支持 document.startViewTransition 方法。
 */

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

declare global {
  interface Document {
    startViewTransition(callback: () => void | Promise<void>): ViewTransition;
  }
}

export {};