import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import { getSetting } from '../../utils/settings';
import { CustomGame, getCustomGames, getPatternPermutations, mergeCustomGames, saveCustomGame } from '../../utils/customGames';
import styles from './create-game-page.module.css';

const emptyPattern = () => Array.from({ length: 5 }, () => Array(5).fill(false));

const CreateGamePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [length, setLength] = useState<'Fast' | 'Average' | 'Slow'>('Average');
  const [allowFreeSpace, setAllowFreeSpace] = useState(true);
  const [allowRotations, setAllowRotations] = useState(true);
  const [exactPattern, setExactPattern] = useState(false);
  const [pattern, setPattern] = useState<boolean[][]>(emptyPattern);
  const [status, setStatus] = useState('');
  const [savedGames, setSavedGames] = useState<CustomGame[]>(() => getCustomGames());
  const [editingId, setEditingId] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const selectedCells = useMemo(() => pattern.flatMap((row, rowIndex) => row.flatMap((selected, colIndex) => selected ? [[rowIndex, colIndex]] : [])) as number[][], [pattern]);
  const permutations = useMemo(() => getPatternPermutations(selectedCells, allowRotations, exactPattern), [selectedCells, allowRotations, exactPattern]);
  const previewPattern = permutations[previewIndex % permutations.length] || [];

  useEffect(() => {
    const serverUrl = getSetting('serverUrl', '').trim();
    const authToken = getSetting('serverAuthToken', '').trim();
    if (!serverUrl || !authToken) return;
    const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    fetch(`${httpUrl}/host/saved-games`, { headers: { Authorization: authToken } })
      .then(response => response.ok ? response.json() : Promise.reject(response.status))
      .then(payload => {
        mergeCustomGames(Array.isArray(payload) ? payload : payload.games || []);
        setSavedGames(getCustomGames());
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPreviewIndex(0);
    if (permutations.length < 2) return;
    const interval = window.setInterval(() => setPreviewIndex(index => (index + 1) % permutations.length), Math.max(1, getSetting('patternRotationInterval', 3)) * 1000);
    return () => window.clearInterval(interval);
  }, [permutations.length]);

  const toggleCell = (row: number, col: number) => setPattern(current => current.map((cells, rowIndex) => cells.map((selected, colIndex) => rowIndex === row && colIndex === col ? !selected : selected)));
  const loadGame = (id: string) => {
    setEditingId(id);
    if (!id) {
      setName(''); setDescription(''); setLength('Average'); setAllowFreeSpace(true); setAllowRotations(true); setExactPattern(false); setPattern(emptyPattern()); setStatus('');
      return;
    }
    const game = savedGames.find(savedGame => savedGame.id === id);
    if (!game) return;
    setName(game.name); setDescription(game.description); setLength(game.length || 'Average'); setAllowFreeSpace(game.allowFreeSpace); setAllowRotations(game.allowRotations); setExactPattern(game.exactPattern || false);
    setPattern(Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) => game.pattern.some(([patternRow, patternCol]) => patternRow === row && patternCol === col))));
    setStatus(`Editing ${game.name}.`);
  };
  const handleNameChange = (value: string) => {
    setName(value);
    const matchingGame = savedGames.find(savedGame => savedGame.name.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase());
    if (matchingGame && matchingGame.id !== editingId) {
      loadGame(matchingGame.id);
    }
  };
  const save = async () => {
    if (!name.trim() || selectedCells.length === 0) {
      setStatus('Add a title and select at least one square.');
      return;
    }
    const matchingGame = savedGames.find(savedGame => savedGame.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase());
    if (matchingGame && matchingGame.id !== editingId) {
      loadGame(matchingGame.id);
      return;
    }
    const existingGame = savedGames.find(savedGame => savedGame.id === editingId);
    const game: CustomGame = { id: editingId || crypto.randomUUID(), name: name.trim(), description: description.trim(), length, allowFreeSpace, allowRotations, exactPattern, pattern: selectedCells, patterns: permutations, createdAt: existingGame?.createdAt || new Date().toISOString() };
    saveCustomGame(game);
    setSavedGames(getCustomGames());
    setEditingId(game.id);
    setStatus('Saved to this browser.');
    const serverUrl = getSetting('serverUrl', '').trim();
    const authToken = getSetting('serverAuthToken', '').trim();
    if (serverUrl && authToken) {
      const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      try {
        const response = await fetch(`${httpUrl}/host/add-game`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authToken }, body: JSON.stringify(game) });
        setStatus(response.ok ? 'Saved to this browser and your bingo account.' : 'Saved locally; server sync was not accepted.');
      } catch { setStatus('Saved locally; server sync is unavailable.'); }
    }
  };

  return <div className={styles.page}>
    <SidebarWithMenu currentPage="create-game" />
    <main className={styles.content}>
      <header><h1>Create Game</h1><p>Design a winning pattern. Every valid position is generated automatically.</p></header>
      <div className={styles.workspace}>
        <section className={styles.editor}>
          <div className={styles.form}>
          <label>Saved custom game<select value={editingId} onChange={event => loadGame(event.target.value)}><option value="">Create a new game</option>{savedGames.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
          <label>Title<input value={name} onChange={event => handleNameChange(event.target.value)} placeholder="My custom game" maxLength={80} /></label>
          <label>Description<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="How players win" maxLength={240} /></label>
          <label>Estimated length<select value={length} onChange={event => setLength(event.target.value as 'Fast' | 'Average' | 'Slow')}><option value="Fast">Fast</option><option value="Average">Average</option><option value="Slow">Slow</option></select></label>
          <label className={styles.toggle}><input type="checkbox" checked={allowFreeSpace} onChange={event => setAllowFreeSpace(event.target.checked)} /> Allow free space</label>
          <label className={styles.toggle}><input type="checkbox" checked={allowRotations} onChange={event => setAllowRotations(event.target.checked)} /> Include rotations</label>
          <label className={styles.toggle}><input type="checkbox" checked={exactPattern} onChange={event => setExactPattern(event.target.checked)} /> Exact pattern (no rotations or repositioning)</label>
          <div className={styles.actions}><button type="button" onClick={() => setPattern(emptyPattern)}>Clear</button><button type="button" onClick={save}>Save Game</button><button type="button" onClick={() => navigate('/select-game')}>Back to Games</button></div>
          {status && <p className={styles.status}>{status}</p>}
          </div>
          <div className={styles.patternPanel}><h2>Winning pattern</h2><div className={styles.grid}>{pattern.map((row, rowIndex) => row.map((selected, colIndex) => { const isFreeSpace = rowIndex === 2 && colIndex === 2 && allowFreeSpace; return <button key={`${rowIndex}-${colIndex}`} type="button" className={`${selected ? styles.selected : ''} ${isFreeSpace ? styles.freeCell : ''}`} onClick={() => toggleCell(rowIndex, colIndex)} aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}>{isFreeSpace ? 'FREE' : 'BINGO'[colIndex]}</button>; }))}</div><p>{selectedCells.length} squares selected · {permutations.length} valid placements</p></div>
        </section>
        <section className={styles.rotationSection}><h2>Live placement preview</h2><p>{exactPattern ? `Exact pattern mode: ${allowRotations ? 'in-place rotations are included' : 'the selected position is used as drawn'}.` : `Cycles through all ${permutations.length} valid positions, including rotations and translations.`}</p><div className={styles.rotationList}>{permutations.length === 0 ? <p>Select squares to preview valid placements.</p> : <div className={styles.rotationCard}><strong>{exactPattern ? (permutations.length > 1 ? `Rotation ${previewIndex * 90}°` : 'Exact pattern') : `Placement ${previewIndex + 1} of ${permutations.length}`}</strong><div className={styles.rotationGrid}>{Array.from({ length: 25 }, (_, cellIndex) => { const row = Math.floor(cellIndex / 5); const col = cellIndex % 5; const selected = previewPattern.some(([patternRow, patternCol]) => patternRow === row && patternCol === col); return <span key={cellIndex} className={selected ? styles.previewSelected : ''}>{row === 2 && col === 2 && allowFreeSpace ? 'FREE' : 'BINGO'[col]}</span>; })}</div></div>}</div></section>
      </div>
    </main>
  </div>;
};

export default CreateGamePage;
