
let current_game = undefined;
let free_space_on = true;
let clickedNumbers = []; // Array to store the clicked numbers
let numberTimes = []

let start_time = new Date().getTime();
let room_connection = null;
let retryTime = 1000; // Initial retry time in milliseconds
// README: Change this values to change the look and layout of the page
let styleVariables = {
    selectedColor: localStorage.getItem('select-tab-color'), //CSU Green
    selectedTextColor: localStorage.getItem('select-tab-text-color'),
    unselectedColor: localStorage.getItem('unselect-tab-color'),
    unselectedTextColor: localStorage.getItem('unselect-tab-text-color'),
    lastNumberDir: localStorage.getItem('last-number-dir'), // 'top' or 'bottom'
    numberHistoryDir: localStorage.getItem('number-history-dir'), // 'right' or 'left'
    numberHistoryOn: localStorage.getItem('number-history-on'), // 'true' or 'false'
    lastDirectionOn: localStorage.getItem('last-number-on') // 'true' or 'false'
};

function init()
{
    current_game = JSON.parse(getTemporaryItem('selected_game'))
    if( current_game )
    {
        free_space_on = current_game.free_space_on
    }

    loadCSSSettings();

    const page_div = document.getElementById('page_div');
    const header_div = createHeaderDiv2();
    const center_div = createCenterDiv2();
    const footer_div = createFooterDiv2();

    const layout = [header_div, center_div];
    if( styleVariables.lastNumberDir === "top"){
        for (const element of layout) {
            page_div.appendChild(element);
        }
    } else {
        for (let i = layout.length - 1; i >= 0; i--) {
            page_div.appendChild(layout[i]);
        }
    }

    page_div.appendChild(footer_div);

    createLargePreviewBoard();
    connectToServer();
}

function createHeaderDiv2()
{
    const headerDiv = document.createElement('div');
    headerDiv.id = 'headerDiv';

    const topHeaderDiv = document.createElement('div');
    topHeaderDiv.id = 'topHeaderDiv';

    const headerInfoDiv = document.createElement('div');
    headerInfoDiv.id = 'headerInfoDiv';
    const lastNumber = document.createElement('p');
    lastNumber.id = 'lastNumber';
    lastNumber.innerHTML = "Waiting for game from server";

    const qrcode = document.createElement('div');
    qrcode.id = 'qrcode';

    const numberRatioDiv = document.createElement('div');
    numberRatioDiv.id = 'numberRatioDiv';
    numberRatioDiv.appendChild(qrcode);

    const numberRatio = document.createElement('p');
    numberRatio.innerHTML = '0/75 (75 left)';
    numberRatio.id = 'numberRatio';

    const previewBoard = createPreviewBoard("", '10px');
    previewBoard.addEventListener('click', function(event) {
        const div = document.getElementById('large_preview_div');
        div.hidden = !div.hidden;
    });

    topHeaderDiv.appendChild(previewBoard);
    topHeaderDiv.appendChild(headerInfoDiv);
    topHeaderDiv.appendChild(numberRatioDiv);

    // Create paragraph to display the last clicked number
    const extraInfo = document.createElement('p');
    extraInfo.id = 'extraInfo';
    extraInfo.innerHTML = "";
    headerInfoDiv.appendChild(lastNumber);
    headerInfoDiv.appendChild(numberRatio);
    headerInfoDiv.appendChild(extraInfo);



    const items = [
        topHeaderDiv
    ]

    for (const element of items) {
        headerDiv.appendChild(element);
    }


    return headerDiv;
}

