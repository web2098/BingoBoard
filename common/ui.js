
var clickedNumbers = []; // Array to store the clicked numbers
let specialNumbers = null; // Object to store special numbers and their meanings
let specialNumberInteractions = {};
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

function find_td( id )
{
    return document.getElementById(id);
}

function set_special_numbers( numbers )
{
    specialNumbers = numbers;
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
    //Update the large preview
    const game_name = document.getElementById('game_preview_name');
    game_name.innerHTML = current_game.name;
    const large_game_name = document.getElementById('large_game_preview_name');
    large_game_name.innerHTML = current_game.name;
    const free_space = document.getElementById('free_space_label');
    free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');
    const large_free_space = document.getElementById('large_free_space_label');
    large_free_space.innerHTML = 'Free Space is ' + (current_game.free_space_on? 'On' : 'Off');

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

function activiate_spot( id, enable_events = true )
{
    const number = get_spot_id(id);

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
        update_last_number(enable_events);
    }
}

function deactiviate_spot( id, enable_events = true  )
{
    const number = get_spot_id(id);
    const index = clickedNumbers.indexOf(number);
    if( index > -1 )
    {
        clickedNumbers.splice(index, 1);
        const clickedNumbersTable = document.getElementById('clickedNumbersTable');
        clickedNumbersTable.removeChild(clickedNumbersTable.children[index]);

        const spot = find_td(number);
        spot.style.backgroundColor = styleVariables.unselectedColor;
        spot.style.color = styleVariables.unselectedTextColor;
        update_last_number(enable_events);
    }
}

function update_last_number(enable_events)
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

        if( enable_events )
        {
            if (specialNumberInteractions && id in specialNumberInteractions) {
                const interaction = specialNumberInteractions[id];
                interaction();
            }
        }
    }
    else
    {
        lastNumber.innerHTML = "Waiting for first number";
        document.getElementById('extraInfo').innerHTML = " ";
    }


    var numberRatio = document.getElementById('numberRatio');
    numberRatio.innerHTML = clickedNumbers.length + "/75" + "(" + (75 - clickedNumbers.length) + " left)";
}


function createHeaderDiv()
{
    const topHeaderDiv = document.createElement('div');
    topHeaderDiv.id = 'topHeaderDiv';

    const headerInfoDiv = document.createElement('div');
    headerInfoDiv.id = 'headerInfoDiv';

    const qrcode = document.createElement('div');
    qrcode.id = 'qrcode';


    const previewBoard = createPreviewBoard("", '.4vw');
    previewBoard.addEventListener('click', function(event) {
        const div = document.getElementById('large_preview_div');
        div.hidden = !div.hidden;
    });

    topHeaderDiv.appendChild(previewBoard);
    topHeaderDiv.appendChild(headerInfoDiv);
    topHeaderDiv.appendChild(qrcode);

    // Create paragraph to display the last clicked number
    const lastNumber = document.createElement('p');
    lastNumber.id = 'lastNumber';
    lastNumber.innerHTML = "Waiting for game from server";

    const numberRatioDiv = document.createElement('div');
    numberRatioDiv.id = 'numberRatioDiv';

    const numberRatio = document.createElement('p');
    numberRatio.innerHTML = '0/75 (75 left)';
    numberRatio.id = 'numberRatio';
    numberRatioDiv.appendChild(numberRatio);

    const extraInfo = document.createElement('p');
    extraInfo.id = 'extraInfo';
    extraInfo.innerHTML = "";
    headerInfoDiv.appendChild(lastNumber);
    headerInfoDiv.appendChild(numberRatioDiv);
    headerInfoDiv.appendChild(extraInfo);

    return topHeaderDiv;
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


function createPreviewBoard(ident, freeSize)
{
    let preview = document.getElementById(ident + 'preview_div');
    if( preview == null )
    {
        preview = document.createElement('div');
        preview.id = ident + 'preview_div';
    }

    const preview_table_div = document.createElement('div');
    preview_table_div.id = ident + 'preview_table_div';
    const table = create_table(document, ident + 'preview_board', Survivor(), freeSize );
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

    const table2 = create_table(document, ident + 'preview_board_2', Survivor(), freeSize, 1 );
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
    const large_preview_div = createPreviewBoard("large_", '200%');
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

function update_last_number_called( msg )
{
    document.getElementById('lastNumber').innerHTML = msg;
}

function report_error( msg )
{
    log_message(msg);
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        return;
    }
    const toast = document.createElement('div');
    toast.className ='toast-error';
    toast.textContent = msg;

    // Append toast to the container
    toastContainer.appendChild(toast);

    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Automatically remove toast after 10 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500); // Wait for animation to complete
    }, 10000);
}


function report_message( msg )
{
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error(msg);
        return;
    }
    const toast = document.createElement('div');
    toast.className ='toast-error';
    toast.textContent = msg;

    // Append toast to the container
    toastContainer.appendChild(toast);

    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Automatically remove toast after 10 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500); // Wait for animation to complete
    }, 10000);
}

function add_special_number_interaction( number, interaction )
{
    if( specialNumberInteractions === null )
    {
        specialNumberInteractions = {};
    }
    specialNumberInteractions[number] = interaction;
}

function log_message( msg)
{
    console.log(msg);
    const textArea = document.getElementById('log_textarea');
    if (!textArea) {
        return;
    }
    textArea.value += msg + '\n';
    textArea.scrollTop = textArea.scrollHeight; // Scroll to the bottom
    //Remove lines more then 1000 lines
    const lines = textArea.value.split('\n');
    if (lines.length > 1000) {
        textArea.value = lines.slice(lines.length - 1000).join('\n');
    }
}