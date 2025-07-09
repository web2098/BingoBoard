// Sample data generator for telemetry development and testing
import { GameSession, Winner, NumberCall, LongTermTelemetry } from './telemetry';

/**
 * Generate random number calls for a game session
 */
const generateRandomNumberCalls = (count: number, startTime: Date, duration: number): NumberCall[] => {
  const calls: NumberCall[] = [];
  const usedNumbers = new Set<number>();

  for (let i = 0; i < count; i++) {
    let number: number;
    do {
      number = Math.floor(Math.random() * 75) + 1;
    } while (usedNumbers.has(number));

    usedNumbers.add(number);

    const letter = number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O';
    const timeOffset = (duration / count) * i + (Math.random() * 1000 - 500); // Add some randomness

    calls.push({
      number,
      letter,
      timestamp: new Date(startTime.getTime() + timeOffset)
    });
  }

  return calls.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

/**
 * Generate random winners for a session
 */
const generateRandomWinners = (numberCallsCount: number): Winner[] => {
  const winners: Winner[] = [];
  const winnerCount = Math.floor(Math.random() * 3) + 1; // 1-3 winners
  const detectionMethods: Winner['detectionMethod'][] = ['manual', 'audience_interaction', 'statistical_outlier'];

  for (let i = 0; i < winnerCount; i++) {
    const numberIndex = Math.floor(Math.random() * Math.max(1, numberCallsCount - 5)) + 5; // Win after at least 5 numbers
    winners.push({
      numberIndex,
      detectionMethod: detectionMethods[Math.floor(Math.random() * detectionMethods.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000) // Random time in last hour
    });
  }

  return winners;
};

/**
 * Generate a random game session
 */
const generateRandomGameSession = (baseTime: Date, sessionIndex: number): GameSession => {
  const gameNames = [
    'Traditional Bingo',
    'Four Corners',
    'Blackout',
    'Railroad Tracks',
    'Letter X',
    'Diamond Pattern',
    'Postage Stamp',
    'Crazy T',
    'Survivor',
    'Double Bingo'
  ];

  const gameName = gameNames[Math.floor(Math.random() * gameNames.length)];
  const variant = Math.floor(Math.random() * 3);
  const freeSpace = Math.random() > 0.3; // 70% chance of free space
  const duration = (Math.random() * 1800 + 600) * 1000; // 10-40 minutes
  const numberCallsCount = Math.floor(Math.random() * 40) + 10; // 10-50 numbers

  const startTime = new Date(baseTime.getTime() - (sessionIndex * duration * 1.2));
  const endTime = new Date(startTime.getTime() + duration);

  const numbersCalled = generateRandomNumberCalls(numberCallsCount, startTime, duration);
  const winners = generateRandomWinners(numberCallsCount);

  const averageTimePerCall = numberCallsCount > 1 ? duration / numberCallsCount : 0;

  return {
    gameId: Math.floor(Math.random() * 10),
    gameName,
    variant,
    freeSpace,
    startTime,
    endTime,
    numbersCalled,
    totalNumbers: 75,
    sessionId: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    winners,
    statistics: {
      duration,
      numbersCalledCount: numberCallsCount,
      percentComplete: (numberCallsCount / 75) * 100,
      averageTimePerCall,
      gameCompletionStatus: 'complete'
    }
  };
};

/**
 * Generate sample session history (multiple games from today)
 */
export const generateSampleSessionHistory = (): GameSession[] => {
  const sessions: GameSession[] = [];
  const sessionCount = Math.floor(Math.random() * 8) + 5; // 5-12 sessions
  const now = new Date();

  for (let i = 0; i < sessionCount; i++) {
    sessions.push(generateRandomGameSession(now, i));
  }

  return sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

/**
 * Generate sample long-term statistics
 */
export const generateSampleLongTermStats = (): LongTermTelemetry => {
  const numberCallFrequency: { [key: number]: number } = {};

  // Generate realistic number frequencies (some numbers called more than others)
  for (let i = 1; i <= 75; i++) {
    numberCallFrequency[i] = Math.floor(Math.random() * 50) + 5; // 5-55 calls
  }

  const gameTypes = [
    'Traditional Bingo_v0',
    'Four Corners_v0',
    'Blackout_v0',
    'Railroad Tracks_v1',
    'Letter X_v0',
    'Diamond Pattern_v0'
  ];

  const gameTypeStats: LongTermTelemetry['gameTypeStats'] = {};

  gameTypes.forEach(gameType => {
    const gamesPlayed = Math.floor(Math.random() * 20) + 5;
    const avgDuration = (Math.random() * 1200 + 600) * 1000; // 10-30 minutes average

    gameTypeStats[gameType] = {
      totalTimePlayed: avgDuration * gamesPlayed,
      shortestGameTime: avgDuration * 0.6,
      longestGameTime: avgDuration * 1.8,
      averageGameTime: avgDuration,
      shortestCallRate: 0.5 + Math.random() * 0.3, // 0.5-0.8 numbers/second
      longestCallRate: 1.2 + Math.random() * 0.8, // 1.2-2.0 numbers/second
      averageCallRate: 0.8 + Math.random() * 0.4 // 0.8-1.2 numbers/second
    };
  });

  return {
    numberCallFrequency,
    totalGamesPlayed: Math.floor(Math.random() * 100) + 50, // 50-150 total games
    gameTypeStats,
    overallStats: {
      averageCallRate: 0.9 + Math.random() * 0.3, // 0.9-1.2 numbers/second
      shortestWinnerNumbers: Math.floor(Math.random() * 10) + 5, // 5-15 numbers
      longestWinnerNumbers: Math.floor(Math.random() * 20) + 55 // 55-75 numbers
    }
  };
};

/**
 * Generate sample tonight's session stats
 */
export const generateSampleTonightStats = (sessions: GameSession[]) => {
  const totalGames = sessions.length;
  const totalNumbersCalled = sessions.reduce((sum, session) => sum + session.numbersCalled.length, 0);
  const totalDuration = sessions.reduce((sum, session) => {
    return sum + (session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0);
  }, 0);
  const totalWinners = sessions.reduce((sum, session) => sum + session.winners.length, 0);

  return {
    totalGames,
    totalNumbersCalled,
    totalDuration,
    totalWinners,
    averageGameDuration: totalGames > 0 ? totalDuration / totalGames : 0,
    averageNumbersPerGame: totalGames > 0 ? totalNumbersCalled / totalGames : 0,
    sessions
  };
};
