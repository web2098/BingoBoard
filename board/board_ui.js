
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
    const qrcode = new QRCode(element, {
        text: data,
        width: 200,
        height: 200,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
    });
}

function createCenterDivWithLastNumbers()
{
    const div = createCenterDiv();

    const lastNumberDiv = document.createElement('div');

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

    div.appendChild(clickedNumbersDiv);

    return div;
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
            numberTimes = [];
            setTemporaryItem('clickedNumbers', JSON.stringify(clickedNumbers));
            setTemporaryItem('numberTimes', JSON.stringify(numberTimes));
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
