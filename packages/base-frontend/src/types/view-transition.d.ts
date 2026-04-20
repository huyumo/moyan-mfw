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

interface ViewTransitionOptions {
  update: () => void | Promise<void>;
  types?: string[];
}

declare global {
  interface Document {
    startViewTransition(callback: () => void | Promise<void>): ViewTransition;
    startViewTransition(options: ViewTransitionOptions): ViewTransition;
  }
}

export {};