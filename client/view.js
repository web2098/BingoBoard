
let current_game = null;
let welcomeMessage = null;
let retryTime = 1000; // Initial retry time in milliseconds

let wakeLock = null;

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

async function init_view()
{
    createLargePreviewBoard();

    const queryParams = getQueryParams(['server_url']);

    // Get Server URL from session storage
    let server_url = queryParams.server_url;
    if( server_url == null )
    {
        report_error("No Valid server url is currently set, did you scan the QR code?");
        return;
    }
    server_url = atob(server_url);

    const page_div = document.getElementById('game_board_view');
    const header_div = createHeaderDiv();
    const center_div = createCenterDiv();
    const footer_div = createFooterDiv();
    const layout = [header_div, center_div, footer_div];
    for (const element of layout) {
        page_div.appendChild(element)
    }


    const server_url_b64 = btoa(server_url);
    const data = `${window.location.protocol}//${window.location.hostname}:${window.location.port}${window.location.pathname}?server_url=${server_url_b64}`;
    let element = document.getElementById('qrcode');
    element.visible = true;
    const qrcode = new QRCode(element, {
        text: data,
        width: 128,
        height: 128,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
      });

    connectToServerAsClient(server_url, onMessage);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && wakeLock) {
            wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock released due to visibility change');
        }
    });


    await requestWakeLock();
}

function onMessage(msg)
{
    if( msg.type == "id" )
    {
        set_status("Connected to remote server as " + msg.conn_id);
        sessionStorage.setItem("server_client_id", msg.conn_id);
        requestUpdate();
    }
    else if( msg.type == "error" )
    {
        report_error(msg.message);
    }
    else
    {
        update_view(msg);
    }
}


function set_status( msg )
{
    document.getElementById("server_status").innerHTML = msg;
}