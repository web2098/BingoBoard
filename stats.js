

function generateRandomData()
{
    console.log('Random parameter is true');
    return generateRandomGameHistory();

}

function getGameHistory()
{
    // Function to get query parameters
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            random: params.get('random'),
            data: params.get('data')
        };
    }

    // Get the query parameters
    const queryParams = getQueryParams();

    // Check if the 'random' parameter is true
    if (queryParams.random === 'true') {
        data =  generateRandomData();
        sessionStorage.setItem('game_history', JSON.stringify(data));
    } else if (queryParams.data) {
        console.log("Data supplied in query parameters");
        inData = queryParams.data;
        // url decode the data
        inData = atob(inData);
        inData = decodeURIComponent(inData);
        inData = JSON.parse(inData);
        data = [];
        for (var i = 0; i < inData.length; i++) {
            game_data = {
                game: {
                    name: inData[i].name
                },
                numbers: inData[i].numbers,
                number_times: inData[i].number_times
            };
            data.push(game_data);
        }
        console.log(data);
        sessionStorage.setItem('game_history', JSON.stringify(data));
    }
    return JSON.parse(sessionStorage.getItem('game_history'));

}

function parseStatsInfo(game_history, filterGames)
{
    data = []
    for( var i = 0; i < game_history.length; i++){
        if( game_history[i].game && ( filterGames === undefined || !filterGames.includes(game_history[i].game.name)) ){
            data.push( game_history[i].numbers );
        }
    }

    return data;
}

function statsFromData(data)
{
    var stats = {};
    for (var i = 0; i < data.length; i++) {
        var game = data[i];
        console.log(game)
        for (var j = 0; j < game.length; j++) {
            var number = game[j];
            if (stats[number]) {
                stats[number]++;
            } else {
                stats[number] = 1;
            }
        }
    }
    console.log(stats);
    return stats;
}

