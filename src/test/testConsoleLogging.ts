// Test file for console logging functionality
// This can be used to test the ClientLog component

export const testConsoleLogging = () => {
  console.log('Test log message - this should appear in the client log');
  console.info('Test info message - this should appear in blue');
  console.warn('Test warning message - this should appear in orange');
  console.error('Test error message - this should appear in red');

  // Test with objects
  console.log('Test object:', {
    roomId: 'test-room',
    connected: true,
    timestamp: new Date()
  });

  // Test with multiple arguments
  console.log('Multiple args:', 'arg1', 'arg2', { prop: 'value' });

  return 'Console logging test completed. Check the client log section!';
};

// Export for potential use in development
export default testConsoleLogging;
