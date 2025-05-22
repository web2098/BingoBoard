

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
        const data =  generateRandomData();
        sessionStorage.setItem('game_history', JSON.stringify(data));
    } else if (queryParams.data) {
        console.log("Data supplied in query parameters");
        let inData = queryParams.data;
        // url decode the data
        inData = atob(inData);
        inData = decodeURIComponent(inData);
        inData = JSON.parse(inData);
        let data = [];
        for (const element of inData) {
            const game_data = {
                game: {
                    name: element.name
                },
                numbers: element.numbers,
                number_times: element.number_times
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
    let data = []
    for(const element of game_history){
        if( element.game && ( filterGames === undefined || !filterGames.includes(element.game.name)) ){
            data.push( element.numbers );
        }
    }

    return data;
}

function statsFromData(data)
{
    let stats = {};
    for (const element of data) {
        const game = element;
        console.log(game)
        for (const element of game) {
            const number = element;
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

function populateTotalHistory(stats)
{
    console.log('Populating Total History');
    let full_game_history = localStorage.getItem('full_game_history');
    console.log(full_game_history);
    if( full_game_history ){
        full_game_history = JSON.parse(full_game_history);
    }
    else{
        full_game_history = {
            numbers: {},
            updated: null
        };
    }

    let today = new Date().toLocaleDateString();
    //if the today is newer than the last update or the last update is null
    if( full_game_history["updated"] === null || today > full_game_history["updated"]){
        for( const number in stats ){
            if( full_game_history["numbers"][number] ){
                full_game_history["numbers"][number] += stats[number];
            }
            else{
                full_game_history["numbers"][number] = stats[number];
            }
        }
        full_game_history["updated"] = new Date().toLocaleDateString();
        console.log(full_game_history);
        localStorage.setItem('full_game_history', JSON.stringify(full_game_history));
    }
}

function fillStatsInfo(stats, suffix)
{
    let sortable = [];
    for (let number in stats) {
        sortable.push([number, stats[number]]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    let top10 = sortable.slice(0, 10);
    let top10Numbers = document.getElementById('topTenNumbers'+suffix);
    top10Numbers.innerHTML = 'Top 10 Numbers: ' + top10.map(function(a) {
        return `${a[0]}(${a[1]})`;
    }).join(', ');


    let bottom10 = sortable.slice(-10);
    let bottom10Numbers = document.getElementById('bottomTenNumbers'+suffix);
    bottom10Numbers.innerHTML = 'Bottom 10 Numbers: ' + bottom10.map(function(a) {
        return `${a[0]}(${a[1]})`;
    }).join(', ');

    const letters = { 0: 'B', 1: 'I', 2: 'N', 3: 'G', 4: 'O'}
    let notCalled = [];
    for (let i = 1; i <= 75; i++) {
        let letter = letters[Math.floor((i-1) / 15)];
        if (!stats[letter + i]) {
            notCalled.push(letter + i);
        }
    }
    let notCalledNumbers = document.getElementById('notCalledNumbers'+suffix);
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

    // Loop over numbers in stats and fine the highest one
    let largest = 0;
    for (let number in stats) {
        if (stats[number] > largest) {
            largest = stats[number];
        }
    }

    //Create Table
    const letters = ['B', 'I', 'N', 'G', 'O'];
    let table = document.createElement('table');
    table.id = 'numbersTable';
    let counter = 1;
    for (let i = 0; i < 5; i++) {
        let tr = document.createElement('tr');
        for (let j = 0; j < 15; j++) {
            let id = letters[i] + counter;
            let td = document.createElement('td');
            td.innerHTML = counter;
            td.style.backgroundColor = styleVariables.unselectedColor;
            td.style.color = styleVariables.unselectedTextColor;


            let overlay = document.createElement('div');
            overlay.className = 'fill-overlay';
            overlay.textContent = counter++;
            td.appendChild(overlay);

            // Get the percentage value from the data attribute
            let percentage = 0;
            if ( id in stats ){
                percentage = stats[id] / largest * 100;
            }

            // Set the height of the overlay based on the percentage
            overlay.style.height = percentage + '%';
            overlay.style.backgroundColor = styleVariables.selectedColor;
            overlay.style.color = styleVariables.selectedTextColor;

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    let div = document.getElementById('heat_map');
    div.appendChild(table);
}
function millisecondsToMinutes(milliseconds) {
    return milliseconds / 60000;
}

function getHallOfFameRecord(game, score, fastest)
{
    let hallOfFame = JSON.parse(localStorage.getItem('hallOfFame'));
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

    let record = {};
    if( fastest )
    {
        let current = hallOfFame[game]['Fastest'];
        if( score < current ){
            hallOfFame[game]['Fastest'] = score;
            //Store the state without time

            hallOfFame[game]['Fastest_Date'] = new Date().toLocaleDateString();
        }
        record = hallOfFame[game]['Fastest'] + ' on ' + hallOfFame[game]['Fastest_Date'];
    }
    else
    {
        let current = hallOfFame[game]['Slowest'];
        console.log('Current: ' + current);
        console.log('Score: ' + score);
        if( score > current ){
            hallOfFame[game]['Slowest'] = score;
            hallOfFame[game]['Slowest_Date'] = new Date().toLocaleDateString();
        }
        record = hallOfFame[game]['Slowest'] + ' on ' + hallOfFame[game]['Slowest_Date'];
    }

    localStorage.setItem('hallOfFame', JSON.stringify(hallOfFame));
    return record;
}

function getTimeBetweenNumbers(numbers)
{
    let timeBetweenNumbers = [];
    for (let i = 1; i < numbers.length; i++) {
        timeBetweenNumbers.push( numbers[i - 1] - numbers[i]);
    }
    return timeBetweenNumbers;
}

function calculateRealMath( timeBetweenNumbers )
{
    console.log('Time Between Numbers: ' + timeBetweenNumbers.length);
    const mean = timeBetweenNumbers.reduce((a, b) => a + b, 0) / timeBetweenNumbers.length;
    console.log('Mean: ' + mean);
    const stdDev = Math.sqrt(timeBetweenNumbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (timeBetweenNumbers.length-1));
    console.log('Standard Deviation: ' + stdDev);

    const median = timeBetweenNumbers.sort((a, b) => a - b)[Math.floor(timeBetweenNumbers.length / 2)];
    console.log('Median: ' + median);

    const threshold = median + ( 2 * stdDev );
    console.log('Threshold: ' + threshold);

    const outliers = timeBetweenNumbers.filter(x => x > threshold);
    console.log('Outliers: ' + outliers);

    //Order outlies smallest to largest
    outliers.sort((a, b) => a - b);
    console.log('Outliers: ' + outliers);

    //Return the lowest outlier
    return outliers[0];
}

function determineWinners(game_name, duration, numbers, winThreshold, called)
{
    console.log('Calculating math');
    console.log('Duration: ' + duration);
    console.log('Numbers: ' + numbers);
    const numbersPerSecond = called.length / (duration / 1000);

    if( numbers === undefined || numbers.length === 0)
        return {
            numbersPerSecond: numbersPerSecond,
            winners: [called.length]
        };

    const timeBetweenNumbers = getTimeBetweenNumbers(numbers);
    console.log('Time between numbers: ' + timeBetweenNumbers);

    const outliers = timeBetweenNumbers.filter(x => x > winThreshold);
    console.log('Outliers: ' + outliers);

    let outlierIndicies = [];
    for (const element of outliers) {
        outlierIndicies.push(numbers.length - (timeBetweenNumbers.indexOf(element)+1));
    }
    console.log('Outlier Indicies: ' + outlierIndicies);

    outlierIndicies = outlierIndicies.reverse();
    outlierIndicies.push(numbers.length);

    if ( game_name.toLowerCase() === 'survivor')
    {
        outlierIndicies = [outlierIndicies[outlierIndicies.length-1]];
    }


    return {
        numbersPerSecond: numbersPerSecond,
        winners: outlierIndicies
    };
}

function createGameInfoTable(game_history)
{
    let div = document.getElementById('game_info');
    //Create a table that looks like:
    //| Game | Time | Numbers To First Winner | Numbers To Second Winner | Fastest Win | Slowest Win

    let table = document.createElement('table');
    //Add a header to the table
    let tr = document.createElement('tr');
    let th = document.createElement('th');
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

    let timeBetweenNumbers = [];
    for(const element of game_history){
        timeBetweenNumbers = timeBetweenNumbers.concat(getTimeBetweenNumbers(element.number_times));
    }
    console.log("Total Time Between Numbers: " + timeBetweenNumbers);
    const winThreshold = calculateRealMath(timeBetweenNumbers);

    for(const element of game_history){
        console.log(element.game.name);
        const result = determineWinners( element.game.name, element.duration, element.number_times, winThreshold, element.numbers );

        const tr = document.createElement('tr');
        let td = document.createElement('td');
        td.innerHTML = element.game.name;
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = millisecondsToMinutes(element.duration).toFixed(1) + ' minutes';
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = result.numbersPerSecond.toFixed(2) + ' / second';
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = result.winners;
        tr.appendChild(td);


        td = document.createElement('td');
        td.innerHTML = getHallOfFameRecord(element.game.name, result.winners[0], true);
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerHTML = getHallOfFameRecord(element.game.name, result.winners[result.winners.length-1], false);
        tr.appendChild(td);

        table.appendChild(tr);
    }


    div.appendChild(table);
}

window.onload = function() {
    let game_history = getGameHistory();

    if( game_history ){
        let data = parseStatsInfo(game_history, undefined);
        let data_withoutblackout = parseStatsInfo(game_history, ['Black Out Survivor', 'Blackout']);

        let gamesPlayed = document.getElementById('gamesPlayed');
        gamesPlayed.innerHTML = `All Game Stats: ${data.length}`;
        fillStatsInfo(statsFromData(data), '')

        populateTotalHistory(statsFromData(data));

        gamesPlayed = document.getElementById('gamesPlayed_filtered');
        gamesPlayed.innerHTML = `Game Stats Without blackout: ${data_withoutblackout.length}`;
        fillStatsInfo(statsFromData(data_withoutblackout), '_withoutBlackout');
        generateHeatMap(statsFromData(data_withoutblackout));
        //Loop through each game and calculate the stats

        createGameInfoTable(game_history);

        // Create save button
        let saveButton = document.createElement('button');
        saveButton.innerHTML = 'Save Games';
        saveButton.onclick = function() {
            let save_data = []
            for(const element of game_history){
                let name = 'unknown';
                let free = true;

                if( element.game ){
                    name = element.game.name;
                }

                if( element.game.free_space_on === false ){
                    free = false;
                }

                save_data.push( {
                    name : name,
                    free: free,
                    numbers : element.numbers,
                    number_times: element.number_times,
                    duration: element.duration,
                    created: new Date().toLocaleDateString()
                });
            }

            // Create a Blob with the data
            let blob = new Blob([JSON.stringify(save_data)], {type: 'text/plain'});

            // Create a link for the Blob
            let url = URL.createObjectURL(blob);

            // Create a download link
            let downloadLink = document.createElement('a');
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
    const back = document.createElement('button');
    back.innerHTML = 'Back';
    back.onclick = function() {
        sessionStorage.removeItem('game_history');
        window.location.href = `${localStorage.getItem('home-page')}.html`
    }
    back.style = 'display: block; margin: auto; font-size: 40px; margin-top: 30px;';
    document.body.appendChild(back);
};
