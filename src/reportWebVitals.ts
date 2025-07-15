const reportWebVitals = (onPerfEntry?: any) => {
  // Web vitals reporting is optional and can be disabled
  // This prevents TypeScript errors with incompatible web-vitals versions
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Optionally implement web vitals reporting here
    console.log('Web vitals reporting callback provided but not implemented');
  }
};

export default reportWebVitals;
