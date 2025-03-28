
function addNLIParms( parms_json )
{
    var slider_width = parseInt( document.getElementById( "resizer_div" ).style.right );
    if( 470 != slider_width )
    {
        parms_json["slider_width"] = parseInt( document.getElementById( "resizer_div" ).style.right );
    }
    
    var right_scroll = document.getElementById( "right_hand_div" ).scrollTop;
    parms_json["right_scroll"] = right_scroll;
    
    var collapse_arr = [];
    if( document.getElementById( "prompts_div"        ).style.display == "none" ){ collapse_arr.push( "prompts"        ); }
    if( document.getElementById( "elem_arr_div"       ).style.display == "none" ){ collapse_arr.push( "elem_arr"       ); }
    if( document.getElementById( "logs_div"           ).style.display == "none" ){ collapse_arr.push( "logs"           ); }
    if( document.getElementById( "user_input_txt_div" ).style.display == "none" ){ collapse_arr.push( "user_input_txt" ); }
    if( document.getElementById( "output_txt_div"     ).style.display == "none" ){ collapse_arr.push( "output_txt"     ); }
    if( collapse_arr.length > 0 )
    {
        parms_json["collapse"] = collapse_arr.join( "," );
    }
    
    var selected_prompt_name = getSelectedPromptName();
    if( !selected_prompt_name.match( /classify/i ) )
    {
        parms_json["prompt_index"] = document.getElementById( "prompt_selector" ).selectedIndex;
    }
    
    var org_display = document.getElementById( "prompts_div" ).style.display;
    document.getElementById( "prompts_div" ).style.display = "block";
    var prompt_height = getPromptHeight();
    if( 160 != ( prompt_height - 22 ) )
    {
        parms_json["prompt_height"] = prompt_height;
    }
    document.getElementById( "prompts_div" ).style.display = org_display;   
    
    var org_display = document.getElementById( "elem_arr_div" ).style.display;
    document.getElementById( "elem_arr_div" ).style.display = "block";
    var elem_height = document.getElementById( "elem_arr_txt" ).offsetHeight;
    if( 160 != ( elem_height - 22 ) )
    {
        parms_json["elem_height"] = elem_height;
    }
    document.getElementById( "elem_arr_div" ).style.display = org_display;   
    
    var selected_logs = ( document.getElementById( "logs_txt" ).style.display == "none" ) ? "logs_details" : "";
    if( selected_logs )
    {
        parms_json["selected_logs"] = selected_logs;
    }
    
    var org_display = document.getElementById( "logs_div" ).style.display;
    document.getElementById( "logs_div" ).style.display = "block";
    var logs_height = getLogsHeight();
    if( 160 != ( logs_height - 22 ) )
    {
        parms_json["logs_height"] = logs_height;
    }
    document.getElementById( "logs_div" ).style.display = org_display;
    
    return parms_json;
}


function _processNLIParms()
{
    setNLIWidth();
    
    setRightScroll();
    
    var taskComplete = _.after( 3, function()
    {
        setTextareasHeight();
        
        collapseDivs();
        
    } );
    
    _loadPrompts( function()
    {
        setSelectedPrompt();
        
        taskComplete();
        
    } );
    
    _loadElemArr( function()
    {
        taskComplete();
        
    } );
    
    _loadLogs( function()
    {
        showSelectedLogs();
        
        taskComplete();
        
    } );
    
}


function setNLIWidth()
{
    var width_str = document.getElementById( "slider_width_parm" ).value.replace( /[^\d]/g, "" );
    var width = width_str ? parseInt( width_str ) : 0;
    if( width > 0 )
    {
        document.getElementById( "resizer_div" ).style.right = width + "px"
        document.getElementById( "right_hand_div" ).style.width = width - 20 + "px";
        document.getElementById( "left_hand_div" ).style.right = width + "px";
    }
    
}


function setRightScroll()
{
    var right_scroll_str = document.getElementById( "right_scroll_parm" ).value.replace( /[^\d]/g, "" );
    var right_scroll = right_scroll_str ? parseInt( right_scroll_str ) : 0;
    if( right_scroll > 0 )
    {
        document.getElementById( "right_hand_div" ).scrollTop = right_scroll;
    }
}


function setSelectedPrompt()
{
    var prompt_index_str = document.getElementById( "prompt_index_parm" ).value;
    prompt_index_str = prompt_index_str.replace( /[^\d]/g, "" );
    if( "" != prompt_index_str )
    {
        document.getElementById( "prompt_selector" ).selectedIndex = prompt_index_str;
        selectPrompt();
    }
}


function setTextareasHeight()
{
    var prompt_height_str = document.getElementById( "prompt_height_parm" ).value;
    prompt_height_str = prompt_height_str.replace( /[^\d]/g, "" );
    if( "" != prompt_height_str )
    {
        setPromptTextareasHeight( prompt_height_str );
    }
    
    var elem_height_str = document.getElementById( "elem_height_parm" ).value;
    elem_height_str = elem_height_str.replace( /[^\d]/g, "" );
    if( "" != elem_height_str )
    {
        document.getElementById( "elem_arr_txt" ).style.height = ( elem_height_str - 22 ) + "px";
    }

    var logs_height_str = document.getElementById( "logs_height_parm" ).value;
    logs_height_str = logs_height_str.replace( /[^\d]/g, "" );
    if( "" != logs_height_str )
    {
        setLogsTextareasHeight( logs_height_str );
    }

}


function getPromptHeight()
{
    var prompt_arr = document.getElementsByClassName( "prompt_txt" );
    
    for( var i = 0; i < prompt_arr.length; i++ )
    {
        if( prompt_arr[i].style.display == "none" )
        {
            continue;
        }
        
        return prompt_arr[i].offsetHeight;
    }
}


function getLogsHeight()
{
    var logs_height = ( document.getElementById( "logs_txt" ).style.display == "none" ) ?
                      document.getElementById( "logs_details_txt" ).offsetHeight :
                      document.getElementById( "logs_txt" ).offsetHeight;
    
    return logs_height;
}


function collapseDivs()
{
    var collapse_str = document.getElementById( "collapse_parm" ).value;
    var collapse_arr = collapse_str.split( "," );
    for( var i = 0; i < collapse_arr.length; i++ )
    {
        if( document.getElementById( collapse_arr[i] + "_chevron_button" ) )
        {
            document.getElementById( collapse_arr[i] + "_chevron_button" ).click();
        }
    }
    
}


function showSelectedLogs()
{
    var selected_logs_str = document.getElementById( "selected_logs_parm" ).value;
    
    if( selected_logs_str.match( /details/ ) )
    {
        showDetailsLogs();
        
        return;
    }

    showRegularLogs();
}

