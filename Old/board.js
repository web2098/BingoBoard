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

function loadCSSSettings() {
    document.documentElement.style.setProperty('--main-bg-color', localStorage.getItem('main-bg-color'));
    document.documentElement.style.setProperty('--main-font-color', localStorage.getItem('main-font-color'));
    document.documentElement.style.setProperty('--item-font-size', localStorage.getItem('item-font-size'));
}

var current_game = undefined;
var free_space_on = true;
var clickedNumbers = []; // Array to store the clicked numbers
var numberTimes = []

var start_time = new Date().getTime();
var room_connection = null;
let retryTime = 1000; // Initial retry time in milliseconds


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


window.addEventListener('resize', updateRectangleSize);
window.onload = function() {
    current_game = JSON.parse(getTemporaryItem('selected_game'))
    if( current_game )
    {
        free_space_on = current_game.free_space_on
    }

    loadCSSSettings();

    updateRectangleSize();

    var page_div = document.getElementById('page_div');
    var header_div = createHeaderDiv();
    var center_div = createCenterDiv();
    var footer_div = createFooterDiv();

    var layout = [header_div, center_div];
    if( styleVariables.lastNumberDir === "top"){
        for (var i = 0; i < layout.length; i++) {
            page_div.appendChild(layout[i]);
        }
    } else {
        for (var i = layout.length - 1; i >= 0; i--) {
            page_div.appendChild(layout[i]);
        }
    }

    page_div.appendChild(footer_div);

    var large_preview_div = document.getElementById('large_preview_div');
    large_preview_div.appendChild(createPreviewTable());
    large_preview_div.addEventListener('click', function(event) {
        var div = document.getElementById('large_preview_div');
        div.hidden = true;
    });
    large_preview_div.hidden = true;


    document.addEventListener('click', function(event) {
        var large_preview_div = document.getElementById('large_preview_div');
        if( !large_preview_div.hidden ){
            var specificElement = document.getElementById('large_free_space_label');
            if (event.target !== specificElement) {
                large_preview_div.hidden = true;
                event.stopPropagation();
            }
        }
    }, true);

    connectToServer();
}

function updatePreviewBoards()
{
    update_main_board_num(current_game, 'preview_board', 0, '10px');
    var free_space_label = document.getElementById('free_space_label');
    free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');

    update_main_board_num(current_game, 'large_preview_board', 0, '50px');
    var large_free_space_label = document.getElementById('large_free_space_label');
    large_free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');
}

function createPreviewTable()
{
    var inDiv = document.createElement('div');
    inDiv.id = 'large_in_view_div';
    if( current_game )
    {
        var preview_table_div = document.createElement('div');
        preview_table_div.id = 'large_preview_table_div';
        var table = create_table(document, 'large_preview_board', current_game, '50px' );

        var arrow = document.createElement('p');
        arrow.id = 'large_transition_arrow';
        arrow.innerHTML = '&#x27A7;';

        var slash = document.createElement('p');
        slash.className = "multi_table_operator";
        slash.id = 'large_optional_slash';
        slash.innerHTML = '&#x2215;';
        slash.style.fontSize = '10vh';

        var table2 = create_table(document, 'large_preview_board_2', current_game, '50px', board_num = 1 );

        var game_name_label = document.createElement('p');
        game_name_label.id = 'large_game_preview_name';
        game_name_label.innerHTML = current_game.name;

        var free_space_label = document.createElement('p');
        free_space_label.id = 'large_free_space_label';
        free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');
        free_space_label.addEventListener('click', function(event) {
            event.stopPropagation();
            update_free_space();
            updatePreviewBoards();
        });

        preview_table_div.appendChild(table);
        preview_table_div.style['justify-content'] = 'center';
        if( current_game.transitional ){
            preview_table_div.appendChild(arrow);
        }
        if( current_game.optional ){
            preview_table_div.appendChild(slash);
        }
        if( current_game.board_count > 1 ){
            preview_table_div.appendChild(table2);
            preview_table_div.style['justify-content'] = 'space-between';
        }
        inDiv.appendChild(game_name_label);
        inDiv.appendChild(preview_table_div);
        inDiv.appendChild(free_space_label);
    }
    return inDiv;
}

