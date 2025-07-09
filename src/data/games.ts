// Reusable Fisher-Yates shuffle function for randomizing arrays
function shuffleArray<T>(array: T[]): T[] {
    // Create a copy to avoid mutating the original array
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

// Reusable rotation function for generating all single bingo combinations
function generateSingleBoardRotations(freeSpace: boolean, shuffle: boolean = true, previewMode: boolean = false) {
    const rotations = [
        [[0,0],[1,1],[2,2],[3,3],[4,4]], // Main diagonal
        [[0,4],[1,3],[2,2],[3,1],[4,0]], // Anti-diagonal
        [[0,0],[0,1],[0,2],[0,3],[0,4]], // Top row
        [[1,0],[1,1],[1,2],[1,3],[1,4]], // Second row
        [[2,0],[2,1],[2,2],[2,3],[2,4]], // Middle row
        [[3,0],[3,1],[3,2],[3,3],[3,4]], // Fourth row
        [[4,0],[4,1],[4,2],[4,3],[4,4]], // Bottom row
        [[0,0],[1,0],[2,0],[3,0],[4,0]], // Left column
        [[0,1],[1,1],[2,1],[3,1],[4,1]], // Second column
        [[0,2],[1,2],[2,2],[3,2],[4,2]], // Middle column
        [[0,3],[1,3],[2,3],[3,3],[4,3]], // Fourth column
        [[0,4],[1,4],[2,4],[3,4],[4,4]]  // Right column
    ];

    // If free space is disabled, filter out patterns that include the center square
    let result = rotations;
    if (!freeSpace) {
        result = rotations.filter(pattern =>
            !pattern.some(coord => coord[0] === 2 && coord[1] === 2)
        );
    }

    // For preview mode, always return the first pattern (main diagonal or first valid pattern)
    if (previewMode) {
        return [result[0]];
    }

    return shuffle ? shuffleArray(result) : result;
}

// Reusable rotation function for generating all double bingo combinations
function generateDoubleBingoRotations(freeSpace: boolean, previewMode: boolean = false) {
    const baseBingoPatterns = generateSingleBoardRotations(freeSpace, false, false); // Don't shuffle here, we'll shuffle the final result

    // Filter out patterns with center if freeSpace is disabled
    let availablePatterns = baseBingoPatterns;
    if (!freeSpace) {
        availablePatterns = baseBingoPatterns.filter(pattern =>
            !pattern.some(coord => coord[0] === 2 && coord[1] === 2)
        );
    }

    // For preview mode, return a consistent double bingo pattern
    if (previewMode) {
        // Use the first two patterns (main diagonal + anti-diagonal)
        const combinedPattern = [...availablePatterns[0], ...availablePatterns[2]];
        return [combinedPattern];
    }

    // Generate all unique pairs of bingo patterns (no duplicates)
    const doubleBingoPatterns = [];
    for (let i = 0; i < availablePatterns.length; i++) {
        for (let j = i + 1; j < availablePatterns.length; j++) {
            // Combine two different bingo patterns into one
            const combinedPattern = [...availablePatterns[i], ...availablePatterns[j]];
            doubleBingoPatterns.push(combinedPattern);
        }
    }

    // Randomize the order using the reusable shuffle function
    return shuffleArray(doubleBingoPatterns);
}

function generateTinyXBingoRotations(freeSpace: boolean = true, shuffle: boolean = true,previewMode: boolean = false) {
    let patterns = [
    ];

    // A Tiny x is defined by the top left item being some where in the first 3 rows, and 3 columns
    //Then from that TL it has two spots diagonally down and then one spot 2 to the right and one spot 2 down
    function createTinyX( topLeft: number[] ){
        const row = topLeft[0];
        const col = topLeft[1];

        return [
            [row, col],
            [row, col + 2],
            [row + 1, col + 1],
            [row + 2, col],
            [row + 2, col + 2]
        ];
    }

    for( let y = 0; y < 3; y++ ){
        for( let x = 0; x < 3; x++ ){
            patterns.push(createTinyX([y, x]));
        }
    }

    if( previewMode) {
        return [patterns[0]];
    }

    let result = patterns;
    if (!freeSpace) {
        result = patterns.filter(pattern =>
            !pattern.some(coord => coord[0] === 2 && coord[1] === 2)
        );
    }

    if (shuffle)
    {
        return shuffleArray(result);
    }
    return result;
}

function generateSmallSquarePattern(freeSpace: boolean = true, shuffle: boolean = true,previewMode: boolean = false) {
    let patterns = [
    ];

    // A SmallSquare Pattern is defined by the top left item being some where in the first 3 rows, and 3 columns
    //Then from that TL it has two spots right and two spots down, 1 spot 2 to the right and 1 down, 1 spot 2 down and 1 to the right
    //and one spot 2 down and 2 to the right
    function createSmallSquare( topLeft: number[] ){
        const row = topLeft[0];
        const col = topLeft[1];

        return [
            [row, col],
            [row, col + 1],
            [row, col + 2],
            [row + 1, col],
            [row + 2, col],
            [row + 2, col + 1],
            [row + 1, col + 2],
            [row + 2, col + 2]
        ];
    }

    for( let y = 0; y < 3; y++ ){
        for( let x = 0; x < 3; x++ ){
            patterns.push(createSmallSquare([y, x]));
        }
    }

    if( previewMode) {
        return [patterns[0]];
    }

    let result = patterns;
    if (!freeSpace) {
        result = patterns.filter(pattern =>
            !pattern.some(coord => coord[0] === 2 && coord[1] === 2)
        );
    }

    if (shuffle)
    {
        return shuffleArray(result);
    }
    return result;
}

function generateCandyCanePattern(freeSpace: boolean = true, previewMode: boolean = false)
{
    if( !freeSpace || previewMode ) {
        return [[
            [0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]
        ]];
    }

    return [
        [[0,0],[0,1],[0,2],[1,0],[1,2],[2,2],[3,2],[4,2]],
        [[0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]],
        [[0,2],[0,3],[1,2],[0,4],[1,4],[2,4],[3,4],[4,4]]
    ];
}

function bingo(){
    return {
        name: "Normal Bingo",
        variants:[
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateSingleBoardRotations(freeSpace, true, previewMode)
                ],
                rules: 'Must get 5 in a row, column, or diagonal',
                length: "Fast",
                dynamicFreeSpace: true
            },
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => {
                        const rotations = [
                            [[0,0],[1,1],[2,2],[3,3],[4,4]], // Main diagonal
                            [[0,4],[1,3],[2,2],[3,1],[4,0]], // Anti-diagonal
                            [[0,0],[0,1],[0,2],[0,3],[0,4]], // Top row
                            [[1,0],[1,1],[1,2],[1,3],[1,4]], // Second row
                            [[2,0],[2,1],[2,2],[2,3],[2,4]], // Middle row
                            [[3,0],[3,1],[3,2],[3,3],[3,4]], // Fourth row
                            [[4,0],[4,1],[4,2],[4,3],[4,4]], // Bottom row
                            [[0,0],[1,0],[2,0],[3,0],[4,0]], // Left column
                            [[0,1],[1,1],[2,1],[3,1],[4,1]], // Second column
                            [[0,2],[1,2],[2,2],[3,2],[4,2]], // Middle column
                            [[0,3],[1,3],[2,3],[3,3],[4,3]], // Fourth column
                            [[0,4],[1,4],[2,4],[3,4],[4,4]],  // Right column
                            [[0,0],[0,4],[2,2],[4,0],[4,4]], // 4 corners
                        ];

                        // For preview mode, return the main diagonal
                        if (previewMode) {
                            return freeSpace ? [rotations[0]] : [[[0,0],[1,1],[3,3],[4,4]]]; // Main diagonal without center
                        }

                        // If free space is disabled, filter out patterns that include the center square
                        if (!freeSpace) {
                            const filteredRotations = rotations.filter(pattern =>
                                !pattern.some(coord => coord[0] === 2 && coord[1] === 2)
                            );
                            return shuffleArray(filteredRotations);
                        }

                        return shuffleArray(rotations);
                    }
                ],
                rules: 'Must get 5 in a row, column, or diagonal or 4 corners + free space',
                length: "Fast",
                freeSpace: true
            }
        ]
    }
}

