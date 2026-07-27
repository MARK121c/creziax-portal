import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("❌ Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-xl font-black text-white mb-2 italic">يا ساتر! حدث خطأ تقني مفاجئ</h1>
          <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
            حدث خطأ غير متوقع في الموقع. يرجى تصوير هذه الشاشة وإرسالها للدعم لحل المشكلة فوراً.
          </p>
          
          <div className="w-full max-w-lg bg-black/40 border border-white/5 rounded-2xl p-4 text-left overflow-auto custom-scrollbar max-h-64">
            <p className="text-rose-400 font-mono text-[10px] mb-2 font-bold uppercase tracking-widest">التفاصيل التقنية (Technical Details):</p>
            <pre className="text-slate-500 font-mono text-[10px] whitespace-pre-wrap leading-tight italic">
              {this.state.error && this.state.error.toString()}
              {"\n\nComponent Stack:\n"}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>

          <button 
            onClick={() => window.location.href = '/'}
            className="mt-8 px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20"
          >
            الرجوع للرئيسية
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
