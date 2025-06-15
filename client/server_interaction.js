let ws = null;

function requestUpdate()
{
    id = sessionStorage.getItem("server_client_id");
    const update_request = {
        type: "update",
        client_id: id,
    }
    ws.send(JSON.stringify(update_request));
}

function update_view( msg )
{
    if( msg.type === "setup" )
    {
        setup_board(msg);
    }
    else if ( msg.type === "update_free")
    {
        update_free(msg.free);
    }
    else if ( msg.type === "activate")
    {
        activiate_spot(msg.id);
        if( msg.spots != clickedNumbers.length )
        {
            requestUpdate();
        }
    }
    else if ( msg.type === "deactivate")
    {
        deactiviate_spot(msg.id);
        if( msg.spots != clickedNumbers.length )
        {
            requestUpdate();
        }
    }
    else{
        report_error("Unknown message type: " + msg.type);
    }
}

function setup_board( msg )
{
    update_style(msg);
    update_session(msg);

    current_game = find_game_by_name(msg.data.game);
    current_game.free_space_on = msg.data.free;
    if( current_game == null )
    {
        report_error("Game not found: " + msg.data.game);
        return;
    }

    while( clickedNumbers.length > 0)
    {
        const id = parseInt(clickedNumbers[0].substring(1));
        deactiviate_spot(id, false);
    }
    clickedNumbers = [];

    update_preview_boards(current_game);

    let extraInfo = document.getElementById('extraInfo');
    extraInfo.innerHTML = " ";

    console.log("Received setup message: ", msg);
    if( msg.data.active[0] == msg.data.lastNumber)
    {
        console.log("Last number is not the first number in the active list, reversing the list");
        //reverse msg.data.active
        msg.data.active.reverse();
    }

    for(const element of msg.data.active)
    {
        const id = element;
        activiate_spot(id, false);
    }
}

function update_style(msg)
{
    try
    {
        const style = msg.style;
        styleVariables.selectedColor = style.selectedColor;
        styleVariables.selectedTextColor = style.selectedTextColor;
        styleVariables.unselectedColor = style.unselectedColor;
        styleVariables.unselectedTextColor = style.unselectedTextColor;
    }
    catch(e)
    {
        console.log(`Failed to apply style: ${e}`);
    }
}

function update_session(msg)
{
    try
    {
        const session = msg.session;
        specialNumbers = session.numbers;
        welcomeMessage = session.welcome;
    }
    catch(e)
    {
        console.log(`Failed to apply session info: ${e}`);
    }
}

function connectToServerAsClient(server_url, onMesssage)
{
    const element = document.getElementById('qrcode');
    element.visible = false;
    set_status("Connecting to remote server...");
    console.log("Attempting to connect to server...");
    ws = new WebSocket(server_url);
    ws.onopen = function() {
        set_status("Connected to remote server, getting id...");
        console.log('Connected to remote server');
        const id_message = {
            type: "request_id",
        }
        ws.send(JSON.stringify(id_message));
    }
    ws.onmessage = function (event) {
        const msg = JSON.parse(event.data);
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
        onMesssage(msg);
    }
    ws.onerror = function(event) {
        report_error(`Failed to connect to server: ${event.message}`);
        retryConnection(server_url, onMesssage);
    }
    ws.onclose = function(event) {
        report_error("Connection to server closed");
        set_status("Not connected to remote server");
        retryConnection(server_url, onMesssage);
    }
}

function retryConnection(server_url, onMesssage) {
    let element = document.getElementById('qrcode');
    element.visible = false;
    console.log(`Retrying connection in ${retryTime / 1000} seconds...`);
    setTimeout(() => {
        if (retryTime < 30000) {
            retryTime *= 2; // Double the retry time
        }
        connectToServerAsHost(server_url, onMesssage);
    }, retryTime);
}