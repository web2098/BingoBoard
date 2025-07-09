// Telemetry utility for tracking bingo game sessions and number calls
// Handles game start/end times, number selection tracking, and session history

export interface NumberCall {
  number: number;
  timestamp: Date;
  letter: string; // B, I, N, G, O
}

export interface Winner {
  numberIndex: number; // Index in numbersCalled array where win occurred
  detectionMethod: 'manual' | 'audience_interaction' | 'statistical_outlier';
  timestamp: Date;
}

export interface GameSession {
  gameId: number;
  gameName: string;
  variant: number;
  freeSpace: boolean;
  startTime: Date;
  endTime?: Date;
  numbersCalled: NumberCall[];
  totalNumbers: number; // Total possible numbers (usually 75)
  sessionId: string; // Unique identifier for this session
  winners: Winner[]; // Array of detected winners
  statistics: {
    duration: number;
    numbersCalledCount: number;
    percentComplete: number;
    averageTimePerCall: number;
    gameCompletionStatus: 'incomplete' | 'complete';
  };
}

export interface LongTermTelemetry {
  numberCallFrequency: { [key: number]: number }; // Total times each number was called
  totalGamesPlayed: number;
  gameTypeStats: {
    [gameType: string]: {
      totalTimePlayed: number;
      shortestGameTime: number;
      longestGameTime: number;
      averageGameTime: number;
      shortestCallRate: number; // numbers per second
      longestCallRate: number;
      averageCallRate: number;
    };
  };
  overallStats: {
    averageCallRate: number;
    shortestWinnerNumbers: number;
    longestWinnerNumbers: number;
  };
}

export interface TelemetryData {
  currentSession?: GameSession;
  sessionHistory: GameSession[];
  lastSessionId?: string;
  longTermStats: LongTermTelemetry;
}

// Keys for localStorage
const TELEMETRY_KEY = 'bingoTelemetry';
const CURRENT_SESSION_KEY = 'bingoCurrentSession';

// Event system for telemetry updates
const TELEMETRY_UPDATE_EVENT = 'telemetryUpdate';

// Dispatch telemetry update event
const dispatchTelemetryUpdate = () => {
  window.dispatchEvent(new CustomEvent(TELEMETRY_UPDATE_EVENT));
};

/**
 * Get the Bingo letter for a given number
 */
const getBingoLetter = (number: number): string => {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return 'U'; // Unknown
};

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Load telemetry data from localStorage
 */
const loadTelemetryData = (): TelemetryData => {
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      if (parsed.sessionHistory) {
        parsed.sessionHistory = parsed.sessionHistory.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          numbersCalled: session.numbersCalled.map((call: any) => ({
            ...call,
            timestamp: new Date(call.timestamp)
          })),
          winners: session.winners ? session.winners.map((winner: any) => ({
            ...winner,
            timestamp: new Date(winner.timestamp)
          })) : []
        }));
      }
      // Ensure longTermStats exists with proper structure
      if (!parsed.longTermStats) {
        parsed.longTermStats = initializeLongTermStats();
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading telemetry data:', error);
  }

  return {
    sessionHistory: [],
    longTermStats: initializeLongTermStats()
  };
};

/**
 * Initialize long-term statistics structure
 */
const initializeLongTermStats = (): LongTermTelemetry => {
  return {
    numberCallFrequency: {},
    totalGamesPlayed: 0,
    gameTypeStats: {},
    overallStats: {
      averageCallRate: 0,
      shortestWinnerNumbers: Infinity,
      longestWinnerNumbers: 0
    }
  };
};

/**
 * Save telemetry data to localStorage
 */
const saveTelemetryData = (data: TelemetryData): void => {
  try {
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(data));
    dispatchTelemetryUpdate();
  } catch (error) {
    console.error('Error saving telemetry data:', error);
  }
};

/**
 * Load current session from localStorage
 */
const loadCurrentSession = (): GameSession | null => {
  try {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
        numbersCalled: parsed.numbersCalled.map((call: any) => ({
          ...call,
          timestamp: new Date(call.timestamp)
        })),
        winners: parsed.winners ? parsed.winners.map((winner: any) => ({
          ...winner,
          timestamp: new Date(winner.timestamp)
        })) : [],
        statistics: parsed.statistics || {
          duration: 0,
          numbersCalledCount: 0,
          percentComplete: 0,
          averageTimePerCall: 0,
          gameCompletionStatus: 'incomplete'
        }
      };
    }
  } catch (error) {
    console.error('Error loading current session:', error);
  }

  return null;
};

