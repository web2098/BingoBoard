import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './telemetry-page.module.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import {
  getSessionHistory,
  getTonightSessionStats,
  getLongTermStats,
  subscribeTelemetryUpdates
} from '../../utils/telemetry';
import {
  generateSampleSessionHistory,
  generateSampleLongTermStats,
  generateSampleTonightStats
} from '../../utils/sampleDataGenerator';
import { getSetting } from '../../utils/settings';
import games from '../../data/games';

interface TelemetryPageProps {}

const TelemetryPage: React.FC<TelemetryPageProps> = () => {
  const navigate = useNavigate();
  const [sessionHistory, setSessionHistory] = useState(getSessionHistory());
  const [tonightStats, setTonightStats] = useState(getTonightSessionStats());
  const [longTermStats, setLongTermStats] = useState(getLongTermStats());
  const [developerMode, setDeveloperMode] = useState(getSetting('developerMode', false));
  const [useSampleData, setUseSampleData] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  // Sample data states
  const [sampleSessionHistory, setSampleSessionHistory] = useState<any[]>([]);
  const [sampleTonightStats, setSampleTonightStats] = useState<any>(null);
  const [sampleLongTermStats, setSampleLongTermStats] = useState<any>(null);

  useEffect(() => {
    // Subscribe to telemetry updates instead of polling
    const unsubscribeTelemetry = subscribeTelemetryUpdates(() => {
      setSessionHistory(getSessionHistory());
      setTonightStats(getTonightSessionStats());
      setLongTermStats(getLongTermStats());
    });

    // Subscribe to settings changes for developer mode
    const handleSettingsChange = () => {
      setDeveloperMode(getSetting('developerMode', false));
    };

    window.addEventListener('bingoSettingsChanged', handleSettingsChange);

    return () => {
      unsubscribeTelemetry();
      window.removeEventListener('bingoSettingsChanged', handleSettingsChange);
    };
  }, []);

  // Generate sample data
  const generateSampleData = () => {
    const sampleSessions = generateSampleSessionHistory();
    const sampleLongTerm = generateSampleLongTermStats();
    const sampleTonight = generateSampleTonightStats(sampleSessions);

    setSampleSessionHistory(sampleSessions);
    setSampleLongTermStats(sampleLongTerm);
    setSampleTonightStats(sampleTonight);
    setUseSampleData(true);
  };

  // Use sample data or real data based on developer mode toggle
  const activeSessionHistory = useSampleData ? sampleSessionHistory : sessionHistory;
  const activeTonightStats = useSampleData ? sampleTonightStats : tonightStats;
  const activeLongTermStats = useSampleData ? sampleLongTermStats : longTermStats;

  // Navigation handlers
  const handleBackToGames = () => {
    navigate('/select-game');
  };

  // Toggle expanded game function
  const toggleGameExpansion = (gameIndex: number) => {
    setExpandedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameIndex)) {
        newSet.delete(gameIndex);
      } else {
        newSet.add(gameIndex);
      }
      return newSet;
    });
  };

  // Calculate statistics for three sets: Tonight, Tonight without Blackout, All Time
  const calculateNumberStats = useCallback((sessions: any[], isAllTime = false) => {
    const numberCounts: { [key: number]: number } = {};

    // Initialize all numbers 1-75 with count 0
    for (let i = 1; i <= 75; i++) {
      numberCounts[i] = 0;
    }

    // Count numbers from sessions
    sessions.forEach((session: any) => {
      session.numbersCalled.forEach((call: any) => {
        numberCounts[call.number]++;
      });
    });

    // Add long-term stats if this is all-time
    if (isAllTime && activeLongTermStats.numberCallFrequency) {
      Object.entries(activeLongTermStats.numberCallFrequency).forEach(([num, count]) => {
        numberCounts[parseInt(num)] = count as number;
      });
    }

    // Sort by count
    const sortedNumbers = Object.entries(numberCounts)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);

    const top10 = sortedNumbers.slice(0, 10);
    const bottom10 = sortedNumbers.slice(-10).reverse();
    const notCalled = sortedNumbers.filter((item: { number: number; count: number }) => item.count === 0);

    return { top10, bottom10, notCalled, numberCounts };
  }, [activeLongTermStats]);

  // Get tonight's sessions with memoization
  const tonightSessions = useMemo(() =>
    activeTonightStats?.sessions || [],
    [activeTonightStats]
  );

  const tonightWithoutBlackout = useMemo(() =>
    tonightSessions.filter((session: any) =>
      !session.gameName.toLowerCase().includes('blackout')
    ),
    [tonightSessions]
  );

  const allTimeSessions = useMemo(() =>
    activeSessionHistory,
    [activeSessionHistory]
  );

  // Calculate stats for all three sets with memoization
  const tonightStats_calc = useMemo(() =>
    calculateNumberStats(tonightSessions),
    [tonightSessions, calculateNumberStats]
  );

  const tonightWithoutBlackoutStats = useMemo(() =>
    calculateNumberStats(tonightWithoutBlackout),
    [tonightWithoutBlackout, calculateNumberStats]
  );

  const allTimeStats_calc = useMemo(() =>
    calculateNumberStats(allTimeSessions, true),
    [allTimeSessions, calculateNumberStats]
  );

  // Format duration helper
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Page buttons for sidebar
  const pageButtons = [
    {
      id: 'back-to-games',
      label: 'Back to Games',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
      ),
      onClick: handleBackToGames,
      className: 'back-button'
    },
    // Add sample data button when developer mode is enabled
    ...(developerMode ? [{
      id: 'toggle-sample-data',
      label: useSampleData ? 'Real Data' : 'Sample Data',
      icon: useSampleData ? (
        // Real data icon (database)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
      ) : (
        // Sample data icon (test tube/beaker)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 2v11l3 3 3-3V2"></path>
          <path d="M7 9h6"></path>
        </svg>
      ),
      onClick: () => {
        if (useSampleData) {
          setUseSampleData(false);
        } else {
          generateSampleData();
        }
      },
      className: useSampleData ? 'sample-data-button active' : 'sample-data-button'
    }] : [])
  ];

  // Number heat map component
  const NumberHeatMap = ({ numberCounts }: { numberCounts: { [key: number]: number } }) => {
    const maxCount = Math.max(...Object.values(numberCounts));
    const letters = ['B', 'I', 'N', 'G', 'O'];    // Get color settings for each letter and highlight color
    const letterColors = {
      'B': getSetting('bLetterColor', '#000000'),
      'I': getSetting('iLetterColor', '#000000'),
      'N': getSetting('nLetterColor', '#000000'),
      'G': getSetting('gLetterColor', '#000000'),
      'O': getSetting('oLetterColor', '#000000')
    };
    const highlightColor = getSetting('boardHighlightColor', '#42a5f5');

    return (
      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapGridRows}>
          {letters.map((letter, letterIndex) => (
            <div key={letter} className={styles.heatmapRow}>
              <div
                className={styles.heatmapLetterRow}
                style={{ backgroundColor: letterColors[letter as keyof typeof letterColors] }}
              >
                {letter}
              </div>
              <div className={styles.heatmapNumbersRow}>
                {Array.from({ length: 15 }, (_, i) => {
                  const number = letterIndex * 15 + i + 1;
                  const count = numberCounts[number] || 0;
                  const intensity = maxCount > 0 ? count / maxCount : 0;

                  return (
                    <div
                      key={number}
                      className={styles.heatmapCell}
                      title={`${number}: Called ${count} times`}
                    >
                      <div
                        className={styles.heatmapFill}
                        style={{
                          height: `${intensity * 100}%`,
                          background: highlightColor
                        }}
                      />
                      <div className={styles.heatmapContent}>
                        <div className={styles.heatmapNumber}>
                          {number}
                        </div>
                        <div className={styles.heatmapCount}>
                          {count}
                        </div>
                        {/* White text overlay that's masked by the fill */}
                        <div
                          className={styles.heatmapTextOverlay}
                          style={{
                            WebkitMask: `linear-gradient(to top, black ${intensity * 100}%, transparent ${intensity * 100}%)`,
                            mask: `linear-gradient(to top, black ${intensity * 100}%, transparent ${intensity * 100}%)`
                          }}
                        >
                          <div className={styles.heatmapNumberWhite}>
                            {number}
                          </div>
                          <div className={styles.heatmapCountWhite}>
                            {count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Number list component
  const NumberList = ({ numbers, title }: { numbers: Array<{ number: number, count: number }>, title: string }) => (
    <div className={styles.numberList}>
      <h4>{title}</h4>
      <div className={styles.numberTextList}>
        {numbers.map(({ number, count }: { number: number, count: number }, index: number) => (
          <span key={number}>
            {number}({count}){index < numbers.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.telemetryPage}>
        <SidebarWithMenu
          currentPage="telemetry"
          pageButtons={pageButtons}
        />

        <div className={styles.telemetryContent}>
        {/* Tonight's Stats and Games Side by Side */}
        <div className={styles.tonightSection}>
          {/* Left Side - Summary Cards and Tonight's Numbers */}
          <div className={styles.tonightNumbers}>
            {/* Summary Stats - 2x2 Grid */}
            <div className={styles.summarySectionEmbedded}>
              <div className={styles.summaryCard}>
                <h3>Games This Session</h3>
                <div className={styles.statNumber}>{activeTonightStats?.totalGames || 0}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Games All Time</h3>
                <div className={styles.statNumber}>{activeLongTermStats.totalGamesPlayed}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Numbers Called All Time</h3>
                <div className={styles.statNumber}>{
                  activeLongTermStats.numberCallFrequency ?
                    Object.values(activeLongTermStats.numberCallFrequency).reduce((sum: number, count: unknown) => sum + (count as number), 0) : 0
                }</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Numbers Called Tonight</h3>
                <div className={styles.statNumber}>{activeTonightStats?.totalNumbersCalled || 0}</div>
              </div>
            </div>

            <div className={styles.statsGroup}>
              <h3>Tonight's Numbers</h3>
              <div className={styles.statsRow}>
                <NumberList numbers={tonightStats_calc.top10} title="Top 10 Called" />
                <NumberList numbers={tonightStats_calc.bottom10} title="Bottom 10 Called" />
                {tonightStats_calc.notCalled.length > 0 && (
                  <NumberList numbers={tonightStats_calc.notCalled} title="Not Called" />
                )}
              </div>
            </div>

            <div className={styles.statsGroup}>
              <h3>Tonight's Numbers (Excluding Blackout Games)</h3>
              <div className={styles.statsRow}>
                <NumberList numbers={tonightWithoutBlackoutStats.top10} title="Top 10 Called" />
                <NumberList numbers={tonightWithoutBlackoutStats.bottom10} title="Bottom 10 Called" />
                {tonightWithoutBlackoutStats.notCalled.length > 0 && (
                  <NumberList numbers={tonightWithoutBlackoutStats.notCalled} title="Not Called" />
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Games Table and Tonight's Heatmap */}
          <div className={styles.tonightGames}>
            <div className={styles.gamesTableContainer}>
              <table className={styles.gamesTable}>
                <thead>
                  <tr>
                    <th>Game Name</th>
                    <th>Game Time</th>
                    <th>Numbers/Second</th>
                    <th>Winners</th>
                    <th>Fastest Win</th>
                    <th>Slowest Win</th>
                  </tr>
                </thead>
                <tbody>
                  {tonightSessions.map((session: any, index: number) => {
                    const duration = session.endTime ?
                      session.endTime.getTime() - session.startTime.getTime() : 0;
                    const numbersPerSecond = duration > 0 ?
                      (session.numbersCalled.length / (duration / 1000)).toFixed(2) : '0';

                    const winners = session.winners || [];
                    // Sort winners by numberIndex (earliest to latest)
                    const sortedWinners = [...winners].sort((a: any, b: any) => a.numberIndex - b.numberIndex);
                    const fastestWin = winners.length > 0 ?
                      Math.min(...winners.map((w: any) => w.numberIndex + 1)) : null;
                    const slowestWin = winners.length > 0 ?
                      Math.max(...winners.map((w: any) => w.numberIndex + 1)) : null;

                    return (
                      <tr key={session.sessionId}>
                        <td>{session.gameName}</td>
                        <td>{formatDuration(duration)}</td>
                        <td>{numbersPerSecond}</td>
                        <td>
                          {sortedWinners.length > 0 ? (
                            <div className={styles.winnersList}>
                              {sortedWinners.map((winner: any, i: number) => (
                                <div key={i} className={styles.winnerItem}>
                                  <span>#{winner.numberIndex + 1}</span>
                                  <span className={styles.detectionMethod}>({winner.detectionMethod})</span>
                                </div>
                              ))}
                            </div>
                          ) : 'No winners'}
                        </td>
                        <td>
                          {fastestWin ? (
                            <div>
                              <div>{fastestWin} numbers</div>
                              <div className={styles.winDate}>{session.startTime.toLocaleDateString()}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          {slowestWin ? (
                            <div>
                              <div>{slowestWin} numbers</div>
                              <div className={styles.winDate}>{session.startTime.toLocaleDateString()}</div>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tonight's Heatmap moved here */}
            <div style={{ marginTop: '1rem' }}>
              <NumberHeatMap
                numberCounts={tonightStats_calc.numberCounts}
              />
            </div>
          </div>
        </div>

        {/* Heat Maps */}
        <div className={styles.heatmapsSection}>
          <div className={styles.sectionHeader}>
            <h2>All Time Statistics</h2>
          </div>
          <div className={styles.alltimeSection}>
            {/* Top Section - All Time Numbers and Heatmap Side by Side */}
            <div className={styles.alltimeNumbersSection}>
              <div className={styles.alltimeNumbers}>
                <div className={styles.statsGroup}>
                  <h3>All Time Numbers</h3>
                  <div className={styles.statsRow}>
                    <NumberList numbers={allTimeStats_calc.top10} title="Top 10 Called" />
                    <NumberList numbers={allTimeStats_calc.bottom10} title="Bottom 10 Called" />
                    {allTimeStats_calc.notCalled.length > 0 && (
                      <NumberList numbers={allTimeStats_calc.notCalled} title="Not Called" />
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.alltimeHeatmap}>
                <NumberHeatMap
                  numberCounts={allTimeStats_calc.numberCounts}
                />
              </div>
            </div>

            {/* Bottom Section - All Games Table (Full Width) */}
            <div className={styles.alltimeGamesFull}>
              <div className={styles.gamesTableContainer}>
                <table className={styles.gamesTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      <th>Game Name</th>
                      <th>Times Played</th>
                      <th>Avg Game Time</th>
                      <th>Avg Numbers/Second</th>
                      <th>Total Numbers Called</th>
                      <th>Fastest Win</th>
                      <th>Slowest Win</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games().map((game: any, gameIndex: number) => {
                      // Calculate aggregate statistics for all variants of this game
                      const allGameSessions = activeSessionHistory.filter((session: any) =>
                        session.gameName === game.name
                      );

                      const isExpanded = expandedGames.has(gameIndex);
                      const hasVariants = game.variants.length > 1;

                      // Aggregate stats for the main game row
                      const totalTimesPlayed = allGameSessions.length;
                      const totalDuration = allGameSessions.reduce((sum: number, session: any) => {
                        const duration = session.endTime ?
                          session.endTime.getTime() - session.startTime.getTime() : 0;
                        return sum + duration;
                      }, 0);
                      const avgGameTime = totalTimesPlayed > 0 ? totalDuration / totalTimesPlayed : 0;

                      const totalNumbersCalled = allGameSessions.reduce((sum: number, session: any) =>
                        sum + session.numbersCalled.length, 0
                      );

                      const avgNumbersPerSecond = totalDuration > 0 ?
                        (totalNumbersCalled / (totalDuration / 1000)) : 0;

                      // Calculate fastest and slowest wins across all variants
                      const allWinners = allGameSessions.flatMap((session: any) => session.winners || []);
                      const fastestWin = allWinners.length > 0 ?
                        Math.min(...allWinners.map((w: any) => w.numberIndex + 1)) : null;
                      const slowestWin = allWinners.length > 0 ?
                        Math.max(...allWinners.map((w: any) => w.numberIndex + 1)) : null;

                      return (
                        <React.Fragment key={gameIndex}>
                          {/* Main game row */}
                          <tr
                            className={`game-row ${hasVariants ? 'expandable' : ''}`}
                            onClick={() => hasVariants && toggleGameExpansion(gameIndex)}
                          >
                            <td style={{ textAlign: 'center' }}>
                              {hasVariants && (
                                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                  ▶
                                </span>
                              )}
                            </td>
                            <td>
                              <div className={styles.gameName}>
                                {game.name}
                              </div>
                            </td>
                            <td>
                              {totalTimesPlayed > 0 ? totalTimesPlayed : <span className={styles.naValue}>N/A</span>}
                            </td>
                            <td>
                              {totalTimesPlayed > 0 ? formatDuration(avgGameTime) : <span className={styles.naValue}>N/A</span>}
                            </td>
                            <td>
                              {totalTimesPlayed > 0 ? avgNumbersPerSecond.toFixed(2) : <span className={styles.naValue}>N/A</span>}
                            </td>
                            <td>
                              {totalTimesPlayed > 0 ? totalNumbersCalled : <span className={styles.naValue}>N/A</span>}
                            </td>
                            <td>
                              {fastestWin ? (
                                <div>{fastestWin} numbers</div>
                              ) : <span className={styles.naValue}>N/A</span>}
                            </td>
                            <td>
                              {slowestWin ? (
                                <div>{slowestWin} numbers</div>
                              ) : <span className={styles.naValue}>N/A</span>}
                            </td>
                          </tr>

                          {/* Variant rows (shown when expanded) */}
                          {isExpanded && hasVariants && game.variants.map((variant: any, variantIndex: number) => {
                            // Find sessions for this specific variant
                            const variantSessions = activeSessionHistory.filter((session: any) =>
                              session.gameName === game.name && session.variant === variantIndex
                            );

                            if (variantSessions.length === 0) {
                              return (
                                <tr key={`${gameIndex}-${variantIndex}`} className={styles.variantRow}>
                                  <td></td>
                                  <td className={styles.variantName}>
                                    └ Variant {variantIndex + 1}
                                  </td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                  <td><span className={styles.naValue}>N/A</span></td>
                                </tr>
                              );
                            }

                            // Calculate statistics for this specific variant
                            const timesPlayed = variantSessions.length;
                            const totalDuration = variantSessions.reduce((sum: number, session: any) => {
                              const duration = session.endTime ?
                                session.endTime.getTime() - session.startTime.getTime() : 0;
                              return sum + duration;
                            }, 0);
                            const avgGameTime = totalDuration / timesPlayed;

                            const totalNumbersCalled = variantSessions.reduce((sum: number, session: any) =>
                              sum + session.numbersCalled.length, 0
                            );

                            const avgNumbersPerSecond = totalDuration > 0 ?
                              (totalNumbersCalled / (totalDuration / 1000)) : 0;

                            // Calculate fastest and slowest wins for this variant
                            const variantWinners = variantSessions.flatMap((session: any) => session.winners || []);
                            const variantFastestWin = variantWinners.length > 0 ?
                              Math.min(...variantWinners.map((w: any) => w.numberIndex + 1)) : null;
                            const variantSlowestWin = variantWinners.length > 0 ?
                              Math.max(...variantWinners.map((w: any) => w.numberIndex + 1)) : null;

                            return (
                              <tr key={`${gameIndex}-${variantIndex}`} className={styles.variantRow}>
                                <td></td>
                                <td className={styles.variantName}>
                                  └ Variant {variantIndex + 1}
                                </td>
                                <td>{timesPlayed}</td>
                                <td>{formatDuration(avgGameTime)}</td>
                                <td>{avgNumbersPerSecond.toFixed(2)}</td>
                                <td>{totalNumbersCalled}</td>
                                <td>
                                  {variantFastestWin ? (
                                    <div>{variantFastestWin} numbers</div>
                                  ) : <span className={styles.naValue}>N/A</span>}
                                </td>
                                <td>
                                  {variantSlowestWin ? (
                                    <div>{variantSlowestWin} numbers</div>
                                  ) : <span className={styles.naValue}>N/A</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className={styles.copyright}>
      <p>© 2025 Eric Gressman. All rights reserved.</p>
    </div>
    </>
  );
};

export default TelemetryPage;
