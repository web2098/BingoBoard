window.onload = function() {
    game_history = JSON.parse(sessionStorage.getItem('game_history'));

    if( game_history ){
        console.log(game_history);
        console.log(typeof game_history);
        data = []
        for( var i = 0; i < game_history.length; i++){
            if( game_history[i].game )
            {
                console.log(game_history[i].game.name);
            }

            data.push( game_history[i].numbers );
        }
        console.log(data);

        var gamesPlayed = document.getElementById('gamesPlayed');
        gamesPlayed.innerHTML = `Games Played: ${data.length}`;

        //Loop through each game and calculate the stats
        var stats = {};
        for (var i = 0; i < data.length; i++) {
            var game = data[i];
            for (var j = 0; j < game.length; j++) {
                var number = game[j];
                if (stats[number]) {
                    stats[number]++;
                } else {
                    stats[number] = 1;
                }
            }
        }
        //From stats find top 10 numbers
        var sortable = [];
        for (var number in stats) {
            sortable.push([number, stats[number]]);
        }
        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        var top10 = sortable.slice(0, 10);
        var top10Numbers = document.getElementById('topTenNumbers');
        top10Numbers.innerHTML = 'Top 10 Numbers: ' + top10.map(function(a) {
            return `${a[0]}(${a[1]})`;
        }).join(', ');

        var bottom10 = sortable.slice(-10);
        var bottom10Numbers = document.getElementById('bottomTenNumbers');
        bottom10Numbers.innerHTML = 'Bottom 10 Numbers: ' + bottom10.map(function(a) {
            return `${a[0]}(${a[1]})`;
        }).join(', ');

        //Create a bar graph for the top 10 numbers where x is the number and y is the frequency
        var ctx = document.getElementById('barGraph').getContext('2d');
        var barGraph = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top10.map(function(a) {
                    return a[0];
                }),
                datasets: [{
                    label: 'Frequency',
                    data: top10.map(function(a) {
                        return a[1];
                    }
                    ),
                    backgroundColor: '#1E4D2B',
                    borderColor: '#1E4D2B',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 50
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 50
                            },
                            callback: function(value) {if (value % 1 === 0) {return value;}}
                        }
                    }
                }
            }
        });

        //Find all numbers that have not been called
        letters = { 0: 'B', 1: 'I', 2: 'N', 3: 'G', 4: 'O'}
        var notCalled = [];
        for (var i = 1; i <= 75; i++) {
            letter = letters[Math.floor((i-1) / 15)];
            if (!stats[letter + i]) {
                notCalled.push(letter + i);
            }
        }
        var notCalledNumbers = document.getElementById('notCalledNumbers');
        if (notCalled.length > 0)
        {
            notCalledNumbers.innerHTML = 'Numbers not called: ' + notCalled.join(', ');
        }
        else
        {
            notCalledNumbers.innerHTML = 'All Numbers were called!';
        }


        var sortable2 = [];
        for (var number in stats) {
            sortable2.push([number, stats[number]]);
        }
        for (var i = 0; i < notCalled.length; i++) {
            console.log(notCalled[i]);
            sortable2.push([notCalled[i], 0]);
        }
        function compareStrings(s1, s2) {
            var match1 = s1.match(/(\D+)(\d+)/);
            var match2 = s2.match(/(\D+)(\d+)/);
            var letterMap = {
                'B': 0,
                'I': 1,
                'N': 2,
                'G': 3,
                'O': 4
            };
            // Compare the letter parts
            if (letterMap[match1[1]] < letterMap[match2[1]]) {
                return -1;
            } else if (letterMap[match1[1]] < letterMap[match2[1]]) {
                return 1;
            } else {
                // If the letter parts are equal, compare the number parts
                return parseInt(match1[2], 10) - parseInt(match2[2], 10);
            }
        }
        sortable2.sort(function(a, b) {
            return compareStrings(a[0], b[0])
        });
        //Create a bar graph for the all elements allGraph where x is the number and y is the frequency
        var ctx2 = document.getElementById('allGraph').getContext('2d');
        var allGraph = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: sortable2.map(function(a) {
                    console.log(a[0])
                    return a[0];
                }),
                datasets: [{
                    label: 'Frequency',
                    data: sortable2.map(function(a) {
                        return a[1];
                    }
                    ),
                    backgroundColor: '#1E4D2B',
                    borderColor: '#1E4D2B',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 25
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 25
                            },
                            callback: function(value) {if (value % 1 === 0) {return value;}}
                        }
                    }
                }
            }
        });

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
                    numbers : game_history[i].numbers
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