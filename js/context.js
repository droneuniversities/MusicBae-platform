// ===== APP CONTEXT =====
const { createContext, useContext } = React;

// Create the app context
const AppContext = createContext();

// Custom hook to use the app context
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Make context globally available
window.AppContext = AppContext;
window.useApp = useApp; 