function doubleBingo(){
    return {
        name: "Double Bingo",
        variants:[
            {
                rules: 'Must get a two bingos on one board',
                op: "none",
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateDoubleBingoRotations(freeSpace, previewMode)
                ],
                length: "Average",
                dynamicFreeSpace: true
            },
            {
                rules: 'Must get a one bingo on both boards',
                op: "and",
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateSingleBoardRotations(freeSpace, true, previewMode),
                    (freeSpace: boolean, previewMode: boolean = false) => generateSingleBoardRotations(freeSpace, true, previewMode)
                ],
                length: "Average",
                dynamicFreeSpace: true
            },
            {
                rules: 'Must get two bingos on one or both boards',
                op: "or",
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => {
                        // This board can have either single bingo or double bingo patterns
                        const singlePatterns = generateSingleBoardRotations(freeSpace, true, previewMode);
                        const doublePatterns = generateDoubleBingoRotations(freeSpace, previewMode);

                        if (previewMode) {
                            // For preview, show a double bingo pattern on the left board
                            return doublePatterns;
                        }

                        // Combine both single and double patterns, but favor double patterns (2:1 ratio)
                        const combinedPatterns = [...doublePatterns, ...singlePatterns];
                        return shuffleArray(combinedPatterns);
                    },
                    (freeSpace: boolean, previewMode: boolean = false) => {
                        // This board can have either single bingo or double bingo patterns
                        const singlePatterns = generateSingleBoardRotations(freeSpace, true, previewMode);
                        const doublePatterns = generateDoubleBingoRotations(freeSpace, previewMode);

                        if (previewMode) {
                            // For preview, show a single bingo pattern on the right board
                            return singlePatterns;
                        }

                        // Combine both single and double patterns, but favor single patterns (2:1 ratio)
                        const combinedPatterns = [...singlePatterns, ...doublePatterns];
                        return shuffleArray(combinedPatterns);
                    }
                ],
                length: "Average",
                dynamicFreeSpace: true,
                filter: function(freeSpace: boolean, allPatterns: number[][][][]) {
                    const maxPatterns = Math.max(...allPatterns.map(patterns => patterns.length));
                    let output: number[][][][] = [[],[]]
                    for( let i = 0; i < maxPatterns; i++ )
                    {
                        const board1 = allPatterns[0][i];
                        const board2 = allPatterns[1][i];

                        if( board1.length === 10)
                        {
                            //Add board 1 back into output with board 2 as empty
                            output[0].push(board1);
                            output[1].push([]);
                        }
                        if( board2.length === 10 )
                        {
                            //Add board 2 back into output with board 1 as empty
                            output[0].push([]);
                            output[1].push(board2);
                        }
                    }

                    const board1Singles = generateSingleBoardRotations(freeSpace, true, false);
                    const board2Singles = generateSingleBoardRotations(freeSpace, true, false);

                    // Now insert each element of the singles into the correct output board so that it singles is inserted every odd index
                    for( let i = 0; i < board1Singles.length; i++)
                    {
                        output[0].splice(i * 2 + 1, 0, board1Singles[i]);
                        output[1].splice(i * 2 + 1, 0, board2Singles[i]);
                    }

                    return output;
                }
            },
        ]
    }
}

