
function runActions( log_txt, element_in_question, task_values_arr )
{
    var log_div = document.getElementById( "logs_txt" );
    //log_div.innerHTML += log_txt;
    //log_div.scrollTop = log_div.scrollHeight;
    var highlights_txt = log_txt;
    var details_txt    = "";
    _saveLog( highlights_txt, details_txt );
        
    var actions_arr = [];
    
    try
    {
        var elem_arr_str = document.getElementById( "elem_arr_txt" ).value;
        
        var elem_arr = JSON.parse( elem_arr_str );
    }
    catch( e )
    {
        alert( "Running the actions failed because parsing the element details array caught an error:\n\n" + e.message );
        return;
    }
    
    for( var i = 0; i < elem_arr.length; i++ )
    {
        if( element_in_question == elem_arr[i]["dom_id"] )
        {
            actions_arr = elem_arr[i]["actions_arr"];
            break;
        }
    }
    
    var function_name = "";
    var num_values_needed = 0;
    var args_arr = [];
    for( var i = 0; i < actions_arr.length; i++ )
    {
        function_name = actions_arr[i]["function"];
        num_values_needed = actions_arr[i]["values_needed_arr"].length;
        args_arr = task_values_arr.slice( 0, num_values_needed );
        task_values_arr = task_values_arr.slice( num_values_needed );
        
        log_div.innerHTML += "Calling: " + function_name + "\nParms:\n" + JSON.stringify( args_arr, null, 3 ) + "\n\n\n\n";
        log_div.scrollTop = log_div.scrollHeight;
        
        if( 1 == args_arr.length )
        {
            window[ function_name ]( args_arr[0] );
            continue;
        }
        
        window[ function_name ]( args_arr );
        
        // TO DO handle not enough parms
    }
    
}

