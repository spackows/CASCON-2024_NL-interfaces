
function _loadLogs( callback )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    $.ajax( { url         : "./load-logs",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 alert( "Unexpected result returned when loading prompts" );
                                 callback();
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"] : "";
                             if( error_str )
                             {
                                 alert( "Loading prompts failed\n\nError: " + error_str );
                                 callback();
                                 return;
                             }
    
                             var highlights_txt = result_json["highlights_txt"] ? result_json["highlights_txt"] : "";
                             var details_txt    = result_json["details_txt"]    ? result_json["details_txt"]    : "";
                             
                             var log_div = document.getElementById( "logs_txt" );
                             log_div.innerHTML = highlights_txt;
                             log_div.scrollTop = log_div.scrollHeight;
                             
                             log_div = document.getElementById( "logs_details_txt" );
                             log_div.innerHTML = details_txt;
                             log_div.style.display = "block";
                             log_div.scrollTop = log_div.scrollHeight;
                             log_div.style.display = "none";
                             
                             callback();
                             
                         }
                         
            } );
    
}


function showLogs( tab_obj )
{
    if( tab_obj.id.match( /details/ ) )
    {
        showDetailsLogs();
        
        return;
    }

    showRegularLogs();
}


function showRegularLogs()
{
    document.getElementById( "logs_details_txt" ).style.display = "none";
    document.getElementById( "logs_txt"         ).style.display = "block";

    document.getElementById( "logs_highlights_tab" ).style.fontWeight = "bold";
    document.getElementById( "logs_details_tab"    ).style.fontWeight = "normal";
}


function showDetailsLogs()
{
    document.getElementById( "logs_txt"         ).style.display = "none";
    document.getElementById( "logs_details_txt" ).style.display = "block";
    
    document.getElementById( "logs_highlights_tab" ).style.fontWeight = "normal";
    document.getElementById( "logs_details_tab"    ).style.fontWeight = "bold";
}


function resizeLogs( obj )
{
    var height = obj.offsetHeight;
    
    document.getElementById( "logs_txt"         ).style.height = ( height - 22 ) + "px";
    document.getElementById( "logs_details_txt" ).style.height = ( height - 22 ) + "px";
}


function _saveLog( highlights_txt, details_txt )
{
    var log_div = document.getElementById( "logs_txt" );
    log_div.innerHTML += highlights_txt;
    log_div.scrollTop = log_div.scrollHeight;
    
    log_div = document.getElementById( "logs_details_txt" );
    log_div.innerHTML += details_txt;
    log_div.scrollTop = log_div.scrollHeight;
    
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    $.ajax( { url         : "./save-log",
              type        : "POST",
              data        : JSON.stringify( { "project_id"     : project_id,
                                              "highlights_txt" : highlights_txt, 
                                              "details_txt"    : details_txt } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var status_code = ( "status"     in result ) ? result["status"]     : "";
                             var status_text = ( "statusText" in result ) ? result["statusText"] : "";
                             
                             if( !( "responseJSON" in result ) || !result["responseJSON"] )
                             {
                                 var msg = "Saving log info failed.\n\n" +
                                           "No 'responseJSON' field returned.";
                                 msg += ( status_code == "" ) ? "" : "\n\nStatus code: " + status_code;
                                 msg += ( status_text == "" ) ? "" : "\n\nStatus text: " + status_text;
                                 console.log( msg );
                                 return;
                             }
                             
                             var error_str = ( "error_str" in result["responseJSON"] ) ? result["responseJSON"]["error_str"] : "";
                             if( error_str )
                             {
                                 var msg = "Saving log info failed.\n\n" +
                                           "error_str: " + error_str;
                                 console.log( msg );
                             }
                                                                                       
                         }
                         
            } );
    
}


function setLogsTextareasHeight( height )
{
    document.getElementById( "logs_txt"         ).style.height = ( height - 22 ) + "px";
    document.getElementById( "logs_details_txt" ).style.height = ( height - 22 ) + "px";
}