function createHeaderDiv()
{
    var headerDiv = document.createElement('div');
    headerDiv.id = 'headerDiv';

    if( styleVariables.lastDirectionOn === "false" ) {
        return headerDiv;
    }

    if( current_game )
    {
        var preview = document.createElement('div');
        preview.id = 'preview_div';
        preview.addEventListener('click', function(event) {
            var div = document.getElementById('large_preview_div');
            div.hidden = !div.hidden;
        });

        var preview_table_div = document.createElement('div');
        preview_table_div.id = 'preview_table_div';
        var table = create_table(document, 'preview_board', current_game, '10px' );

        var arrow = document.createElement('p');
        arrow.id = 'transition_arrow';
        arrow.innerHTML = '&#x27A7;';

        var slash = document.createElement('p');
        slash.className = "multi_table_operator";
        slash.id = 'optional_slash';
        slash.innerHTML = '&#x2215;';
        slash.style.fontSize = '2vh';

        var table2 = create_table(document, 'preview_board_2', current_game, '10px', board_num = 1 );

        var game_name_label = document.createElement('p');
        game_name_label.id = 'game_preview_name';
        game_name_label.innerHTML = current_game.name;

        var free_space_label = document.createElement('p');
        free_space_label.id = 'free_space_label';
        free_space_label.innerHTML = 'Free Space is ' + (current_game.free_space_on ? 'On' : 'Off');
        free_space_label.addEventListener('click', function(event) {
            event.stopPropagation();
            update_free_space();
            updatePreviewBoards();
        });

        preview_table_div.appendChild(table);
        preview_table_div.style['justify-content'] = 'center';
        if( current_game.transitional ){
            preview_table_div.appendChild(arrow);
        }
        if( current_game.optional ) {
            preview_table_div.appendChild(slash);
        }
        if( current_game.board_count > 1 ){
            preview_table_div.appendChild(table2);
            preview_table_div.style['justify-content'] = 'space-between';
        }
        preview.appendChild(game_name_label);
        preview.appendChild(preview_table_div);
        preview.appendChild(free_space_label);
        headerDiv.appendChild(preview);
    }


    var lastNumber = document.createElement('p');
    lastNumber.id = 'lastNumber';
    lastNumber.innerHTML = "Waiting for first number";
    // Create paragraph to display the last clicked number
    var extraInfo = document.createElement('p');
    extraInfo.id = 'extraInfo';
    extraInfo.innerHTML = "";

    var headerTextDiv = document.createElement('div');
    headerTextDiv.id = 'headerTextDiv';


    const right_side = document.createElement('right_side');
    right_side.id = 'right_side';
    const qrcode = document.createElement('div');
    qrcode.id = 'qrcode';

    const qrcode_text = document.createElement('p');
    qrcode_text.id = 'qrcode_text';
    qrcode_text.innerHTML = "Host not connected to server";


    right_side.append(qrcode_text);
    right_side.append(qrcode);

    const detailDiv = document.createElement('div');
    detailDiv.id = 'detailDiv';
    detailDiv.append(lastNumber);
    detailDiv.append(extraInfo);
    var items = [
        detailDiv
    ]

    if( styleVariables.lastNumberDir === "top" ) {
        for (var i = 0; i < items.length; i++) {
            headerTextDiv.appendChild(items[i]);
        }
    }
    else {
        for (var i = items.length - 1; i >= 0; i--) {
            headerTextDiv.appendChild(items[i]);
        }
    }

    const emoji_actions = document.createElement('emoji_actions');
    emoji_actions.id = 'emoji_actions';

    const clap = document.createElement('p');
    clap.id = 'clap';
    clap.innerHTML = "&#x1F44F;";

    clap.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction(getItemWithDefault('clap-message'));
    });

    // Add ghost and beer glass cheers
    const ghost = document.createElement('p');
    ghost.id = 'ghost';
    ghost.innerHTML = "&#x1F47B;";

    ghost.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction(getItemWithDefault('boo-message'));
    });

    const beer = document.createElement('p');
    beer.id = 'beer';
    beer.innerHTML = "&#x1F37B;";
    beer.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction(getItemWithDefault('beer-message'));
    });
    // Add a party emoji
    const party = document.createElement('p');
    party.id = 'party';
    party.innerHTML = "&#x1F973;";
    party.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction(getItemWithDefault('party-message'));
    });
    // Add a skull crossbones emoji
    const skull = document.createElement('p');
    skull.id = 'skull';
    skull.innerHTML = "&#x2620;";
    skull.addEventListener('click', function(event) {
        event.stopPropagation();
        showToTheDeath();
    });

    emoji_actions.append(clap);
    emoji_actions.append(ghost);
    emoji_actions.append(beer);
    emoji_actions.append(party);
    emoji_actions.append(skull);


    headerDiv.appendChild(headerTextDiv);
    headerDiv.appendChild(right_side);
    headerDiv.appendChild(emoji_actions);



    return headerDiv;
}

