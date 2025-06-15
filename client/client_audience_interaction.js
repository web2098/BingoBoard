



function enable_client_audience_interaction() {
    log_message('Enabling client audience interaction');
    add_special_number_interaction(66, function(){
        log_message('Executing Order 66');
        executeOrder66();
        log_message('Order 66 executed');
    });
}