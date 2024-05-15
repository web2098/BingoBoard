
const bingo_word = 'bingo';

function bingo(){
    return {
        "name": "Normal Bingo",
        "board_count": 1,
        "board": [
            [0,0],[1,1],[2,2],[3,3],[4,4]
        ],
        "free_space_dynamic": true,
        "free_space_on": true,
        "free_off_board": [
            [0, 0], [0,1],[0,2],[0,3],[0,4]
        ],
        "transitional": false,
        "rules": "Must get 5 in a row, column, or diagonal"
    };
}
function DoubleBingo(){
    return {
        "name": "Double Bingo",
        "board_count": 1,
        "board": [
            [0, 2],[1,2],[2,2],[3,2],[4,2],
            [0, 0],[1,1],[2,2],[3,3],[4,4]
        ],
        "free_space_dynamic": true,
        "free_space_on": true,
        "free_off_board": [
            [0, 0],[0,1],[0,2],[0,3],[0,4],
            [0,3],[1,3],[2,3],[3,3],[4,3]
        ],
        "transitional": false,
        "rules": "On a single board must get 2 Bingos"
    };
}
function tinyX(){
    return {
        "name": "Tiny X",
        "board_count": 1,
        "board": [
            [0,0],[0,2],[1,1],[2,0],[2,2]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must get the tiny x pattern any where on the board"
    };
}
function EightCorners(){
    return {
        "name": "Eight Corners",
        "board_count": 2,
        "board": [
            [
                [0,0],[4,4],[0,4],[4,0]
            ],
            [
                [0,0],[4,4],[0,4],[4,0]
            ]
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match all 4 corners on BOTH boards"
    };
}
function FourCorners(){
    return {
        "name": "Four Corners",
        "board_count": 1,
        "board":
        [
            [0,0],[4,4],[0,4],[4,0]
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match all 4 corners on ONE boards"
    };
}

function RailRoadTracks(){
    return {
        "name": "Railroad Tracks",
        "board":
        [
            [0,1],[1,1],[2,1],[3,1],[4,1], // I Row
            [1,2],[3,2],//N Row
            [0,3],[1,3],[2,3],[3,3],[4,3] // 0 Row
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function InsideCircle(){
    return {
        "name": "Inside Circle",
        "board":
        [
            [1,1],[1,2],[1,3], // top Row
            [2,1],[2,3],//middle
            [3,1],[3,2],[3,3] // bottom Row
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function OutsideCircle(){
    return {
        "name": "Outside Circle",
        "board":
        [
            [0,0],[0,1],[0,2],[0,3],[0,4], // top Row
            [1,0],[1,4],
            [2,0],[2,4],
            [3,0],[3,4],
            [4,0],[4,1],[4,2],[4,3],[4,4] // bottom Row
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function PostageStamp(){
    return {
        "name": "Postage Stamp",
        "board":
        [
            [0,0],[0,1],[0,3],[0,4], // top Row
            [1,0],[1,1],[1,3],[1,4],
            [3,0],[3,1],[3,3],[3,4],
            [4,0],[4,1],[4,3],[4,4],
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function TheGoat(){
    return {
        "name": "The GOAT",
        "board_count": 2,
        "board":
        [
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
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match ONE of the two boards"
    };
}
function XMas(){
    return {
        "name": "XMas",
        "board_count": 1,
        "board":
        [
            [0,2], // top Row
            [1,1],[1,2],[1,3],
            [2,0],[2,1],[2,2],[2,3],[2,4],
            [3,0],[3,1],[3,2],[3,3],[3,4],
            [4,2],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function LargeX(){
    return {
        "name": "X Marks the Spot",
        "board_count": 1,
        "board": [
            [0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function CandyCane(){
    return {
        "name": "Candy Cane",
        "board_count": 1,
        "board": [
            [0,1],[0,2],[0,3],[1,1],[1,3],[2,3],[3,3],[4,3]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function TicTacToe(){
    return {
        "name": "Tic Tac Toe",
        "board_count": 1,
        "board": [
            [0,1],[0,3], // top Row
            [1,0],[1,1],[1,2],[1,3],[1,4],
            [2,1],[2,3],
            [3,0],[3,1],[3,2],[3,3],[3,4],
            [4,1],[4,3],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function BlackOut(){
    return {
        "name": "Blackout",
        "board_count": 1,
        "board": [
            [0,0],[0,1],[0,2],[0,3],[0,4],
            [1,0],[1,1],[1,2],[1,3],[1,4],
            [2,0],[2,1],[2,2],[2,3],[2,4],
            [3,0],[3,1],[3,2],[3,3],[3,4],
            [4,0],[4,1],[4,2],[4,3],[4,4],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Fill out the entire board!"
    };
}
function Survivor(){
    return {
        "name": "Survivor",
        "board_count": 1,
        "board": [
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Stand up with both boards up. If a number on a board gets called flip the board. If both boards are flipped sit down. Last person standing wins!"
    };
}
function Arrow(){
    return {
        "name": "Arrow/Tree",
        "board_count": 1,
        "board": [
            [0,2],
            [1,1],[1,2],[1,3],
            [2,0],[2,1],[2,2],[2,3],[2,4],
            [3,2],
            [4,2],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function Diamond(){
    return {
        "name": "Diamond",
        "board_count": 1,
        "board": [
            [0,2],
            [1,1],[1,3],
            [2,0],[2,4],
            [3,1],[3,3],
            [4,2]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function TheT(){
    return {
        "name": "T",
        "board_count": 1,
        "board": [
            [0,0],[0,1],[0,2],[0,3],[0,4],
            [1,2],
            [2,2],
            [3,2],
            [4,2],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function TheZ(){
    return {
        "name": "Z",
        "board_count": 1,
        "board": [
            [0,0],[0,1],[0,2],[0,3],[0,4],
            [1,3],
            [2,2],
            [3,1],
            [4,0],[4,1],[4,2],[4,3],[4,4],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function Lucky7(){
    return {
        "name": "Lucky 7",
        "board_count": 1,
        "board": [
            [0,0],[0,1],[0,2],[0,3],[0,4],
            [1,3],
            [2,2],
            [3,1],
            [4,0],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function ValentinesDay(){
    return {
        "name": "Valentines",
        "board_count": 1,
        "board": [
            [0,0],[0,1],[0,3],[0,4],
            [1,0],[1,2],[1,4],
            [2,0],[2,4],
            [3,1],[3,3],
            [4,2],
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "rules": "Must match exact pattern"
    };
}
function BlackOutSurvivor(){
    return {
        "name": "Black Out Survivor",
        "board_count": 2,
        "board": [
            [],
            [
                [0,0],[0,1],[0,2],[0,3],[0,4],
                [1,0],[1,1],[1,2],[1,3],[1,4],
                [2,0],[2,1],[2,2],[2,3],[2,4],
                [3,0],[3,1],[3,2],[3,3],[3,4],
                [4,0],[4,1],[4,2],[4,3],[4,4],
            ]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": true,
        "rules": "Be the last person standing, or fill out the entire board!"
    };
}
function games(){
    return [
        bingo(),
        DoubleBingo(),
        tinyX(),
        EightCorners(),
        FourCorners(),
        RailRoadTracks(),
        InsideCircle(),
        OutsideCircle(),
        PostageStamp(),
        TheGoat(),
        XMas(),
        LargeX(),
        CandyCane(),
        TicTacToe(),
        BlackOut(),
        Survivor(),
        BlackOutSurvivor(),
        Arrow(),
        Diamond(),
        TheT(),
        TheZ(),
        Lucky7(),
        ValentinesDay()
    ]
}

function create_table( parent, name , game, free_font_size = '3vh', board_num = 0 )
{
    var table = parent.createElement('table');
    table.id = name;
    table.className = name;

    // Create 5 rows
    for (var i = 0; i < 5; i++) {
        var tr = parent.createElement('tr');

        // Create 5 columns
        for (var j = 0; j < 5; j++) {
            var td = parent.createElement('td');
            td.className = "game_cell"

            // Fill the cell with the corresponding character from the word
            td.textContent = bingo_word[j].toUpperCase();
            if( i == 2 && j == 2 ){
                td.textContent = "FREE";
                td.style.fontSize = free_font_size;
            }
            td.style.textAlign="center";

            if( game_contains_point( game, i, j, board_num ) )
            {
                td.style.backgroundColor = getItemWithDefault('select-tab-color');
                td.style.color = getItemWithDefault('select-tab-text-color');
            }
            else{
                td.style.backgroundColor = getItemWithDefault('unselect-tab-color');
                td.style.color = getItemWithDefault('unselect-tab-text-color');
            }

            // Add the cell to the row
            tr.appendChild(td);
        }

        // Add the row to the table
        table.appendChild(tr);
    }
    return table;
}

function game_contains_point( game, x, y, board_num = 0 )
{
    var board = game.free_space_on ? game.board : game.free_off_board;
    if (!game.free_space_dynamic)
    {
        board = game.board;
    }

    if (game.board_count > 1)
    {
        board = board[board_num];
    }

    for( var i = 0; i < board.length; i++ ){
        if( board[i][0] == x && board[i][1] == y ){
            return true;
        }
    }
    return false;
}

function update_main_board_num(active_game, board_name, board_num, free_size='3vh')
{
    var table = document.getElementById(board_name);
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            var td = table.rows[i].cells[j];
            if( i == 2 && j == 2 ){
                td.textContent = "FREE";
                td.style.fontSize = free_size;
            }
            else{
                td.textContent = bingo_word[j].toUpperCase();
            }
            if( game_contains_point( active_game, i, j, board_num ) )
            {
                td.style.backgroundColor = getItemWithDefault('select-tab-color');
                td.style.color = getItemWithDefault('select-tab-text-color');
            }
            else{
                td.style.backgroundColor = getItemWithDefault('unselect-tab-color');
                td.style.color = getItemWithDefault('unselect-tab-text-color');
            }
        }
    }
}
