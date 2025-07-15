# Console Log Feature

## Overview
The client page now includes a console log section that captures and displays all console outputs in real-time. This feature helps with debugging and monitoring the application state while using the bingo client.

## Features

### Console Capture
- Captures all `console.log()`, `console.info()`, `console.warn()`, and `console.error()` calls
- Displays logs in real-time as they occur
- Maintains original console functionality (logs still appear in browser dev tools)

### User Interface
- **Collapsible Section**: Similar to client settings, the log section can be expanded/collapsed
- **Auto-scroll**: Automatically scrolls to show newest log entries
- **Filtering**: Filter logs by level (All, Log, Info, Warn, Error)
- **Entry Count**: Shows the number of entries for each filter level
- **Clear Function**: Button to clear all log entries
- **Timestamps**: Each entry shows the time it was logged

### Log Display
- **Color-coded Levels**: Different colors for log, info, warn, and error messages
- **Readable Format**: Monospace font for better readability
- **Object Support**: JSON objects are properly formatted and displayed
- **Responsive**: Adapts to different screen sizes

## Technical Implementation

### Components
- `ClientLog.tsx` - Main log display component
- `useConsoleLog.ts` - Custom hook for console capture and management

### Features
- **Non-blocking**: Console interception doesn't affect application performance
- **Memory Management**: Limits stored entries to prevent memory leaks (default: 200 entries)
- **Type Safety**: Full TypeScript support with proper interfaces
- **Cleanup**: Properly restores original console methods on unmount

### Integration
The log component is positioned at the bottom of the client page, after the client settings section, providing easy access to debugging information without interfering with the main game interface.

## Usage
1. Navigate to any client page
2. The log section appears at the bottom, collapsed by default
3. Click the header to expand and view console output
4. Use filters to focus on specific types of messages
5. Toggle auto-scroll on/off as needed
6. Clear logs when needed with the clear button

This feature is particularly useful for:
- Debugging connection issues
- Monitoring server interactions
- Tracking audience interaction events
- General application state monitoring