function tinyX(){
    return {
        name: "Tiny X",
        variants:[
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateTinyXBingoRotations(freeSpace, true, previewMode)
                ],
                dynamicFreeSpace: true,
                length: "Fast",
                rules: 'Must get the tiny x pattern any where on one board'
            },
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateTinyXBingoRotations(freeSpace, true, previewMode),
                    (freeSpace: boolean, previewMode: boolean = false) => generateTinyXBingoRotations(freeSpace, true, previewMode)
                ],
                length: "Fast",
                op : "and",
                rules: 'Must get the tiny x pattern on both boards'
            }
        ]
    }
}

function largeX(){
    return {
        name: "Large X",
        variants:[
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]]],
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}

function corners(){
    return {
        name: "Corners",
        variants:[
            {
                name: "4 Corners",
                length: "Fast",
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[4,4],[0,4],[4,0]]]
                ],
                rules: 'Must match all 4 corners on ONE boards',
            },
            {
                name: "8 Corners",
                length: "Fast",
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[4,4],[0,4],[4,0]]],
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[[0,0],[4,4],[0,4],[4,0]]]
                ],
                op: "and",
                rules: 'Must match all 4 corners on ONE boards'
            }
        ]
    }
}

function railRoadTracks(){
    return {
        name: "Railroad Tracks",
        variants:[
            {
                boards: [
                    function(freeSpace: boolean = true, previewMode: boolean = false)
                    {
                        if( !freeSpace || previewMode)
                        {
                            return [[
                                [0,1],[1,1],[2,1],[3,1],[4,1], // I Row
                                [1,2],[3,2],//N Row
                                [0,3],[1,3],[2,3],[3,3],[4,3] // 0 Row
                            ]];
                        }
                        else
                        {
                            return [[
                                [0,1],[1,1],[2,1],[3,1],[4,1], // I Row
                                [0,2],[2,2],[4,2],//N Row
                                [0,3],[1,3],[2,3],[3,3],[4,3] // 0 Row
                            ]];
                        }
                    }
                ],
                rules: "Must match exact pattern",
                dynamicFreeSpace: true,
                freeSpace: false,
                length: "Slow"
            }
        ]
    }
}
function insideCircle(){
    return {
        name: "Inside Circle",
        variants:[
            {
                boards: [
                    function(freeSpace: boolean = true, previewMode: boolean = false)
                    {
                        if( !freeSpace || previewMode)
                        {
                            return [[
                                [1,1],[1,2],[1,3], // top Row
                                [2,1],[2,3],//middle
                                [3,1],[3,2],[3,3] // bottom Row
                            ]];
                        }
                        return generateSmallSquarePattern();
                    }
                ],
                rules: "Must match exact pattern",
                dynamicFreeSpace: true,
                freeSpace: false,
                length: "Not Set"
            }
        ]
    }
}
function outsideCircle(){
    return {
        name: "Outside Circle",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4], // top Row
                        [1,0],[1,4],
                        [2,0],[2,4],
                        [3,0],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4] // bottom Row
                    ]]
                ],
                rules: "Must match exact pattern",
                length: "Not Set"
            }
        ]
    }
}
function postageStamp(){
    return {
        name: "Postage Stamp",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,3],[0,4], // top Row
                        [1,0],[1,1],[1,3],[1,4],
                        [3,0],[3,1],[3,3],[3,4],
                        [4,0],[4,1],[4,3],[4,4],
                    ]]
                ],
                rules: "Must match exact pattern",
                length: "Not Set"
            }
        ]
    }
}
function theGoat(){
    return {
        name: "The GOAT",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3], // top Row
                        [1,0],
                        [2,0],[2,2],[2,3],
                        [3,0],[3,3],
                        [4,0],[4,1],[4,2],[4,3]
                    ],[
                        [0,1],[0,2],[0,3],[0,4], // top Row
                        [1,1],
                        [2,1],[2,3],[2,4],
                        [3,1],[3,4],
                        [4,1],[4,2],[4,3],[4,4]
                    ]]
                ],
                rules: "Must make the GOAT pattern on one board aligned in the first or second column",
                length: "Not Set"
            }
        ]
    }
}
function xmas(){
    return {
        name: "XMas",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,2], // top Row
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,2],
                    ]]
                ],
                rules: "Must match exact pattern",
                length: "Not Set"
            }
        ]
    }
}
function candyCane(){
    return {
        name: "Candy Cane",
        variants:[
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateCandyCanePattern(freeSpace, previewMode)
                ],
                dynamicFreeSpace: true,
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) => generateCandyCanePattern(freeSpace, previewMode),
                    (freeSpace: boolean, previewMode: boolean = false) => generateCandyCanePattern(freeSpace, previewMode)
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function ticTacToe(){
    return {
        name: "Tic Tac Toe",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function blackout(){
    return {
        name: "Blackout",
        variants:[
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4]
                    ]]
                ],
                rules: "Fill out the entire board!",
                length: "Not Set"
            }
        ]
    }
}
function survivor(){
    return {
        name: "Survivor",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[]]
                ],
                rules: "Stand up with both boards up. If a number on a board gets called flip the board. If both boards are flipped sit down. Last person standing wins!",
                length: "Not Set"
            },
            {
                name: "Blackout Survivor",
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]]
                ],
                op:"transition",
                rules: "Be the last person standing, or fill out the entire board!",
                length: "Not Set"
            }
        ]
    }
}
function arrow(){
    return {
        name: "Arrow/Tree",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function diamond(){
    return {
        name: "Diamond",
        variants:[
            {
                boards: [
                    (freeSpace: boolean, previewMode: boolean = false) =>
                        [[[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[4,2]]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set",
            },
            {
                boards: [
                        (freeSpace: boolean, previewMode: boolean = false) =>
                            [[[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[4,2]]],
                        (freeSpace: boolean, previewMode: boolean = false) =>
                            [[[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[4,2]]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set",
            }
        ]
    }
}
function theT(){
    return {
        name: "TheT",
        variants:[
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => freeSpace ? [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ]] : [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function theZ(){
    return {
        name: "TheZ",
        variants:[
            {
                boards: [
                    (freeSpace: boolean = true, previewMode: boolean = false) => [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function lucky7(){
    return {
        name: "Lucky7",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                ]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}
function valentinesDay(){
    return {
        name: "ValentinesDay",
        variants:[
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                    ]]
                ],
                rules: "Must match exact pattern on one board",
                length: "Not Set"
            },
            {
                boards: [(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                ]],(freeSpace: boolean = true, previewMode: boolean = false) =>
                    [[
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                    ]]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards",
                length: "Not Set"
            }
        ]
    }
}

function gameList(){
    return [
        bingo(),
        doubleBingo(),
        tinyX(),
        largeX(),
        corners(),
        railRoadTracks(),
        insideCircle(),
        outsideCircle(),
        postageStamp(),
        theGoat(),
        xmas(),
        candyCane(),
        ticTacToe(),
        blackout(),
        survivor(),
        arrow(),
        diamond(),
        theT(),
        theZ(),
        lucky7(),
        valentinesDay()
    ]
}

function applyOrder( gameList: any[] )
{
    let gameDisplayOrder: string = 'Default'; // Default fallback

    try {
        // Import settings utility to get the current game display order
        const { getSetting } = require('../utils/settings');
        gameDisplayOrder = getSetting('gameDisplayOrder') || 'Default';
    } catch (error) {
        // If settings can't be loaded, use default
        console.warn('Could not load game display order setting, using default:', error);
    }

    const gameCopy = [...gameList];

    switch(gameDisplayOrder) {
        case 'Default':
            // Return the game list in its original order as defined in gameList()
            return gameCopy;

        case 'Length':
            // Define the order priority for length
            const lengthOrder = ['Fast', 'Average', 'Slow', 'Not Set'];

            // First sort alphabetically to ensure consistent ordering within each length group
            const alphabeticallySorted = gameCopy.sort((a, b) => a.name.localeCompare(b.name));

            return alphabeticallySorted.sort((a, b) => {
                // Get the primary length from each game's variants
                const getGameLength = (game: any) => {
                    if (!game.variants || game.variants.length === 0) return 'Not Set';

                    const lengths = game.variants.map((v: any) => v.length || 'Not Set');

                    // Count occurrences of each length
                    const lengthCounts = lengths.reduce((acc: any, length: string) => {
                        acc[length] = (acc[length] || 0) + 1;
                        return acc;
                    }, {});

                    // Return the most frequent length, prioritizing by lengthOrder if tie
                    const sortedLengths = Object.keys(lengthCounts).sort((a, b) => {
                        const countDiff = lengthCounts[b] - lengthCounts[a];
                        if (countDiff !== 0) return countDiff;
                        // If tie, prefer earlier in lengthOrder
                        return lengthOrder.indexOf(a) - lengthOrder.indexOf(b);
                    });

                    return sortedLengths[0] || 'Not Set';
                };

                const aLength = getGameLength(a);
                const bLength = getGameLength(b);

                const aIndex = lengthOrder.indexOf(aLength);
                const bIndex = lengthOrder.indexOf(bLength);

                // If either length is not found, put it at the end
                const aPriority = aIndex === -1 ? lengthOrder.length : aIndex;
                const bPriority = bIndex === -1 ? lengthOrder.length : bIndex;

                // Primary sort by length priority
                const lengthComparison = aPriority - bPriority;

                // If lengths are the same, maintain alphabetical order (stable sort)
                if (lengthComparison === 0) {
                    return a.name.localeCompare(b.name);
                }

                return lengthComparison;
            });

        case 'Alphabetical':
            return gameCopy.sort((a, b) => a.name.localeCompare(b.name));

        case 'Random':
            // Use Fisher-Yates shuffle for random order
            return shuffleArray(gameCopy);

        default:
            // Fallback to default order
            return gameCopy;
    }
}

function games()
{
    return applyOrder(gameList());
}

export default games;