/**
 * Save current session to localStorage
 */
const saveCurrentSession = (session: GameSession | null): void => {
  try {
    if (session) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
    dispatchTelemetryUpdate();
  } catch (error) {
    console.error('Error saving current session:', error);
  }
};

/**
 * Start a new game session
 */
export const startGameSession = (
  gameId: number,
  gameName: string,
  variant: number,
  freeSpace: boolean,
  totalNumbers: number = 75
): GameSession => {
  // End any existing session first
  endCurrentSession();

  const session: GameSession = {
    gameId,
    gameName,
    variant,
    freeSpace,
    startTime: new Date(),
    numbersCalled: [],
    totalNumbers,
    sessionId: generateSessionId(),
    winners: [],
    statistics: {
      duration: 0,
      numbersCalledCount: 0,
      percentComplete: 0,
      averageTimePerCall: 0,
      gameCompletionStatus: 'incomplete'
    }
  };

  saveCurrentSession(session);

  console.log('Started new game session:', {
    game: gameName,
    variant,
    freeSpace,
    sessionId: session.sessionId
  });

  return session;
};

/**
 * Record a number being called/selected
 */
export const recordNumberCall = (number: number): void => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    console.warn('No active session to record number call');
    return;
  }

  const letter = getBingoLetter(number);
  const call: NumberCall = {
    number,
    timestamp: new Date(),
    letter
  };

  // Check if number was already called
  const existingCallIndex = currentSession.numbersCalled.findIndex(c => c.number === number);

  if (existingCallIndex >= 0) {
    // Remove the existing call (unselecting the number)
    currentSession.numbersCalled.splice(existingCallIndex, 1);
    console.log('Removed number call:', number, letter);
  } else {
    // Add the new call
    currentSession.numbersCalled.push(call);
    console.log('Recorded number call:', number, letter);
  }

  // Update statistics
  currentSession.statistics.numbersCalledCount = currentSession.numbersCalled.length;
  currentSession.statistics.percentComplete = (currentSession.statistics.numbersCalledCount / currentSession.totalNumbers) * 100;

  // Update average time per call
  const totalTime = currentSession.statistics.duration;
  const callRate = currentSession.statistics.numbersCalledCount > 0 ? totalTime / currentSession.statistics.numbersCalledCount : 0;
  currentSession.statistics.averageTimePerCall = callRate;

  saveCurrentSession(currentSession);
};

/**
 * Reset the current game session (clear all called numbers but keep game info)
 */
export const resetGameSession = (): void => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    console.warn('No active session to reset');
    return;
  }

  // Reset the session but keep game info and update start time
  currentSession.numbersCalled = [];
  currentSession.startTime = new Date();
  currentSession.sessionId = generateSessionId(); // New session ID for the reset
  delete currentSession.endTime;

  // Reset statistics
  currentSession.statistics = {
    duration: 0,
    numbersCalledCount: 0,
    percentComplete: 0,
    averageTimePerCall: 0,
    gameCompletionStatus: 'incomplete'
  };

  saveCurrentSession(currentSession);

  console.log('Reset game session:', {
    game: currentSession.gameName,
    newSessionId: currentSession.sessionId
  });
};

/**
 * End the current session and move it to history
 */
