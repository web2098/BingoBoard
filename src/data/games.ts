
function bingo(){
    return {
        name: "Normal Bingo",
        variants:[
            {
                boards: [
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4]
                    ]
                ],
                alt_boards: [
                    [
                        [0, 0], [0,1],[0,2],[0,3],[0,4]
                    ]
                ],
                rules: 'Must get 5 in a row, column, or diagonal'
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
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4],
                        [0,1],[0,2],[0,3],[0,4]
                    ]
                ],
                alt_boards: [
                    [
                        [0, 0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],[2,3],[3,3],[4,3]
                    ]
                ]
            },
            {
                rules: 'Must get a one bingo on both boards',
                op: "and",
                boards: [
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4]
                    ],
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4]
                    ]
                ],
                alt_boards: [
                    [
                        [0, 0],[0,1],[0,2],[0,3],[0,4]
                    ],
                    [
                        [0, 0],[0,1],[0,2],[0,3],[0,4]
                    ]
                ]
            },
            {
                rules: 'Must get two bingos on one or both boards',
                op: "or",
                boards: [
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4],
                        [0,1],[0,2],[0,3],[0,4]
                    ],
                    [
                        [0,0],[1,1],[2,2],[3,3],[4,4],
                        [0,1],[0,2],[0,3],[0,4]
                    ]
                ],
                alt_boards: [
                    [
                        [0, 0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],[2,3],[3,3],[4,3]
                    ],
                    [
                        [0, 0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],[2,3],[3,3],[4,3]
                    ]
                ]
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
                    [
                        [0,0],[0,2],[1,1],[2,0],[2,2]
                    ]
                ],
                rules: 'Must get the tiny x pattern any where on one board'
            },
            {
                boards: [
                    [
                        [0,0],[0,2],[1,1],[2,0],[2,2],
                        [3,3],[4,4],[2,4],[4,2]
                    ]
                ],
                rules: 'Must get two tiny x patterns any where on one board'
            },
            {
                boards: [
                    [
                        [0,0],[0,2],[1,1],[2,0],[2,2]
                    ],
                    [
                        [3,1],[1,3],[1,1],[3,3],[2,2]
                    ]
                ],
                op : "and",
                rules: 'Must get the tiny x pattern on both boards'
            },
            {
                boards: [
                    [
                        [0,0],[0,2],[1,1],[2,0],[2,2]
                    ],
                    [
                        [0,0],[0,2],[1,1],[2,0],[2,2]
                    ]
                ],
                op : "or",
                rules: 'Must get the two tiny x patterns on either board'
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
                boards: [
                    [
                        [0,0],[4,4],[0,4],[4,0]
                    ]
                ],
                rules: 'Must match all 4 corners on ONE boards'
            },
            {
                name: "8 Corners",
                boards: [
                    [
                        [0,0],[4,4],[0,4],[4,0]
                    ],
                    [
                        [0,0],[4,4],[0,4],[4,0]
                    ]
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
                    [
                        [0,1],[1,1],[2,1],[3,1],[4,1], // I Row
                        [1,2],[3,2],//N Row
                        [0,3],[1,3],[2,3],[3,3],[4,3] // 0 Row
                    ]
                ],
                rules: "Must match exact pattern"
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
                    [
                        [1,1],[1,2],[1,3], // top Row
                        [2,1],[2,3],//middle
                        [3,1],[3,2],[3,3] // bottom Row
                    ]
                ],
                rules: "Must match exact pattern"
            }
        ]
    }
}
function outsideCircle(){
    return {
        name: "Outside Circle",
        variants:[
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4], // top Row
                        [1,0],[1,4],
                        [2,0],[2,4],
                        [3,0],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4] // bottom Row
                    ]
                ],
                rules: "Must match exact pattern"
            }
        ]
    }
}
function postageStamp(){
    return {
        name: "Postage Stamp",
        variants:[
            {
                boards: [
                    [
                        [0,0],[0,1],[0,3],[0,4], // top Row
                        [1,0],[1,1],[1,3],[1,4],
                        [3,0],[3,1],[3,3],[3,4],
                        [4,0],[4,1],[4,3],[4,4],
                    ]
                ],
                rules: "Must match exact pattern"
            }
        ]
    }
}
function theGoat(){
    return {
        name: "The GOAT",
        variants:[
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3], // top Row
                        [1,0],
                        [2,0],[2,2],[2,3],
                        [3,0],[3,3],
                        [4,0],[4,1],[4,2],[4,3]
                    ],
                    [
                        [0,1],[0,2],[0,3],[0,4], // top Row
                        [1,1],
                        [2,1],[2,3],[2,4],
                        [3,1],[3,4],
                        [4,1],[4,2],[4,3],[4,4]
                    ]
                ],
                op:"or",
                rules: "Must match ONE of the two boards"
            }
        ]
    }
}
function xmas(){
    return {
        name: "XMas",
        variants:[
            {
                boards: [
                    [
                        [0,2], // top Row
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,2],
                    ]
                ],
                rules: "Must match exact pattern"
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
                    [
                        [0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]
                    ],
                    [
                        [0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
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
                    [
                        [0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]
                    ],
                    [
                        [0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
            }
        ]
    }
}
function ticTacToe(){
    return {
        name: "Tic Tac Toe",
        variants:[
            {
                boards: [
                    [
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ],
                    [
                        [0,1],[0,3], // top Row
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,1],[2,3],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,1],[4,3],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
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
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]
                ],
                rules: "Fill out the entire board!"
            }
        ]
    }
}
function survivor(){
    return {
        name: "Survivor",
        variants:[
            {
                boards: [
                    [
                    ]
                ],
                rules: "Stand up with both boards up. If a number on a board gets called flip the board. If both boards are flipped sit down. Last person standing wins!"
            },
            {
                name: "Blackout Survivor",
                boards: [
                    [],
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,0],[1,1],[1,2],[1,3],[1,4],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,0],[3,1],[3,2],[3,3],[3,4],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]
                ],
                op:"transition",
                rules: "Be the last person standing, or fill out the entire board!"
            }
        ]
    }
}
function arrow(){
    return {
        name: "Arrow/Tree",
        variants:[
            {
                boards: [
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ],
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
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
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ],
                    [
                        [0,2],
                        [1,1],[1,2],[1,3],
                        [2,0],[2,1],[2,2],[2,3],[2,4],
                        [3,2],
                        [4,2],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
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
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ],
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
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
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ],
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],[4,1],[4,2],[4,3],[4,4],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
            }
        ]
    }
}
function lucky7(){
    return {
        name: "Lucky7",
        variants:[
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                    ],
                    [
                        [0,0],[0,1],[0,2],[0,3],[0,4],
                        [1,3],
                        [2,2],
                        [3,1],
                        [4,0],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
            }
        ]
    }
}
function valentinesDay(){
    return {
        name: "ValentinesDay",
        variants:[
            {
                boards: [
                    [
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                    ]
                ],
                rules: "Must match exact pattern on one board"
            },
            {
                boards: [
                    [
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                    ],
                    [
                        [0,0],[0,1],[0,3],[0,4],
                        [1,0],[1,2],[1,4],
                        [2,0],[2,4],
                        [3,1],[3,3],
                        [4,2],
                    ]
                ],
                op: "and",
                rules: "Must match exact pattern on both boards"
            }
        ]
    }
}

function games(){
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

export default games;


export function boardContainsPoint( board: any, x: number, y: number )
{
    for( var i = 0; i < board.length; i++ ){
        if( board[i][0] === x && board[i][1] === y ){
            return true;
        }
    }
    return false;
}