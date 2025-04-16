let retryTime = 1000; // Initial retry time in milliseconds

function onMessage(auth, data)
{
    if( data.type == "id" )
    {
        updateQRCode( auth );
        sendStatus();
    }
    else if( data.type === 'update' )
    {
        sendStatusTo(data.client_id);
    }
}

function sendStatus()
{
    const status = createStatus();
    console.log("Sending status to all");
    console.log(JSON.stringify(status));
    room_connection.send(JSON.stringify(status));
}

function sendStatusTo( client_id )
{
    const status = createStatus();
    status.client_id = client_id;
    console.log("Sending status to:", client_id);
    console.log(JSON.stringify(status));
    room_connection.send(JSON.stringify(status));
}

function requestUpdate()
{
    id = sessionStorage.getItem("server_client_id");
    const update_request = {
        type: "update",
        client_id: id,
    }
    ws.send(JSON.stringify(update_request));
}

function sendActivateNumber( number, clickedNumbers )
{
    if( room_connection )
    {
        const update = {
            type: "activate",
            id: number,
            spots: clickedNumbers.length
        };
        room_connection.send(JSON.stringify(update));
    }
}


function sendDeactivateNumber( number, clickedNumbers )
{
    if( room_connection )
    {
        const update = {
            type: "deactivate",
            id: number,
            spots: clickedNumbers.length
        };
        room_connection.send(JSON.stringify(update));
    }
}
function send_update_free_space()
{
    if( room_connection )
    {
        const update = {
            type: "update_free",
            free: current_game.free_space_on
        }
        room_connection.send(JSON.stringify(update));
    }
}


function createStatus()
{
    const status = {
        type: "setup",
        data: {
            game: current_game.name,
            free: current_game.free_space_on,
            active: clickedNumbers
        },
        style: {
            selectedColor: styleVariables.selectedColor,
            selectedTextColor: styleVariables.selectedTextColor,
            unselectedColor: styleVariables.unselectedColor,
            unselectedTextColor: styleVariables.unselectedTextColor,
        },
        session:{
            numbers: JSON.parse(getItemWithDefault('special-numbers'))
        }
    }
    return status;
}

async function connectToServerAsHost(onMessage)
{
    const element = document.getElementById('qrcode');
    element.visible = false;
    console.log("Connecting to server");
    const auth = await hostRoom();
    if( auth )
    {
        return connectToRoomAsHost(auth, onMessage);
    }
}

async function hostRoom()
{
    //Make an HTTP Get request to the server
    const server_url = getItemWithDefault('bingo_server_url');
    const server_token = getItemWithDefault('bingo_server_auth');

    if( !(server_url && server_token) )
    {
        console.log('Server URL or token not set');
        return null;
    }

    try {
        const response = await fetch(`${server_url}/host`, {
            method: 'GET',
            headers: {
                'Authorization': server_token
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log('Success:', data);
        return data; // Assuming the server returns some auth data
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function connectToRoomAsHost( auth, onMesssage )
{
    const server_url = getItemWithDefault('bingo_server_url');
    const ws_url = `${server_url.replace('http', 'ws')}/start/${auth.room_id}?room_token=${auth.room_token}`;
    console.log('Connecting to room:', ws_url);


    let room_connection = new WebSocket(ws_url);
    room_connection.onopen = function() {
        console.log("Connected to room");
        const id_message = {
            type: "request_id",
        }
        room_connection.send(JSON.stringify(id_message));
    }
    room_connection.onmessage = function(msg) {
        console.log('Message:', msg.data);
        const data = JSON.parse(msg.data);
        onMesssage(auth, data);
    }
    room_connection.onerror = function(error) {
        console.error('Error:', error);
        retryConnection(onMesssage);
    }
    room_connection.onclose = function() {
        console.log('Connection closed');
    }

    return room_connection
}

function retryConnection(onMesssage) {
    let element = document.getElementById('qrcode');
    element.visible = false;
    console.log(`Retrying connection in ${retryTime / 1000} seconds...`);
    setTimeout(() => {
        if (retryTime < 30000) {
            retryTime *= 2; // Double the retry time
        }
        connectToServerAsHost(onMesssage);
    }, retryTime);
}