export const endCurrentSession = (): void => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    return; // No session to end
  }

  // Set end time
  currentSession.endTime = new Date();

  // Calculate final statistics
  const duration = currentSession.endTime.getTime() - currentSession.startTime.getTime();
  const numbersCalled = currentSession.numbersCalled.length;
  const averageTimePerCall = numbersCalled > 1 ?
    getTimeBetweenNumbers(currentSession.numbersCalled).reduce((a, b) => a + b, 0) / (numbersCalled - 1) : 0;

  currentSession.statistics = {
    duration,
    numbersCalledCount: numbersCalled,
    percentComplete: (numbersCalled / currentSession.totalNumbers) * 100,
    averageTimePerCall,
    gameCompletionStatus: numbersCalled > 0 ? 'complete' : 'incomplete'
  };

  // Detect statistical winners before saving
  const statisticalWinners = determineStatisticalWinners(currentSession);
  currentSession.winners.push(...statisticalWinners);

  // Add manual winner if game ended with numbers called
  if (numbersCalled > 0) {
    const hasManualWinner = currentSession.winners.some(w => w.detectionMethod === 'manual');
    if (!hasManualWinner) {
      currentSession.winners.push({
        numberIndex: numbersCalled - 1,
        detectionMethod: 'manual',
        timestamp: currentSession.endTime
      });
    }
  }

  // Only save to history if at least one number was called
  if (currentSession.numbersCalled.length > 0) {
    // Update long-term statistics
    updateLongTermStats(currentSession);

    const telemetryData = loadTelemetryData();
    telemetryData.sessionHistory.push(currentSession);
    telemetryData.lastSessionId = currentSession.sessionId;
    saveTelemetryData(telemetryData);

    console.log('Ended game session and saved to history:', {
      game: currentSession.gameName,
      sessionId: currentSession.sessionId,
      duration,
      numbersCalled: currentSession.numbersCalled.length,
      winners: currentSession.winners.length
    });
  } else {
    console.log('Ended empty game session (not saved to history):', {
      game: currentSession.gameName,
      sessionId: currentSession.sessionId
    });
  }

  // Clear current session
  saveCurrentSession(null);
};

/**
 * Switch to a new game (ends current session and starts new one)
 */
export const switchToNewGame = (
  gameId: number,
  gameName: string,
  variant: number,
  freeSpace: boolean,
  totalNumbers: number = 75
): GameSession => {
  console.log('Switching to new game:', gameName);

  // This will automatically end the current session and start a new one
  return startGameSession(gameId, gameName, variant, freeSpace, totalNumbers);
};

/**
 * Get the current active session
 */
export const getCurrentSession = (): GameSession | null => {
  return loadCurrentSession();
};

/**
 * Get session history
 */
export const getSessionHistory = (): GameSession[] => {
  const telemetryData = loadTelemetryData();
  return telemetryData.sessionHistory || [];
};

/**
 * Get the last called numbers from current session
 */
export const getLastCalledNumbers = (): number[] => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    return [];
  }

  return currentSession.numbersCalled
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(call => call.number);
};

/**
 * Get the most recent number called
 */
export const getLastCalledNumber = (): number | null => {
  const currentSession = loadCurrentSession();
  if (!currentSession || currentSession.numbersCalled.length === 0) {
    return null;
  }

  // Find the most recent call
  const mostRecent = currentSession.numbersCalled.reduce((latest, current) =>
    current.timestamp > latest.timestamp ? current : latest
  );

  return mostRecent.number;
};

/**
 * Check if a number has been called in the current session
 */
export const isNumberCalled = (number: number): boolean => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    return false;
  }

  return currentSession.numbersCalled.some(call => call.number === number);
};

/**
 * Get telemetry statistics for the current session
 */
export const getCurrentSessionStats = () => {
  const currentSession = loadCurrentSession();
  if (!currentSession) {
    return null;
  }

  const now = new Date();
  const duration = now.getTime() - currentSession.startTime.getTime();
  const numbersCalled = currentSession.numbersCalled.length;
  const percentComplete = (numbersCalled / currentSession.totalNumbers) * 100;

  return {
    sessionId: currentSession.sessionId,
    gameName: currentSession.gameName,
    variant: currentSession.variant,
    freeSpace: currentSession.freeSpace,
    startTime: currentSession.startTime,
    duration,
    numbersCalled,
    totalNumbers: currentSession.totalNumbers,
    percentComplete: Math.round(percentComplete * 100) / 100
  };
};

/**
 * Get long-term telemetry statistics
 */
export const getLongTermStats = (): LongTermTelemetry => {
  const telemetryData = loadTelemetryData();
  return telemetryData.longTermStats;
};

/**
 * Get statistics for tonight's session (all games played today)
 */