function createCenterDiv2()
{
    const centerDiv = document.createElement('div');
    centerDiv.id = 'centerDiv';

    //Create Table
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const table = document.createElement('table');
    table.id = 'numbersTable';
    let counter = 1;
    for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < 15; j++) {
            const td = document.createElement('td');
            td.id = letters[i] + counter;
            td.innerHTML = counter++;
            td.style.backgroundColor = styleVariables.unselectedColor;
            td.style.color = styleVariables.unselectedTextColor;
            tr.appendChild(td);
            td.onclick = tableClickHandler;
        }
        table.appendChild(tr);
    }

    // Create a table for the letters
    const lettersTable = document.createElement('table');
    lettersTable.id = 'lettersTable';
    for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = letters[i];
        tr.appendChild(td);
        lettersTable.appendChild(tr);
    }


    // Create a container for the clicked numbers
    const clickedNumbersDiv = document.createElement('div');
    clickedNumbersDiv.id = 'clickedNumbersDiv';
    // Create paragraph to display the last clicked number
    const lastNumberCalled = document.createElement('p');
    lastNumberCalled.id = 'lastNumberCalled';
    lastNumberCalled.innerHTML = "Called Numbers";
    clickedNumbersDiv.appendChild(lastNumberCalled);
    // Create a table for the clicked numbers
    const clickedNumbersTableDiv = document.createElement('div');
    clickedNumbersTableDiv.id = 'clickedNumbersTableDiv';
    const clickedNumbersTable = document.createElement('table');
    clickedNumbersTable.id = 'clickedNumbersTable';
    clickedNumbersTableDiv.appendChild(clickedNumbersTable);
    clickedNumbersDiv.appendChild(clickedNumbersTableDiv);

    centerDiv.appendChild(lettersTable);
    centerDiv.appendChild(table);
    centerDiv.append(clickedNumbersDiv);

    return centerDiv;
}


function createFooterDiv2()
{
    const footerDiv = document.createElement('div');
    footerDiv.id = 'footerDiv';

    // Create reset button
    const resetButton = document.createElement('button');
    resetButton.innerHTML = 'Select Board/End Game';
    resetButton.onclick = onReset;
    footerDiv.appendChild(resetButton);

    // Create end games button
    const endNight = document.createElement('button');
    endNight.innerHTML = 'End The Night';
    endNight.onclick = function() {
        if (clickedNumbers.length > 0) {
            saveCurrentGame();
            // Clear the array
            clickedNumbers = [];
        }
        const cells = document.getElementsByTagName('td');
        for (const element of cells) {
            element.style.backgroundColor = '';
            element.style.color = 'black';
        }
        if( current_game )
        {
            update_main_board_num(current_game, 'preview_board', 0, '10px');
        }

        // Reset the last number text
        document.getElementById('lastNumber').innerHTML = "Waiting for first number";
        clickedNumbersTable.innerHTML = "";
        window.location.href = 'stats.html';
    }
    footerDiv.appendChild(endNight);

    return footerDiv;
}

function createPreviewBoard(ident, pixelSize)
{
    let preview = document.getElementById(ident + 'preview_div');
    if( preview == null )
    {
        preview = document.createElement('div');
        preview.id = ident + 'preview_div';
    }

    if( !current_game )
    {
        return preview;
    }

    const preview_table_div = document.createElement('div');
    preview_table_div.id = ident + 'preview_table_div';
    const table = create_table(document, ident + 'preview_board', current_game, pixelSize );

    const arrow = document.createElement('p');
    arrow.id = ident + 'transition_arrow';
    arrow.innerHTML = '&#x27A7;';
    arrow.hidden = !current_game.transitional;

    const slash = document.createElement('p');
    slash.className = "multi_table_operator";
    slash.id = ident + 'optional_slash';
    slash.innerHTML = '&#x2215;';
    slash.hidden = !current_game.optional;

    const table2 = create_table(document, ident + 'preview_board_2', current_game, pixelSize, 1 );
    table2.hidden = current_game.board_count < 2;

    preview_table_div.appendChild(table);
    preview_table_div.appendChild(arrow);
    preview_table_div.appendChild(slash);
    preview_table_div.appendChild(table2);

    const game_name_label = document.createElement('p');
    game_name_label.id = ident + 'game_preview_name';
    game_name_label.innerHTML = current_game.name;

    const free_space_label = document.createElement('p');
    free_space_label.id = ident + 'free_space_label';
    free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');
    free_space_label.addEventListener('click', function(event) {
        event.stopPropagation();
        update_free_space();
        updatePreviewBoards();
    });


    preview.appendChild(game_name_label);
    preview.appendChild(preview_table_div);
    preview.appendChild(free_space_label);
    return preview;
}

function createLargePreviewBoard()
{
    const large_preview_div = createPreviewBoard("large_", '50px');
    large_preview_div.addEventListener('click', function(event) {
        const div = document.getElementById('large_preview_div');
        div.hidden = true;
    });
    large_preview_div.hidden = true;

    document.addEventListener('click', function(event) {
        const large_preview_div = document.getElementById('large_preview_div');
        if( !large_preview_div.hidden ){
            if( !large_preview_div.hidden ){
                const specificElement = document.getElementById('large_free_space_label');
                if (event.target !== specificElement) {
                    large_preview_div.hidden = true;
                    event.stopPropagation();
                }
            }
        }
    }, true);
}

