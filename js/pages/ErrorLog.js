// ===== ERROR LOG PAGE COMPONENT =====
function ErrorLogPage({ goTo }) {
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [navigationAttempts, setNavigationAttempts] = useState([]);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentRoute, setCurrentRoute] = useState('unknown');
  
  // Use refs to avoid state updates during render
  const errorsRef = useRef([]);
  const logsRef = useRef([]);
  const navigationAttemptsRef = useRef([]);

  // Capture all JavaScript errors
  useEffect(() => {
    const originalError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    window.onerror = function(message, source, lineno, colno, error) {
      const errorInfo = {
        type: 'JavaScript Error',
        message: message,
        source: source,
        line: lineno,
        column: colno,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      };
      errorsRef.current = [...errorsRef.current, errorInfo];
      setErrors([...errorsRef.current]);
      console.error('Captured Error:', errorInfo);
    };

    window.onunhandledrejection = function(event) {
      const errorInfo = {
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      };
      errorsRef.current = [...errorsRef.current, errorInfo];
      setErrors([...errorsRef.current]);
      console.error('Captured Promise Rejection:', errorInfo);
    };

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalConsoleError = console.error;
    const originalWarn = console.warn;

    console.log = function(...args) {
      const logInfo = {
        type: 'log',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      };
      logsRef.current = [...logsRef.current, logInfo];
      setLogs([...logsRef.current]);
      originalLog.apply(console, args);
    };

    console.error = function(...args) {
      const logInfo = {
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      };
      logsRef.current = [...logsRef.current, logInfo];
      setLogs([...logsRef.current]);
      originalConsoleError.apply(console, args);
    };

    console.warn = function(...args) {
      const logInfo = {
        type: 'warn',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      };
      logsRef.current = [...logsRef.current, logInfo];
      setLogs([...logsRef.current]);
      originalWarn.apply(console, args);
    };

    // Monitor history/navigation changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      const attempt = {
        path: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      navigationAttemptsRef.current = [...navigationAttemptsRef.current, attempt];
      setNavigationAttempts([...navigationAttemptsRef.current]);
    };

    window.addEventListener('popstate', handlePopState);

    // Monitor click events
    const handleClick = (event) => {
      const clickInfo = {
        element: event.target.tagName,
        className: event.target.className,
        id: event.target.id,
        text: event.target.textContent?.substring(0, 50),
        timestamp: new Date().toISOString()
      };
      logsRef.current = [...logsRef.current, { type: 'click', ...clickInfo }];
      setLogs([...logsRef.current]);
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalUnhandledRejection;
      console.log = originalLog;
      console.error = originalConsoleError;
      console.warn = originalWarn;
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Test navigation function
  const testNavigation = () => {
    console.log('Testing navigation to artists page...');
    goTo('artists');
  };

  // Test button click
  const testButtonClick = () => {
    console.log('Test button clicked!');
    alert('Test button works!');
  };

  // Clear logs
  const clearLogs = () => {
    errorsRef.current = [];
    logsRef.current = [];
    navigationAttemptsRef.current = [];
    setErrors([]);
    setLogs([]);
    setNavigationAttempts([]);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🔍 Error Log & Debug Panel</h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={testNavigation}
            >
              Test Navigation
            </button>
            <button 
              className="btn btn-secondary"
              onClick={testButtonClick}
            >
              Test Button
            </button>
            <button 
              className="btn btn-ghost"
              onClick={clearLogs}
            >
              Clear Logs
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => goTo('home')}
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Current State */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Current Path</h3>
            <p className="text-sm font-mono bg-gray-800 p-2 rounded">{currentPath || 'none'}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Current Route</h3>
            <p className="text-sm font-mono bg-gray-800 p-2 rounded">{currentRoute}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Total Errors</h3>
            <p className="text-2xl font-bold text-red-400">{errors.length}</p>
          </div>
        </div>

        {/* Errors Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4 text-red-400">🚨 JavaScript Errors ({errors.length})</h2>
          {errors.length === 0 ? (
            <p className="text-gray-400">No errors captured yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="border border-red-500 rounded p-3 bg-red-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-red-400">{error.type}</span>
                    <span className="text-xs text-gray-400">{error.timestamp}</span>
                  </div>
                  <p className="text-sm mb-1">{error.message}</p>
                  {error.source && (
                    <p className="text-xs text-gray-400">Source: {error.source}:{error.line}:{error.column}</p>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto">{error.stack}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Attempts */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🧭 Navigation Attempts ({navigationAttempts.length})</h2>
          {navigationAttempts.length === 0 ? (
            <p className="text-gray-400">No navigation attempts yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {navigationAttempts.map((attempt, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-blue-900/20 rounded">
                  <span className="font-mono text-sm">{attempt.path}</span>
                  <span className="text-xs text-gray-400">{attempt.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console Logs */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-green-400">📝 Console Logs ({logs.length})</h2>
          {logs.length === 0 ? (
            <p className="text-gray-400">No logs captured yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  log.type === 'error' ? 'bg-red-900/20 border border-red-500' :
                  log.type === 'warn' ? 'bg-yellow-900/20 border border-yellow-500' :
                  log.type === 'click' ? 'bg-purple-900/20 border border-purple-500' :
                  'bg-gray-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className={`font-bold ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-yellow-400' :
                      log.type === 'click' ? 'text-purple-400' :
                      'text-green-400'
                    }`}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-xs text-gray-400">{log.timestamp}</span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                  {log.element && (
                    <p className="text-xs text-gray-400 mt-1">
                      Element: {log.element} | Class: {log.className} | ID: {log.id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Export component
window.ErrorLogPage = ErrorLogPage; 