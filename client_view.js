
let ws = null;
let clickedNumbers = []; // Array to store the clicked numbers
let current_game = null;
let specialNumbers = null;
let welcomeMessage = null;
let retryTime = 1000; // Initial retry time in milliseconds

// Load all defaults from local storage, but will be overriden by the host of the room
let styleVariables = {
    selectedColor: getItemWithDefault('select-tab-color'), //CSU Green
    selectedTextColor: getItemWithDefault('select-tab-text-color'),
    unselectedColor: getItemWithDefault('unselect-tab-color'),
    unselectedTextColor: getItemWithDefault('unselect-tab-text-color'),
    lastNumberDir: getItemWithDefault('last-number-dir'), // 'top' or 'bottom'
    numberHistoryDir: getItemWithDefault('number-history-dir'), // 'right' or 'left'
    numberHistoryOn: getItemWithDefault('number-history-on'), // 'true' or 'false'
    lastDirectionOn: localStorage.getItem('last-number-on') // 'true' or 'false'
};

function init_view()
{
    createLargePreviewBoard();

    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            server_url: params.get('server_url')
        };
    }
    const queryParams = getQueryParams();

    // Get Server URL from session storage
    let server_url = queryParams.server_url;
    if( server_url == null )
    {
        report_error("No Valid server url is currently set, did you scan the QR code?");
        return;
    }
    server_url = atob(server_url);

    const page_div = document.getElementById('game_board_view');
    const header_div = createHeaderDiv();
    const center_div = createCenterDiv();
    const footer_div = createFooterDiv();
    const layout = [header_div, center_div, footer_div];
    for (const element of layout) {
        page_div.appendChild(element)
    }


    const server_url_b64 = btoa(server_url);
    const data = `${window.location.protocol}//${window.location.hostname}:${window.location.port}${window.location.pathname}?server_url=${server_url_b64}`;
    let element = document.getElementById('qrcode');
    element.visible = true;
    const qrcode = new QRCode(element, {
        text: data,
        width: 128,
        height: 128,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
      });

    connectToServer(server_url);
}