function fillStatsInfo(stats, suffix)
{
    var sortable = [];
    for (var number in stats) {
        sortable.push([number, stats[number]]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    var top10 = sortable.slice(0, 10);
    var top10Numbers = document.getElementById('topTenNumbers'+suffix);
    top10Numbers.innerHTML = 'Top 10 Numbers: ' + top10.map(function(a) {
        return `${a[0]}(${a[1]})`;
    }).join(', ');


    var bottom10 = sortable.slice(-10);
    var bottom10Numbers = document.getElementById('bottomTenNumbers'+suffix);
    bottom10Numbers.innerHTML = 'Bottom 10 Numbers: ' + bottom10.map(function(a) {
        return `${a[0]}(${a[1]})`;
    }).join(', ');

    letters = { 0: 'B', 1: 'I', 2: 'N', 3: 'G', 4: 'O'}
    var notCalled = [];
    for (var i = 1; i <= 75; i++) {
        letter = letters[Math.floor((i-1) / 15)];
        if (!stats[letter + i]) {
            notCalled.push(letter + i);
        }
    }
    var notCalledNumbers = document.getElementById('notCalledNumbers'+suffix);
    if (notCalled.length > 0)
    {
        notCalledNumbers.innerHTML = 'Numbers not called: ' + notCalled.join(', ');
    }
    else
    {
        notCalledNumbers.innerHTML = 'All Numbers were called!';
    }
}

function generateHeatMap(stats)
{
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

    percents = []
    // Loop over numbers in stats and fine the highest one
    largest = 0;
    largest_number = 0;
    for (var number in stats) {
        if (stats[number] > largest) {
            largest = stats[number];
            largest_number = number;
        }
    }

    //Create Table
    var letters = ['B', 'I', 'N', 'G', 'O'];
    var table = document.createElement('table');
    table.id = 'numbersTable';
    var counter = 1;
    for (var i = 0; i < 5; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < 15; j++) {
            var id = letters[i] + counter;
            var td = document.createElement('td');
            td.innerHTML = counter;
            td.style.backgroundColor = styleVariables.unselectedColor;
            td.style.color = styleVariables.unselectedTextColor;


            var overlay = document.createElement('div');
            overlay.className = 'fill-overlay';
            overlay.textContent = counter++;
            td.appendChild(overlay);

            // Get the percentage value from the data attribute
            if ( id in stats ){
                var percentage = stats[id] / largest * 100;
            }
            else{
                var percentage = 0;
            }

            // Set the height of the overlay based on the percentage
            overlay.style.height = percentage + '%';
            overlay.style.backgroundColor = styleVariables.selectedColor;
            overlay.style.color = styleVariables.selectedTextColor;

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    var div = document.getElementById('heat_map');
    div.appendChild(table);
}
function millisecondsToMinutes(milliseconds) {
    return milliseconds / 60000;
}

function getHallOfFameRecord(game, score, fastest)
{
    var hallOfFame = JSON.parse(localStorage.getItem('hallOfFame'));
    if (!hallOfFame) {
        hallOfFame = {};
    }
    if (!hallOfFame[game]) {
        hallOfFame[game] = {
            'Fastest': 76,
            'Fastest_Date': '',
            'Slowest': 0,
            'Slowest_Date': ''
        };
    }

    if( fastest )
    {
        var current = hallOfFame[game]['Fastest'];
        if( score < current ){
            hallOfFame[game]['Fastest'] = score;
            //Store the state without time

            hallOfFame[game]['Fastest_Date'] = new Date().toLocaleDateString();
        }
        record =  hallOfFame[game]['Fastest'] + ' on ' + hallOfFame[game]['Fastest_Date'];
    }
    else
    {
        var current = hallOfFame[game]['Slowest'];
        if( score > current ){
            hallOfFame[game]['Slowest'] = score;
            hallOfFame[game]['Slowest_Date'] = new Date().toLocaleDateString();
        }
        record = hallOfFame[game]['Slowest'] + ' on ' + hallOfFame[game]['Slowest_Date'];
    }

    localStorage.setItem('hallOfFame', JSON.stringify(hallOfFame));
    return record;
}

function calculateMath(duration, numbers, called)
{
    console.log('Calculating math');
    console.log('Duration: ' + duration);
    console.log('Numbers: ' + numbers);
    var numbersPerSecond = called.length / (duration / 1000);

    if( numbers === undefined || numbers.length === 0)
        return {
            numbersPerSecond: numbersPerSecond,
            winners: [called.length]
        };

    var timeBetweenNumbers = [];
    for (var i = 1; i < numbers.length; i++) {
        timeBetweenNumbers.push( numbers[i - 1] - numbers[i]);
    }
    console.log('Time between numbers: ' + timeBetweenNumbers);
    var originalTimeBetweenNumbers = timeBetweenNumbers.slice();

    var mean = timeBetweenNumbers.reduce((a, b) => a + b, 0) / timeBetweenNumbers.length;
    console.log('Mean: ' + mean);
    var stdDev = Math.sqrt(timeBetweenNumbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (timeBetweenNumbers.length-1));
    console.log('Standard Deviation: ' + stdDev);

    var median = timeBetweenNumbers.sort((a, b) => a - b)[Math.floor(timeBetweenNumbers.length / 2)];
    console.log('Median: ' + median);

    var threshold = median + ( 2 * stdDev );
    console.log('Threshold: ' + threshold);

    var outliers = timeBetweenNumbers.filter(x => x > threshold);
    console.log('Outliers: ' + outliers);

    var outlierIndicies = [];
    for (var i = 0; i < outliers.length; i++) {
        outlierIndicies.push(numbers.length - (originalTimeBetweenNumbers.indexOf(outliers[i])+1));
    }
    console.log('Outlier Indicies: ' + outlierIndicies);

    outlierIndicies = outlierIndicies.reverse();
    outlierIndicies.push(numbers.length);

    return {
        numbersPerSecond: numbersPerSecond,
        winners: outlierIndicies
    };
}

function createGameInfoTable()
{
    var div = document.getElementById('game_info');
    //Create a table that looks like:
    //| Game | Time | Numbers To First Winner | Numbers To Second Winner | Fastest Win | Slowest Win

    var table = document.createElement('table');
    //Add a header to the table
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.innerHTML = 'Game';
    tr.appendChild(th);

    th = document.createElement('th');
    th.innerHTML = 'Time';
    tr.appendChild(th);

    th = document.createElement('th');
    th.innerHTML = 'NPS';
    tr.appendChild(th);

    th = document.createElement('th');
    th.innerHTML = 'Winners';
    tr.appendChild(th);

    th = document.createElement('th');
    th.innerHTML = 'Fastest Win';
    tr.appendChild(th);

    th = document.createElement('th');
    th.innerHTML = 'Slowest Win';
    tr.appendChild(th);

    table.appendChild(tr);


    for( var i = 0; i < game_history.length; i++){

        var result = calculateMath( game_history[i].duration, game_history[i].number_times, game_history[i].numbers );

        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.innerHTML = game_history[i].game.name;
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = millisecondsToMinutes(game_history[i].duration).toFixed(1) + ' minutes';
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = result.numbersPerSecond.toFixed(2) + ' / second';
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = result.winners;
        tr.appendChild(td);


        td = document.createElement('td');
        td.innerHTML = getHallOfFameRecord(game_history[i].game.name, result.winners[0], true);
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = getHallOfFameRecord(game_history[i].game.name, result.winners[-1], false);
        tr.appendChild(td);

        table.appendChild(tr);
    }


    div.appendChild(table);
}

window.onload = function() {
    game_history = getGameHistory();

    if( game_history ){
        var data = parseStatsInfo(game_history, undefined);
        var data_withoutblackout = parseStatsInfo(game_history, ['Black Out Survivor', 'Blackout']);

        var gamesPlayed = document.getElementById('gamesPlayed');
        gamesPlayed.innerHTML = `All Game Stats: ${data.length}`;
        fillStatsInfo(statsFromData(data), '')

        var gamesPlayed = document.getElementById('gamesPlayed_filtered');
        gamesPlayed.innerHTML = `Game Stats Without blackout: ${data_withoutblackout.length}`;
        fillStatsInfo(statsFromData(data_withoutblackout), '_withoutBlackout');
        generateHeatMap(statsFromData(data_withoutblackout));
        //Loop through each game and calculate the stats

        createGameInfoTable(game_history);

        // Create save button
        var saveButton = document.createElement('button');
        saveButton.innerHTML = 'Save Games';
        saveButton.onclick = function() {
            var save_data = []
            for( var i = 0; i < game_history.length; i++){
                var name = 'unknown';

                if( game_history[i].game ){
                    name = game_history[i].game.name;
                }

                save_data.push( {
                    name : name,
                    numbers : game_history[i].numbers,
                    number_times: game_history[i].number_times,
                    duration: game_history[i].duration
                });
            }

            // Create a Blob with the data
            var blob = new Blob([JSON.stringify(save_data)], {type: 'text/plain'});

            // Create a link for the Blob
            var url = URL.createObjectURL(blob);

            // Create a download link
            var downloadLink = document.createElement('a');
            downloadLink.download = 'clickedNumbersHistory.txt';
            downloadLink.href = url;

            // Trigger the download
            downloadLink.click();
        }
        //center button increase size to 50px and add padding to to the top of 10px
        saveButton.style = 'display: block; margin: auto; font-size: 40px; margin-top: 30px;';
        document.body.appendChild(saveButton);
    }
    //center button increase size to 50px and add padding to to the top of 10px
    var back = document.createElement('button');
    back.innerHTML = 'Back';
    back.onclick = function() {
        sessionStorage.removeItem('game_history');
        window.history.back();
    }
    back.style = 'display: block; margin: auto; font-size: 40px; margin-top: 30px;';
    document.body.appendChild(back);
};
