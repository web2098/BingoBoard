



function enable_client_audience_interaction() {

    const death_msg = document.getElementById('death_msg');
    //Check death_msg is defined
    if( death_msg != null )
    {
        death_msg.style.display = 'none';
    }

    log_message('Enabling client audience interaction');
    add_special_number_interaction(66, function(){
        const enablePopUps = getItemWithDefault('client_enable_popup_audio') === 'true';
        if( enablePopUps.checked )
        {
            const enableAudioCheckBox = getItemWithDefault('client_enable_popups') === 'true';
            log_message('Executing Order 66');
            executeOrder66(enableAudioCheckBox.checked);
            log_message('Order 66 executed');
        }
        else{
            log_message('Pop-ups are disabled, not executing Order 66');
        }
    });
}

function activate_modal(event_type, options)
{
    const enablePopUps = getItemWithDefault('client_enable_popup_audio') === 'true';
    if( enablePopUps.checked )
    {
        log_message('Activating modal for event type: ' + event_type);
        if( event_type === 'skull')
        {
            const hideIsGraphic = getItemWithDefault('client_hide_graphic_to_the_death') === 'true';
            if( hideIsGraphic)
            {
                options.isGraphic=false; // Force no graphic if the option is set
            }

            showToTheDeath(options);
        }
        else
        {
            showAudienceInteraction(event_type, {font_size: "500%"});
        }
    }
    else
    {
        log_message('Pop-ups are disabled, not activating modal for event type: ' + event_type);
    }
}