function createCenterDiv()
{
    var centerDiv = document.createElement('div');
    centerDiv.id = 'centerDiv';

    // Create a container for the tables
    var tablesContainer = document.createElement('div');
    tablesContainer.id = 'tablesContainer';

    //Create Table
    var table = document.createElement('table');
    table.id = 'numbersTable';
    var counter = 1;
    for (var i = 0; i < 5; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < 15; j++) {
            var td = document.createElement('td');
            td.innerHTML = counter++;
            td.style.backgroundColor = styleVariables.unselectedColor;
            td.style.color = styleVariables.unselectedTextColor;
            td.onclick = function() {
                var rowIndex = Array.prototype.indexOf.call(this.parentNode.parentNode.children, this.parentNode);
                var letter = lettersTable.children[rowIndex].firstChild.innerHTML;
                var number = letter + this.innerHTML;
                var index = clickedNumbers.indexOf(number);
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

                    var tr = document.createElement('tr');
                    var td = document.createElement('td');
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

                var numberRatio = document.getElementById('numberRatio');
                numberRatio.innerHTML = clickedNumbers.length + "/75" + "(" + (75 - clickedNumbers.length) + " left)";

            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    var letters = ['B', 'I', 'N', 'G', 'O'];
    // Create a table for the letters
    var lettersTable = document.createElement('table');
    lettersTable.id = 'lettersTable';
    for (var i = 0; i < 5; i++) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.innerHTML = letters[i];
        tr.appendChild(td);
        lettersTable.appendChild(tr);
    }
    tablesContainer.appendChild(lettersTable);
    tablesContainer.appendChild(table);

    // Create a container for the clicked numbers
    var clickedNumbersDiv = document.createElement('div');
    clickedNumbersDiv.id = 'clickedNumbersDiv';


    var numberRatioDiv = document.createElement('div');
    numberRatioDiv.id = 'numberRatioDiv';
    var numberRatio = document.createElement('p');
    numberRatio.innerHTML = '0/75 (75 left)';
    numberRatio.id = 'numberRatio';
    numberRatioDiv.appendChild(numberRatio);

    clickedNumbersDiv.appendChild(numberRatioDiv);


    // Create paragraph to display the last clicked number
    var lastNumberCalled = document.createElement('p');
    lastNumberCalled.id = 'lastNumberCalled';
    lastNumberCalled.innerHTML = "Called Numbers";
    clickedNumbersDiv.appendChild(lastNumberCalled);
    // Create a table for the clicked numbers
    var clickedNumbersTable = document.createElement('table');
    clickedNumbersTable.id = 'clickedNumbersTable';
    clickedNumbersDiv.appendChild(clickedNumbersTable);

    centerDiv.appendChild(tablesContainer);
    centerDiv.append(clickedNumbersDiv);

    return centerDiv;

}
function createFooterDiv()
{
    var footerDiv = document.createElement('div');
    footerDiv.id = 'footerDiv';

    // Create reset button
    var resetButton = document.createElement('button');
    resetButton.innerHTML = 'Select Board/End Game';
    resetButton.onclick = onReset;
    footerDiv.appendChild(resetButton);

    // Create end games button
    var endNight = document.createElement('button');
    endNight.innerHTML = 'End The Night';
    endNight.onclick = function() {
        if (clickedNumbers.length > 0) {
            saveCurrentGame();
            // Clear the array
            clickedNumbers = [];
        }
        var cells = document.getElementsByTagName('td');
        for (var i = 0; i < cells.length; i++) {
            cells[i].style.backgroundColor = '';
            cells[i].style.color = 'black';
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