export const getTonightSessionStats = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionHistory = getSessionHistory();
  const tonightSessions = sessionHistory.filter(session =>
    session.startTime >= today
  );

  const currentSession = getCurrentSession();
  if (currentSession && currentSession.startTime >= today) {
    tonightSessions.push(currentSession);
  }

  const totalGames = tonightSessions.length;
  const totalNumbersCalled = tonightSessions.reduce((sum, session) =>
    sum + session.numbersCalled.length, 0
  );
  const totalDuration = tonightSessions.reduce((sum, session) => {
    const endTime = session.endTime || new Date();
    return sum + (endTime.getTime() - session.startTime.getTime());
  }, 0);
  const totalWinners = tonightSessions.reduce((sum, session) =>
    sum + session.winners.length, 0
  );

  return {
    totalGames,
    totalNumbersCalled,
    totalDuration,
    totalWinners,
    averageGameDuration: totalGames > 0 ? totalDuration / totalGames : 0,
    averageNumbersPerGame: totalGames > 0 ? totalNumbersCalled / totalGames : 0,
    sessions: tonightSessions
  };
};

/**
 * Clear all telemetry data (for settings/privacy)
 */
export const clearAllTelemetryData = (): void => {
  try {
    localStorage.removeItem(TELEMETRY_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    console.log('Cleared all telemetry data');
  } catch (error) {
    console.error('Error clearing telemetry data:', error);
  }
};

/**
 * Export telemetry data for analysis
 */
export const exportTelemetryData = (): string => {
  const telemetryData = loadTelemetryData();
  const currentSession = loadCurrentSession();

  const exportData = {
    ...telemetryData,
    currentSession,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Calculate time between number calls for statistical analysis
 */
const getTimeBetweenNumbers = (numbers: NumberCall[]): number[] => {
  const timeBetweenNumbers: number[] = [];
  for (let i = 1; i < numbers.length; i++) {
    timeBetweenNumbers.push(numbers[i].timestamp.getTime() - numbers[i - 1].timestamp.getTime());
  }
  return timeBetweenNumbers;
};

/**
 * Calculate statistical threshold for winner detection
 */
const calculateWinThreshold = (timeBetweenNumbers: number[]): number => {
  if (timeBetweenNumbers.length < 2) return Infinity;

  const mean = timeBetweenNumbers.reduce((a, b) => a + b, 0) / timeBetweenNumbers.length;
  const stdDev = Math.sqrt(
    timeBetweenNumbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (timeBetweenNumbers.length - 1)
  );

  const sortedTimes = [...timeBetweenNumbers].sort((a, b) => a - b);
  const median = sortedTimes[Math.floor(sortedTimes.length / 2)];

  return median + (2 * stdDev);
};

/**
 * Determine winners based on statistical analysis
 */
const determineStatisticalWinners = (session: GameSession): Winner[] => {
  if (session.numbersCalled.length < 3) return [];

  const timeBetweenNumbers = getTimeBetweenNumbers(session.numbersCalled);
  const winThreshold = calculateWinThreshold(timeBetweenNumbers);

  const outliers = timeBetweenNumbers.filter(x => x > winThreshold);
  const outlierIndices: number[] = [];

  for (const outlier of outliers) {
    const index = timeBetweenNumbers.indexOf(outlier);
    if (index !== -1) {
      outlierIndices.push(index + 1); // +1 because we're looking at the number after the gap
    }
  }

  // For survivor games, only keep the last winner
  if (session.gameName.toLowerCase() === 'survivor' && outlierIndices.length > 0) {
    const lastIndex = outlierIndices[outlierIndices.length - 1];
    return [{
      numberIndex: lastIndex,
      detectionMethod: 'statistical_outlier',
      timestamp: session.numbersCalled[lastIndex]?.timestamp || new Date()
    }];
  }

  return outlierIndices.map(index => ({
    numberIndex: index,
    detectionMethod: 'statistical_outlier' as const,
    timestamp: session.numbersCalled[index]?.timestamp || new Date()
  }));
};

/**
 * Record a manual winner (when game ends)
 */
export const recordManualWinner = (): void => {
  const currentSession = loadCurrentSession();
  if (!currentSession) return;

  const winner: Winner = {
    numberIndex: currentSession.numbersCalled.length - 1,
    detectionMethod: 'manual',
    timestamp: new Date()
  };

  currentSession.winners.push(winner);
  saveCurrentSession(currentSession);

  console.log('Recorded manual winner at number:', currentSession.numbersCalled.length);
};

/**
 * Record an audience interaction winner
 */
export const recordAudienceWinner = (): void => {
  const currentSession = loadCurrentSession();
  if (!currentSession) return;

  const winner: Winner = {
    numberIndex: currentSession.numbersCalled.length - 1,
    detectionMethod: 'audience_interaction',
    timestamp: new Date()
  };

  currentSession.winners.push(winner);
  saveCurrentSession(currentSession);

  console.log('Recorded audience interaction winner at number:', currentSession.numbersCalled.length);
};

/**
 * Update long-term statistics when a session ends
 */
const updateLongTermStats = (session: GameSession): void => {
  const telemetryData = loadTelemetryData();
  const stats = telemetryData.longTermStats;

  // Update number call frequency
  session.numbersCalled.forEach(call => {
    stats.numberCallFrequency[call.number] = (stats.numberCallFrequency[call.number] || 0) + 1;
  });

  // Update total games played
  stats.totalGamesPlayed++;

  // Calculate session statistics
  const duration = session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0;
  const callRate = duration > 0 ? (session.numbersCalled.length / (duration / 1000)) : 0;

  // Update game type statistics
  const gameKey = `${session.gameName}_v${session.variant}`;
  if (!stats.gameTypeStats[gameKey]) {
    stats.gameTypeStats[gameKey] = {
      totalTimePlayed: 0,
      shortestGameTime: Infinity,
      longestGameTime: 0,
      averageGameTime: 0,
      shortestCallRate: Infinity,
      longestCallRate: 0,
      averageCallRate: 0
    };
  }

  const gameStats = stats.gameTypeStats[gameKey];
  gameStats.totalTimePlayed += duration;
  gameStats.shortestGameTime = Math.min(gameStats.shortestGameTime, duration);
  gameStats.longestGameTime = Math.max(gameStats.longestGameTime, duration);
  gameStats.shortestCallRate = Math.min(gameStats.shortestCallRate, callRate);
  gameStats.longestCallRate = Math.max(gameStats.longestCallRate, callRate);

  // Recalculate averages (this is simplified - in production you'd want to track counts)
  const allGameSessions = telemetryData.sessionHistory.filter(s =>
    s.gameName === session.gameName && s.variant === session.variant
  );
  allGameSessions.push(session);

  const totalDuration = allGameSessions.reduce((sum, s) =>
    sum + (s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0), 0
  );
  const totalCallRate = allGameSessions.reduce((sum, s) => {
    const d = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
    return sum + (d > 0 ? s.numbersCalled.length / (d / 1000) : 0);
  }, 0);

  gameStats.averageGameTime = totalDuration / allGameSessions.length;
  gameStats.averageCallRate = totalCallRate / allGameSessions.length;

  // Update overall statistics
  const allSessions = [...telemetryData.sessionHistory, session];
  const allCallRates = allSessions.map(s => {
    const d = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
    return d > 0 ? s.numbersCalled.length / (d / 1000) : 0;
  }).filter(rate => rate > 0);

  stats.overallStats.averageCallRate = allCallRates.reduce((sum, rate) => sum + rate, 0) / allCallRates.length;

  // Update winner statistics
  session.winners.forEach(winner => {
    const winnerNumberCount = winner.numberIndex + 1;
    stats.overallStats.shortestWinnerNumbers = Math.min(stats.overallStats.shortestWinnerNumbers, winnerNumberCount);
    stats.overallStats.longestWinnerNumbers = Math.max(stats.overallStats.longestWinnerNumbers, winnerNumberCount);
  });

  saveTelemetryData(telemetryData);
};

// Export the event name for components to use
export const TELEMETRY_UPDATE_EVENT_NAME = TELEMETRY_UPDATE_EVENT;

/**
 * Subscribe to telemetry updates
 */
export const subscribeTelemetryUpdates = (callback: () => void): (() => void) => {
  const handleUpdate = () => callback();
  window.addEventListener(TELEMETRY_UPDATE_EVENT, handleUpdate);

  // Return unsubscribe function
  return () => {
    window.removeEventListener(TELEMETRY_UPDATE_EVENT, handleUpdate);
  };
};