function connectToServer( server_url )
{
    const element = document.getElementById('qrcode');
    element.visible = false;
    set_status("Connecting to remote server...");
    console.log("Attempting to connect to server...");
    ws = new WebSocket(server_url);
    ws.onopen = function() {
        set_status("Connected to remote server, getting id...");
        const id_message = {
            type: "request_id",
        }
        ws.send(JSON.stringify(id_message));
    }
    ws.onmessage = function (event) {
        const msg = JSON.parse(event.data);
        if( msg.type == "id" )
        {
            set_status("Connected to remote server as " + msg.conn_id);
            sessionStorage.setItem("server_client_id", msg.conn_id);
            const update_request = {
                type: "update",
                client_id: msg.conn_id,
            }
            ws.send(JSON.stringify(update_request));
        }
        else if( msg.type == "error" )
        {
            report_error(msg.message);
        }
        else
        {
            update_view(msg);
        }
    }
    ws.onerror = function(event) {
        report_error(`Failed to connect to server: ${event.message}`);
        retryConnection();
    }
    ws.onclose = function(event) {
        report_error("Connection to server closed");
        set_status("Not connected to remote server");
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

function update_view( msg )
{
    if( msg.type === "setup" )
    {
        setup_board(msg);
    }
    else if ( msg.type === "update_free")
    {
        update_free(msg.free);
    }
    else if ( msg.type === "activate")
    {
        activiate_spot(msg.id);
    }
    else if ( msg.type === "deactivate")
    {
        deactiviate_spot(msg.id);
    }
    else{
        report_error("Unknown message type: " + msg.type);
    }
}

function report_error( msg )
{
    console.log(msg);
    const error_view = document.getElementById("error_message");
    error_view.innerHTML = msg;
}

function set_status( msg )
{
    document.getElementById("server_status").innerHTML = msg;
}

function setup_board( msg )
{
    update_style(msg);
    update_session(msg);

    current_game = find_game_by_name(msg.data.game);
    current_game.free_space_on = msg.data.free;
    if( current_game == null )
    {
        report_error("Game not found: " + msg.data.game);
        return;
    }

    while( clickedNumbers.length > 0)
    {
        const id = parseInt(clickedNumbers[0].substring(1));
        deactiviate_spot(id);
    }
    clickedNumbers = [];

    const game_name = document.getElementById('game_preview_name');
    game_name.innerHTML = current_game.name;
    const large_game_name = document.getElementById('large_game_preview_name');
    large_game_name.innerHTML = current_game.name;
    const free_space = document.getElementById('free_space_label');
    free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');
    const large_free_space = document.getElementById('large_free_space_label');
    large_free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');
    update_preview_boards(current_game);

    let extraInfo = document.getElementById('extraInfo');
    extraInfo.innerHTML = " ";

    for(const element of msg.data.active)
    {
        const id = element;
        activiate_spot(id);
    }

}
function update_style(msg)
{
    try
    {
        const style = msg.style;
        styleVariables.selectedColor = style.selectedColor;
        styleVariables.selectedTextColor = style.selectedTextColor;
        styleVariables.unselectedColor = style.unselectedColor;
        styleVariables.unselectedTextColor = style.unselectedTextColor;
    }
    catch(e)
    {
        console.log(`Failed to apply style: ${e}`);
    }
}

function update_session(msg)
{
    try
    {
        const session = msg.session;
        specialNumbers = session.numbers;
        welcomeMessage = session.welcome;
    }
    catch(e)
    {
        console.log(`Failed to apply session info: ${e}`);
    }
}

function update_free( free )
{
    current_game.free_space_on = free;
    const free_space = document.getElementById('free_space_label');
    free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');
    update_preview_boards(current_game);

    const large_free_space = document.getElementById('free_space_label');
    large_free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');
}

function update_preview_boards(game)
{
    //Loop through entries in table and determine if they need to be updated
    update_preview_board(game, document.getElementById('preview_board'), 0);
    update_preview_board(game, document.getElementById('large_preview_board'), 0);

    update_preview_board(game, document.getElementById('preview_board_2'), 1);
    update_preview_board(game, document.getElementById('large_preview_board_2'), 1);

    const slash = document.getElementById('optional_slash');
    slash.hidden = true;
    const arrow = document.getElementById('transition_arrow');
    arrow.hidden = true;

    const large_slash = document.getElementById('large_optional_slash');
    large_slash.hidden = true;
    const large_arrow = document.getElementById('large_transition_arrow');
    large_arrow.hidden = true;

    if( game.board_count > 1 )
    {
        if( current_game.transitional ){
            arrow.hidden = false;
            large_arrow.hidden = false;
        }
        else if( current_game.optional ){
            slash.hidden = false;
            large_slash.hidden = false;
        }
    }

}

function update_preview_board(game, board, board_id)
{
    if( board_id >= game.board_count || ( board_id > 0 && game.board_count === undefined) )
    {
        board.hidden = true;
        return;
    }
    board.hidden = false;

    for( let i = 0; i < 5; i++ )
    {
        for( let j = 0; j < 15; j++ )
        {
            const child = board.children[i].children[j];
            if( game_contains_point(game, i, j, board_id))
            {
                child.style.backgroundColor = styleVariables.selectedColor;
                child.style.color = styleVariables.selectedTextColor;
            }
            else if( child ){
                child.style.backgroundColor = styleVariables.unselectedColor;
                child.style.color = styleVariables.unselectedTextColor;
            }
        }
    }
}

function find_td( id )
{
    return document.getElementById(id);
}

function activiate_spot( id )
{
    const letters = ['B', 'I', 'N', 'G', 'O'];
    id = id.replace(/[A-Z]/, '');
    id = parseInt(id);
    const letter = letters[Math.floor((id - 1)/15)];
    const number = letter + id;

    const index = clickedNumbers.indexOf(number);
    if( index == -1 )
    {
        console.log(number);
        const spot = find_td(number);
        spot.style.backgroundColor = styleVariables.selectedColor;
        spot.style.color = styleVariables.selectedTextColor;

        clickedNumbers.unshift(number);

        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = number;
        tr.appendChild(td);

        const clickedNumbersTable = document.getElementById('clickedNumbersTable');
        clickedNumbersTable.insertBefore(tr, clickedNumbersTable.firstChild);
        update_last_number();
    }

}

function deactiviate_spot( id )
{
    const letters = ['B', 'I', 'N', 'G', 'O'];
    id = parseInt(id);
    const letter = letters[Math.floor((id - 1)/15)];
    const number = letter + id;
    const index = clickedNumbers.indexOf(number);
    if( index > -1 )
    {
        clickedNumbers.splice(index, 1);
        const clickedNumbersTable = document.getElementById('clickedNumbersTable');
        clickedNumbersTable.removeChild(clickedNumbersTable.children[index]);

        const spot = find_td(number);
        spot.style.backgroundColor = styleVariables.unselectedColor;
        spot.style.color = styleVariables.unselectedTextColor;
        update_last_number();
    }
}

function update_last_number()
{
    const lastNumber = document.getElementById('lastNumber');
    if( clickedNumbers.length > 0 )
    {
        lastNumber.innerHTML = "The last number was " + clickedNumbers[0];
        //Remove the first letter of clicked number to get the number and cast to int
        const id = parseInt(clickedNumbers[0].substring(1));
        if (specialNumbers && id in specialNumbers) {
            document.getElementById('extraInfo').innerHTML = specialNumbers[id];
        }
        else{
            document.getElementById('extraInfo').innerHTML = " ";
        }
    }
    else
    {
        lastNumber.innerHTML = "Waiting for first number";
    }

}

function createHeaderDiv()
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
    numberRatioDiv.appendChild(numberRatio);

    const previewBoard = createPreviewBoard("");
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
    headerInfoDiv.appendChild(extraInfo);



    const items = [
        topHeaderDiv
    ]

    for (const element of items) {
        headerDiv.appendChild(element);
    }


    return headerDiv;
}
function createCenterDiv()
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
    centerDiv.appendChild(lettersTable);
    centerDiv.appendChild(table);

    return centerDiv;
}

