

function llm( input_txt, ts )
{
    var mouse_pos_dom_id = "";
    
    _llmAPI( input_txt, mouse_pos_dom_id, function( error_str, nli_class, element_in_question, contextual_help, task_values_arr, logs_details_txt )
    {
        if( error_str )
        {
            alert( error_str );
            return;
        }
        
        //document.getElementById( "logs_details_txt" ).innerHTML += "\n\n" + ts + "\n" + logs_details_txt;
        var highlights_txt = ""
        var details_txt    = "\n\n" + ts + "\n" + logs_details_txt;
        _saveLog( highlights_txt, details_txt );
        
        var log_txt = "Input type:\n'" + nli_class + "'\n\n";
        log_txt += "Element in question:\n'" + element_in_question + "'\n\n";
        
        switch( nli_class )
        {
            case "action_request":
                log_txt += "Task values:\n" + JSON.stringify( task_values_arr, null, 3 ) + "\n\n";
                runActions( log_txt, element_in_question, task_values_arr );
                break;
                
            default:
                log_txt += "Contextual help:\n'" + contextual_help + "'\n\n\n\n";
                //var log_div = document.getElementById( "logs_txt" );
                //log_div.innerHTML += log_txt;
                //log_div.scrollTop = log_div.scrollHeight;
                var highlights_txt = log_txt;
                var details_txt    = "";
                _saveLog( highlights_txt, details_txt );

                populateTextOutput( contextual_help );
                
        }
        
    
    } );
    
}


function _llmAPI( input_txt, mouse_pos_dom_id, callback )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    document.getElementById( "logs_spinner" ).style.display = "block";
    
    $.ajax( { url         : "./llm",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id,
                                              "input_txt"  : input_txt, 
                                              "mouse_pos_dom_id" : mouse_pos_dom_id } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             document.getElementById( "logs_spinner" ).style.display = "none";
                             
                             var status_code = ( "status"     in result ) ? result["status"]     : "";
                             var status_text = ( "statusText" in result ) ? result["statusText"] : "";
                             
                             if( !( "responseJSON" in result ) || !result["responseJSON"] )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "No 'responseJSON' field returned.";
                                 msg += ( status_code == "" ) ? "" : "\n\nStatus code: " + status_code;
                                 msg += ( status_text == "" ) ? "" : "\n\nStatus text: " + status_text;
                                 callback( msg, "", "" );
                                 return;
                             }
                             
                             var error_str = ( "error_str" in result["responseJSON"] ) ? result["responseJSON"]["error_str"] : "";
                             if( error_str )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "error_str: " + error_str;
                                 callback( msg, "", "" );
                                 return;
                             }
                             
                             if( !( "nli_class" in result["responseJSON"] ) )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "No 'nli_class' field returned.";
                                 callback( msg, "", "" );
                                 return;
                             }
                             if( !( "element_in_question" in result["responseJSON"] ) )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "No 'element_in_question' field returned.";
                                 callback( msg, "", "" );
                                 return;
                             }
                             if( !( "contextual_help" in result["responseJSON"] ) )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "No 'contextual_help' field returned.";
                                 callback( msg, "", "" );
                                 return;
                             }
                             if( !( "task_values_arr" in result["responseJSON"] ) )
                             {
                                 var msg = "Calling the LLM failed.\n\n" +
                                           "No 'task_values_arr' field returned.";
                                 callback( msg, "", "" );
                                 return;
                             }
                             
                             var nli_class = result["responseJSON"]["nli_class"];
                             var element_in_question = result["responseJSON"]["element_in_question"];
                             var contextual_help = result["responseJSON"]["contextual_help"];
                             var task_values_arr = result["responseJSON"]["task_values_arr"];
                             var logs_details_txt = result["responseJSON"]["logs_details_txt"] ? result["responseJSON"]["logs_details_txt"] : "";
                             
                             callback( "", nli_class, element_in_question, contextual_help, task_values_arr, logs_details_txt );
                                                                                       
                         }
                         
            } );
    
}


function populateTextOutput( txt )
{
    var output_txt_div = document.getElementById( "output_txt" );
    
    output_txt_div.innerText = txt;
    
    output_txt_div.scrollTop = output_txt_div.scrollHeight;

}