function tableClickHandler(event)
{
    const rowIndex = Array.prototype.indexOf.call(this.parentNode.parentNode.children, this.parentNode);
    const letter = lettersTable.children[rowIndex].firstChild.innerHTML;
    const number = letter + this.innerHTML;
    const index = clickedNumbers.indexOf(number);
    if (index > -1) {
        this.style.backgroundColor = styleVariables.unselectedColor;
        this.style.color = styleVariables.unselectedTextColor;
        // Remove the number from the array
        clickedNumbers.splice(index, 1);
        numberTimes.splice(index, 1);
        clickedNumbersTable.removeChild(clickedNumbersTable.children[index]);

        document.getElementById('extraInfo').innerHTML = " ";
        deactivateNumber(this.innerHTML);
    } else {
        this.style.backgroundColor = styleVariables.selectedColor;
        this.style.color = styleVariables.selectedTextColor;
        // Add the number to the array
        clickedNumbers.unshift(number);
        numberTimes.unshift(new Date().getTime() - start_time);

        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = number;
        tr.appendChild(td);

        clickedNumbersTable.insertBefore(tr, clickedNumbersTable.firstChild);


        const specialNumbers = JSON.parse(getItemWithDefault('special-numbers'));
        console.log(specialNumbers);
        console.log(this.innerHTML);
        if (specialNumbers && this.innerHTML in specialNumbers) {
            console.log("Special Number!");
            document.getElementById('extraInfo').innerHTML = specialNumbers[this.innerHTML];
        }
        else{
            document.getElementById('extraInfo').innerHTML = " ";
        }
        activateNumber(this.innerHTML);
    }


    // Update the last number text
    if (clickedNumbers.length > 0) {
        document.getElementById('lastNumber').innerHTML = "The last number was " + clickedNumbers[0];
    } else {
        document.getElementById('lastNumber').innerHTML = "Waiting for first number";
    }

    const numberRatio = document.getElementById('numberRatio');
    numberRatio.innerHTML = clickedNumbers.length + "/75" + "(" + (75 - clickedNumbers.length) + " left)";
}

async function connectToServer()
{
    const element = document.getElementById('qrcode');
    element.visible = false;
    console.log("Connecting to server");
    const auth = await hostRoom();
    if( auth )
    {
        connectToRoom(auth);;
    }
}