function createFooterDiv()
{
    const footerDiv = document.createElement('div');
    footerDiv.id = 'footerDiv';

    // Create a container for the clicked numbers
    const clickedNumbersDiv = document.createElement('div');
    clickedNumbersDiv.id = 'clickedNumbersDiv';
    // Create paragraph to display the last clicked number
    const lastNumberCalled = document.createElement('p');
    lastNumberCalled.id = 'lastNumberCalled';
    lastNumberCalled.innerHTML = "Called Numbers";
    clickedNumbersDiv.appendChild(lastNumberCalled);
    // Create a table for the clicked numbers
    const clickedNumbersTable = document.createElement('table');
    clickedNumbersTable.id = 'clickedNumbersTable';
    clickedNumbersDiv.appendChild(clickedNumbersTable);


    footerDiv.append(clickedNumbersDiv);
    return footerDiv;
}


function createPreviewBoard(ident)
{
    let preview = document.getElementById(ident + 'preview_div');
    if( preview == null )
    {
        preview = document.createElement('div');
        preview.id = ident + 'preview_div';
    }

    const preview_table_div = document.createElement('div');
    preview_table_div.id = ident + 'preview_table_div';
    const table = create_table(document, ident + 'preview_board', Survivor(), '10px' );
    table.hidden = true;

    const arrow = document.createElement('p');
    arrow.id = ident + 'transition_arrow';
    arrow.innerHTML = '&#x27A7;';
    arrow.hidden = true;

    const slash = document.createElement('p');
    slash.className = "multi_table_operator";
    slash.id = ident + 'optional_slash';
    slash.innerHTML = '&#x2215;';
    slash.hidden = true;

    const table2 = create_table(document, ident + 'preview_board_2', Survivor(), '10px', 1 );
    table2.hidden = true;

    preview_table_div.appendChild(table);
    preview_table_div.appendChild(arrow);
    preview_table_div.appendChild(slash);
    preview_table_div.appendChild(table2);

    const game_name_label = document.createElement('p');
    game_name_label.id = ident + 'game_preview_name';
    game_name_label.innerHTML = "";

    const free_space_label = document.createElement('p');
    free_space_label.id = ident + 'free_space_label';
    free_space_label.innerHTML = "";

    preview.appendChild(game_name_label);
    preview.appendChild(preview_table_div);
    preview.appendChild(free_space_label);
    return preview;
}

function createLargePreviewBoard()
{
    const large_preview_div = createPreviewBoard("large_");
    large_preview_div.addEventListener('click', function(event) {
        const div = document.getElementById('large_preview_div');
        div.hidden = true;
    });

    const preview_board = document.getElementById('large_preview_board');
    preview_board.hidden = false;
    large_preview_div.hidden = true;

    document.addEventListener('click', function(event) {
        const large_preview_div = document.getElementById('large_preview_div');
        if( !large_preview_div.hidden ){
            large_preview_div.hidden = true;
            event.stopPropagation();
        }
    }, true);
}