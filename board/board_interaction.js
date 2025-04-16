function saveCurrentGame()
{
    game = {
        game: current_game,
        numbers: clickedNumbers,
        duration: new Date().getTime() - start_time,
        number_times: numberTimes // TODO add number times
    };
    var game_history = getTemporaryItem('game_history');
    if( game_history == null ){
        game_history = [];
    }
    else{
        game_history = JSON.parse(game_history);
    }
    game_history.push(game);
    setTemporaryItem('game_history', JSON.stringify(game_history));
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
    }
}

function enable_main_board_interaction()
{
    const table = document.getElementById('numbersTable');
    const cells = table.getElementsByTagName('td');
    for (let i = 0; i < cells.length; i++) {
        cells[i].addEventListener('click', function() {
            const id = parseInt(cells[i].id.substring(1));
            if (clickedNumbers.includes(cells[i].id)) {
                deactiviate_spot(id);
                sendDeactivateNumber(id, clickedNumbers);
            } else {
                activiate_spot(id);
                sendActivateNumber(id, clickedNumbers);
            }
        });
    }

    enable_free_space_interaction();
}

function enable_free_space_interaction()
{
    free_space_label.addEventListener('click', function(event) {
        event.stopPropagation();
        if (current_game.free_space_dynamic){
            current_game.free_space_on=!current_game.free_space_on;
            update_free(current_game.free_space_on);
            send_update_free_space();
        }
    });
}