
var current_game = undefined;

var start_time = new Date().getTime();
var room_connection = null;

///// INIT
async function init_view()
{
    await getGameSettings();

    createLargePreviewBoard();

    const page_div = document.getElementById('game_board_view');
    const header_div = createHeaderDiv();
    const center_div = createCenterDivWithLastNumbers();
    const footer_div = createFooterDiv();
    const layout = [header_div, center_div, footer_div];
    for (const element of layout) {
        page_div.appendChild(element)
    }

    if( current_game )
    {
        update_preview_boards(current_game);
        update_free(current_game.free_space_on);
    }
    enable_main_board_interaction();
    set_special_numbers(JSON.parse(getItemWithDefault('special-numbers')));
    update_last_number_called('Waiting for first number');

    header_div.insertBefore(create_audience_interaction(), header_div.lastChild);

    enableBoardServerInteraction();
    room_connection = await connectToServerAsHost(onMessage);
}

async function getGameSettings()
{
    current_game = JSON.parse(getTemporaryItem('selected_game'))
}
