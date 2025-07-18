
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
    setDefaultItem('clap-message', "Applause", force);
    setDefaultItem('boo-message', "Boooooo", force);
    setDefaultItem('beer-message', "Cheers", force);
    setDefaultItem('party-message', "Winner", force);
    setDefaultItem('audience-message-timeout', "3000", force);
    setDefaultItem('to-the-death-graphic', "false", force);
    setDefaultItem('auto-lightsaber', "true", force);
    setDefaultItem('client_enable_popup_audio', "true", force);
    setDefaultItem('client_enable_popups', "true", force);
    setDefaultItem('client_hide_graphic_to_the_death', "false", force);
}


function getItemWithDefault( item, force ){
    setDefaultSettings(force);
    return localStorage.getItem(item);
}

function setLocalSetting(key, value) {
    if (value === null || value === undefined) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, value);
    }
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