async function hostRoom()
{
    //Make an HTTP Get request to the server
    const server_url = getItemWithDefault('bingo_server_url');
    const server_token = getItemWithDefault('bingo_server_auth');

    if( !(server_url && server_token) )
    {
        console.log('Server URL or token not set');
        return null;
    }

    try {
        const response = await fetch(`${server_url}/host`, {
            method: 'GET',
            headers: {
                'Authorization': server_token
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log('Success:', data);
        return data; // Assuming the server returns some auth data
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function connectToRoom( auth )
{
    const server_url = getItemWithDefault('bingo_server_url');
    const ws_url = `${server_url.replace('http', 'ws')}/start/${auth.room_id}?room_token=${auth.room_token}`;
    console.log('Connecting to room:', ws_url);


    room_connection = new WebSocket(ws_url);
    room_connection.onopen = function() {
        console.log("Connected to room");
        const id_message = {
            type: "request_id",
        }
        room_connection.send(JSON.stringify(id_message));
    }
    room_connection.onmessage = function(msg) {
        console.log('Message:', msg.data);
        const data = JSON.parse(msg.data);
        if( data.type == "id" )
        {
            updateQRCode( auth );
            sendStatus();
        }
        else if( data.type === 'update' )
        {
            sendStatusTo(data.client_id);
        }
    }
    room_connection.onerror = function(error) {
        console.error('Error:', error);
        retryConnection();
    }
    room_connection.onclose = function() {
        console.log('Connection closed');
    }
}

function updateQRCode( auth )
{
    const server_url = getItemWithDefault('bingo_server_url');
    const client_url = `${server_url}/join/${auth.room_id}`;
    const client_url_b64 = btoa(client_url);
    const path = `${window.location.pathname}`;
    const data = `${window.location.protocol}//${window.location.hostname}:${window.location.port}${path.replace("board", "client_view")}?server_url=${client_url_b64}`;
    console.log("Connect url:", data);
    const element = document.getElementById('qrcode');
    element.visible = true;
    const _ = new QRCode(element, {
        text: data,
        width: 230,
        height: 230,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
    });

    const txt_element = document.getElementById('qrcode_text');
    txt_element.innerHTML = "Scan QR Code to join on your device";
}

function createStatus()
{
    const status = {
        type: "setup",
        data: {
            game: current_game.name,
            free: free_space_on,
            active: clickedNumbers
        },
        style: {
            selectedColor: styleVariables.selectedColor,
            selectedTextColor: styleVariables.selectedTextColor,
            unselectedColor: styleVariables.unselectedColor,
            unselectedTextColor: styleVariables.unselectedTextColor,
        },
        session:{
            numbers: JSON.parse(getItemWithDefault('special-numbers'))
        }
    }
    return status;
}

function sendStatus()
{
    const status = createStatus();
    console.log("Sending status to all");
    console.log(JSON.stringify(status));
    room_connection.send(JSON.stringify(status));
}

function sendStatusTo( client_id )
{
    const status = createStatus();
    status.client_id = client_id;
    console.log("Sending status to:", client_id);
    console.log(JSON.stringify(status));
    room_connection.send(JSON.stringify(status));
}

function update_free_space()
{
    if (current_game.free_space_dynamic){
        current_game.free_space_on=!current_game.free_space_on;
    }

    if( room_connection )
    {
        const update = {
            type: "update_free",
            free: current_game.free_space_on
        }
        room_connection.send(JSON.stringify(update));
    }
}

function activateNumber( number )
{
    if( room_connection )
    {
        const update = {
            type: "activate",
            id: number,
            spots: clickedNumbers.length
        };
        room_connection.send(JSON.stringify(update));
    }
}
function deactivateNumber( number )
{
    if( room_connection )
    {
        const update = {
            type: "deactivate",
            id: number,
            spots: clickedNumbers.length
        };
        room_connection.send(JSON.stringify(update));
    }
}

function retryConnection() {
    let element = document.getElementById('qrcode');
    element.visible = false;
    console.log(`Retrying connection in ${retryTime / 1000} seconds...`);
    setTimeout(() => {
        retryTime *= 2; // Double the retry time
        connectToServer();
    }, retryTime);
}


function onReset()
{
    if (clickedNumbers.length > 0) {
        saveCurrentGame();
        // Clear the array
        clickedNumbers = [];
        numberTimes = [];
    }

    if( getItemWithDefault('home-page') == 'select_game'){
        window.location.href = 'select_game.html';
    }
    else
    {
        const cells = document.getElementsByTagName('td');
        for (const element of cells) {
            element.style.backgroundColor = '';
            element.style.color = 'black';
        }
        if( current_game )
        {
            update_main_board_num(current_game, 'preview_board', 0, '10px');
        }

        // Reset the last number text
        document.getElementById('lastNumber').innerHTML = "Waiting for first number";
        clickedNumbersTable.innerHTML = "";
    }
}

function updatePreviewBoards()
{
    update_main_board_num(current_game, 'preview_board', 0, '10px');
    const free_space_label = document.getElementById('free_space_label');
    free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');

    update_main_board_num(current_game, 'large_preview_board', 0, '50px');
    const large_free_space_label = document.getElementById('large_free_space_label');
    large_free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');
}

function loadCSSSettings() {
    document.documentElement.style.setProperty('--main-bg-color', localStorage.getItem('main-bg-color'));
    document.documentElement.style.setProperty('--main-font-color', localStorage.getItem('main-font-color'));
    document.documentElement.style.setProperty('--item-font-size', localStorage.getItem('item-font-size'));
}


function saveCurrentGame()
{
    let game = {
        game: current_game,
        numbers: clickedNumbers,
        duration: new Date().getTime() - start_time,
        number_times: numberTimes // TODO add number times
    };
    let game_history = getTemporaryItem('game_history');
    if( game_history == null ){
        game_history = [];
    }
    else{
        game_history = JSON.parse(game_history);
    }
    game_history.push(game);
    setTemporaryItem('game_history', JSON.stringify(game_history));
}