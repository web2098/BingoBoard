export interface CustomGame {
  id: string;
  name: string;
  description: string;
  length: 'Fast' | 'Average' | 'Slow';
  allowFreeSpace: boolean;
  allowRotations: boolean;
  exactPattern: boolean;
  pattern: number[][];
  patterns: number[][][];
  createdAt: string;
}

const STORAGE_KEY = 'customBingoGames';

export const getCustomGames = (): CustomGame[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export const saveCustomGame = (game: CustomGame): void => {
  const games = getCustomGames().filter(existing => existing.id !== game.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...games, game]));
};

export const mergeCustomGames = (games: CustomGame[]): void => {
  const existing = getCustomGames();
  const merged = [...existing];
  games.forEach(game => {
    const index = merged.findIndex(existingGame => existingGame.id === game.id);
    if (index >= 0) merged[index] = game;
    else merged.push(game);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

const normalize = (pattern: number[][]) => {
  const minRow = Math.min(...pattern.map(([row]) => row));
  const minCol = Math.min(...pattern.map(([, col]) => col));
  return pattern.map(([row, col]) => [row - minRow, col - minCol]).sort(([aRow, aCol], [bRow, bCol]) => aRow - bRow || aCol - bCol);
};

const rotate = (pattern: number[][]) => normalize(pattern.map(([row, col]) => [col, 4 - row]));
const rotateInPlace = (pattern: number[][]) => pattern.map(([row, col]) => [col, 4 - row]).sort(([aRow, aCol], [bRow, bCol]) => aRow - bRow || aCol - bCol);

export const getPatternRotations = (pattern: number[][], allowRotations: boolean): number[][][] => {
  if (pattern.length === 0) return [];
  const shapes = [normalize(pattern)];
  if (allowRotations) {
    for (let index = 0; index < 3; index++) shapes.push(rotate(shapes[shapes.length - 1]));
  }
  return Array.from(new Map(shapes.map(shape => [JSON.stringify(shape), shape])).values());
};

export const getPatternPermutations = (pattern: number[][], allowRotations: boolean, exactPattern = false): number[][][] => {
  if (pattern.length === 0) return [];
  if (exactPattern) {
    const orientations = [pattern];
    if (allowRotations) {
      for (let index = 0; index < 3; index++) orientations.push(rotateInPlace(orientations[orientations.length - 1]));
    }
    return Array.from(new Map(orientations.map(orientation => [JSON.stringify(orientation), orientation])).values());
  }
  const uniqueShapes = new Map(getPatternRotations(pattern, allowRotations).map(shape => [JSON.stringify(shape), shape]));
  const permutations = new Map<string, number[][]>();
  uniqueShapes.forEach(shape => {
    const maxRow = Math.max(...shape.map(([row]) => row));
    const maxCol = Math.max(...shape.map(([, col]) => col));
    for (let rowOffset = 0; rowOffset <= 4 - maxRow; rowOffset++) {
      for (let colOffset = 0; colOffset <= 4 - maxCol; colOffset++) {
        const placement = shape.map(([row, col]) => [row + rowOffset, col + colOffset]);
        permutations.set(JSON.stringify(placement), placement);
      }
    }
  });
  return Array.from(permutations.values());
};

export const asGameDefinition = (game: CustomGame) => ({
  name: game.name,
  tags: ['Custom'],
  variants: [{
    rules: game.description || 'Match the highlighted pattern',
    length: game.length || 'Custom',
    dynamicFreeSpace: game.allowFreeSpace,
    freeSpace: game.allowFreeSpace,
    boards: [() => game.patterns?.length ? game.patterns : getPatternPermutations(game.pattern, game.allowRotations, game.exactPattern)]
  }]
});
