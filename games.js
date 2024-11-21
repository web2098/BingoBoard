
const bingo_word = 'bingo';

function bingo(){
    return {
        "name": "Bingo",
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
        "rules": "Must get 5 in a row, column, or diagonal",
        "length": 1
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
        "optional": false,
        "rules": "Variant 1: Get 2 bingos on only 1 board<br>Variant 2: Get 1 bingo on both boards<br>Variant 3: Either variant wins!",
        "length": 2
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
        "optional": false,
        "rules": "Must get the tiny x pattern any where on the board",
        "length": 1
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
        "optional": false,
        "rules": "Must match all 4 corners on BOTH boards",
        "length": 1
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
        "optional": false,
        "rules": "Must match all 4 corners on ONE boards",
        "length": 1
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
    };
}
function InsideCircle(){
    return {
        "name": "Inside Square",
        "board":
        [
            [1,1],[1,2],[1,3], // top Row
            [2,1],[2,3],//middle
            [3,1],[3,2],[3,3] // bottom Row
        ],
        "free_space_dynamic": true,
        "free_space_on": false,
        "transitional": false,
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 2
    };
}
function OutsideCircle(){
    return {
        "name": "Outside Square",
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": true,
        "rules": "Must match ONE of the two boards",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 2
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Fill out the entire board!",
        "length": 3
    };
}
function Survivor(){
    return {
        "name": "Survivor",
        "board_count": 1,
        "board": [
        ],
        "free_space_dynamic": false,
        "free_space_on": false,
        "transitional": false,
        "optional": false,
        "rules": "Stand up with both boards up. If a number on a board gets called flip the board. If both boards are flipped sit down. Last person standing wins!",
        "length": 1
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 2
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
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
        "optional": false,
        "rules": "Be the last person standing, or fill out the entire board!",
        "length": 3
    };
}

function TheM(){
    return {
        "name": "The M",
        "board_count": 1,
        "board": [
            [0,0],[0,4],
            [1,0],[1,1],[1,3],[1,4],
            [2,0],[2,2],[2,4],
            [3,0],[3,4],
            [4,0],[4,4]
        ],
        "free_space_dynamic": false,
        "free_space_on": true,
        "transitional": false,
        "optional": false,
        "rules": "Must match exact pattern",
        "length": 3
    };
}

function gameList()
{
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
        ValentinesDay(),
        TheM()
    ]
}

function games(){
    return applyOrder(gameList());
}

function applyOrder( games ){
    var order = getItemWithDefault('game-order');
    if (order == 'random')
    {
        return games.sort(() => Math.random() - 0.5);
    }
    else if (order == 'alphabetical')
    {
        return games.sort((a, b) => (a.name > b.name) ? 1 : -1);
    }
    else if (order == 'length')
    {
        order = games.sort((a, b) => (a.name > b.name) ? -1 : 1);
        order = order.sort((a, b) => (a.length > b.length) ? 1 : -1);
        //For each level 1,2,3 reverse the order of the games
        return order;
    }
    //TODO Additional sorting pushing favorites to the top, requires loading favorites from local storage
    return games;
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

function generateRandomGame()
{
    // Generate a random number between 5 and 75 for numbers to call
    var numbersToCall = Math.floor(Math.random() * 71) + 5;
    var numbersCalled = [];
    // Pick Random numbers between 1 and 75 for the numbers to call and store them in an array, no duplicates
    for (var i = 0; i < numbersToCall; i++) {
        var number = Math.floor(Math.random() * 75) + 1;
        if (numbersCalled.indexOf(number) === -1) {
            numbersCalled.push(number);
        } else {
            i--;
        }
    }

    //For each number in numbers called add to numbers list where each numbers is prefixed with a letter, 1-15 = B, 16-30 = I, 31-45 = N, 46-60 = G, 61-75 = O
    var numbers = [];
    for (var i = 0; i < numbersCalled.length; i++) {
        var number = numbersCalled[i];
        if (number <= 15) {
            numbers.push('B' + number);
        } else if (number <= 30) {
            numbers.push('I' + number);
        } else if (number <= 45) {
            numbers.push('N' + number);
        } else if (number <= 60) {
            numbers.push('G' + number);
        } else {
            numbers.push('O' + number);
        }
    }

    // Pick a random game from the list of games
    var games = gameList();
    var game = games[Math.floor(Math.random() * games.length)];


    game = {
        game: game,
        numbers: numbers,
        //Generate a time from 5 minutes to 30 minutes for the game
        duration: (Math.floor(Math.random() * 26) + 5) * 60000,
        number_times: []
    }

    return game
}

function generateRandomGameHistory()
{
    //Generate a random number of games between 5 and 12
    var games = [];
    var numGames = Math.floor(Math.random() * 8) + 5;
    for (var i = 0; i < numGames; i++) {
        var game = generateRandomGame();
        //Check if game.name is in the games list and if not add the game to the list
        var found = false;
        for (var j = 0; j < games.length; j++) {
            if (games[j].game.name == game.game.name) {
                found = true;
            }
        }
        if (!found) {
            games.push(game);
        }
        else {
            i--;
        }
    }

    //Check if 'Black Out Survivor' is in the games list and if not add a game with Black Out Survivor as its name and a list of all numbers between 1-75
    var found = false;
    for (var i = 0; i < games.length; i++) {
        if (games[i].game.name === 'Black Out Survivor') {
            found = true;
        }
    }
    if (!found) {
        var numbers = [];
        var letters = ['B', 'I', 'N', 'G', 'O'];
        for (var i = 1; i <= 75; i++) {
            numbers.push(letters[Math.floor((i-1) / 15)] + i);
        }
        games.push({
            game: BlackOutSurvivor(),
            numbers: numbers,
            duration: 30* 60000,
        });
    }

    return games;
}
