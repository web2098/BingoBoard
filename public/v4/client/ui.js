
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        log_message('Screen Wake Lock is active');

        wakeLock.addEventListener('release', () => {
            log_message('Screen Wake Lock released');
        });
    } catch (err) {
        report_error('Wake Lock not supported ' + err.name + ', ' + err.message);
        log_message(`${err.name}, ${err.message}`);
    }
}