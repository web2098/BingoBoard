
function setDefaultItem(key, value, force) {
    if (!localStorage.getItem(key) || force ) {
        localStorage.setItem(key, value);
    }
}

function defaultSpecialNumbers() {
    return {
        11: 'B11! B! B! 11!',
        25: 'Beep Beep',
        69: 'Oooooooooh'
    }
}


function setDefaultSettings(force) {
    setDefaultItem('main-bg-color', '#FFFFFF', force);
    setDefaultItem('main-font-color', '#000000', force);
    setDefaultItem('select-tab-color', '#1E4D2B', force);
    setDefaultItem('select-tab-text-color', '#FFFFFF', force);
    setDefaultItem('unselect-tab-color', '#FFFFFF', force);
    setDefaultItem('unselect-tab-text-color', '#000000', force);
    setDefaultItem('last-number-dir', 'top', force);
    setDefaultItem('number-history-dir', 'right', force);
    setDefaultItem('last-number-on', 'true', force);
    setDefaultItem('number-history-on', 'true', force);
    setDefaultItem('home-page', 'select_game', force);
    setDefaultItem('game-order', 'default', force);
    setDefaultItem('welcome-message', 'BINGO FREE TO PLAY! 2 CARDS PER PERSON START TIME - 6:30<br> Bingo Word: BAHHH!', force);
    setDefaultItem('special-numbers', JSON.stringify(defaultSpecialNumbers()), force);
    setDefaultItem('item-font-size', '75', force);
    setDefaultItem('header-font-size', '75', force);
    setDefaultItem('header-details-font-size', '25', force);
    setDefaultItem('last-numbers-font-size', '25', force);
    setDefaultItem('qrcode-size', '128', force);
}


function getItemWithDefault( item, force ){
    setDefaultSettings(force);
    return localStorage.getItem(item);
}

function getRandomColor() {
    var r = Math.floor(Math.random() * 256); // Random between 0-255
    var g = Math.floor(Math.random() * 256); // Random between 0-255
    var b = Math.floor(Math.random() * 256); // Random between 0-255
    return 'rgb(' + r + ',' + g + ',' + b + ')'; // Collect all to a rgb string
}

function setTemporaryItem(key, value) {
    sessionStorage.setItem(key, value);
}

function getTemporaryItem(key) {
    return sessionStorage.getItem(key);
}

