import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>Something went wrong · 页面发生错误</h1>
        <p>Please reload and try again. 请刷新后重试。</p>
        <button onClick={() => location.reload()}>Reload / 刷新</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
