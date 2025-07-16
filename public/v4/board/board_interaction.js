var numberTimes = [];
var hotfix_22_selection = null;

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
        setTemporaryItem('clickedNumbers', JSON.stringify(clickedNumbers));
        setTemporaryItem('numberTimes', JSON.stringify(numberTimes));
    }
    sessionStorage.removeItem('hot-fix-22-selection');

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

function showHotFixMessage(index)
{
    if( hotfix_22_selection != null && hotfix_22_selection == index )
    {
        report_message("Hotfix 22: Play 22 NOW!");
    }
}

function enable_main_board_interaction()
{
    hotfix_22_selection = null;
    const enable_hotfix_22 = getItemWithDefault('hot-fix-22-enabled') == 'true';
    if( enable_hotfix_22 )
    {
        console.log("Hotfix 22 enabled: " + getTemporaryItem('hot-fix-22-selection', null));
        if( getTemporaryItem('hot-fix-22-selection', null) != null ){
            console.log("Hotfix 22 selection found in local storage");
            hotfix_22_selection = JSON.parse(getTemporaryItem('hot-fix-22-selection'))["value"];
        }
        else{
            //Pick a random number from 1 - 75
            hotfix_22_selection = Math.floor(Math.random() * 75) + 1;
            setTemporaryItem('hot-fix-22-selection', JSON.stringify({value: hotfix_22_selection}));
            console.log("Hotfix 22 selection set to: " + hotfix_22_selection);
        }
    }

    const table = document.getElementById('numbersTable');
    const cells = table.getElementsByTagName('td');
    for (let i = 0; i < cells.length; i++) {
        cells[i].addEventListener('click', function() {
            const id = parseInt(cells[i].id.substring(1));
            if (clickedNumbers.includes(cells[i].id)) {
                numberTimes.splice(numberTimes.indexOf(id), 1);
                deactiviate_spot(id);
                sendDeactivateNumber(id, clickedNumbers);
            } else {
                numberTimes.unshift(new Date().getTime() - start_time);
                activiate_spot(id);
                sendActivateNumber(id, clickedNumbers);
            }
            setTemporaryItem('clickedNumbers', JSON.stringify(clickedNumbers));
            setTemporaryItem('numberTimes', JSON.stringify(numberTimes));
            showHotFixMessage(clickedNumbers.length);
        });
    }

    numbers = JSON.parse(getTemporaryItem('clickedNumbers'));
    console.log("Clicked numbers: ", numbers);

    if( numbers != null)
    {
        numbers.reverse();
        for (const element of numbers) {
            const id = parseInt(element.substring(1));
            activiate_spot(id);
        }
    }

    times = JSON.parse(getTemporaryItem('numberTimes'));
    console.log("Clicked times: ", times);
    if( times != null)
    {
        for (const element of times) {
            numberTimes.unshift(element);
        }
    }

    enable_free_space_interaction();
    showHotFixMessage(1);
}

function enable_free_space_interaction()
{
    free_space_label.addEventListener('click', function(event) {
        event.stopPropagation();
        if (current_game.free_space_dynamic){
            current_game.free_space_on=!current_game.free_space_on;
            update_free(current_game.free_space_on);
            send_update_free_space();

            setTemporaryItem('selected_game', JSON.stringify(current_game));
        }
    });
}