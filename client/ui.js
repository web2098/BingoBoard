
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock is active');

        wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock released');
        });
    } catch (err) {
        report_error('Wake Lock not supported ' + err.name + ', ' + err.message);
        console.error(`${err.name}, ${err.message}`);
    }
}