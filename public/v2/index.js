
function setDefaultItem(key, value, force) {
    if (!localStorage.getItem(key) || force ) {
        localStorage.setItem(key, value);
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
}