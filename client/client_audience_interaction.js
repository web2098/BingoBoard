



function enable_client_audience_interaction() {
    add_special_number_interaction(66, function(){
        executeOrder66();
    });
}