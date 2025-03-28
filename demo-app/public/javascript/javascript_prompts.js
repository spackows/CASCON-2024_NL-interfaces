

function _loadPrompts( callback )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    $.ajax( { url         : "./load-prompts",
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
    
                             var prompts_arr = result_json["prompts_arr"] ? result_json["prompts_arr"] : [];
                             if( !prompts_arr || ( prompts_arr.length < 1 ) )
                             {
                                 alert( "Loading prompts returned no results" );
                                 callback();
                                 return;
                             }
                             
                             populatePromptsTextContainer( prompts_arr );
                             
                             populatePromptsSelector( prompts_arr );
                             
                             callback();
                             
                         }
                         
            } );
    
}


function populatePromptsSelector( prompts_arr )
{
    var prompt_selector = document.getElementById( "prompt_selector" );
    
    prompt_selector.innerHTML = "";
    
    var option = document.createElement( "option" );
    option.value = "-- Select a prompt --";
    option.innerHTML = "-- Select a prompt --";
    document.getElementById( "prompt_selector" ).add( option );
    
    if( prompts_arr.length < 1 )
    {
        return;
    }
    
    var prompt_id   = "";
    var prompt_name = "";
    for( var i = 0; i < prompts_arr.length; i++ )
    {
        prompt_id   = prompts_arr[i]["prompt_id"];
        prompt_name = prompts_arr[i]["prompt_name"];
        
        option = document.createElement( "option" );
        option.value = "prompt_" + prompt_id;
        option.innerHTML = prompt_name;
        prompt_selector.add( option );
    }
    
    document.getElementById( "prompt_selector" ).selectedIndex = 1;
    selectPrompt();
}


function populatePromptsTextContainer( prompts_arr )
{
    var prompt_id = "";
    var prompt_txt = "";
    var html = "";
    
    for( var i = 0; i < prompts_arr.length; i++ )
    {
        prompt_id  = prompts_arr[i]["prompt_id"];
        prompt_txt = prompts_arr[i]["prompt_txt"];
        
        html = "<textarea class='prompt_txt' " +
                         "id='prompt_txt_" + prompt_id + "' " +
                         "onchange='enablePromptSave(this);' " +
                         "onkeyup='enablePromptSave(this);' " +
                         "onmouseup='resizePromptTextareas(this);' " +
                         "style='display: none;'>" + prompt_txt + "</textarea>" +
               "<button   class='prompt_save_btn' id='prompt_save_btn_" + prompt_id + "' title='Save prompt text changes' onclick='_savePromptTxt();' disabled=true>Save</button>";

        if( 0 == i )
        {
            html = html.replace( /none/, "block" );
        }
        
        document.getElementById( "prompts_txt_container" ).innerHTML += html;
    }
    
}


function resizePromptTextareas( obj )
{
    var height = obj.offsetHeight;
    
    setPromptTextareasHeight( height );
}


function setPromptTextareasHeight( height )
{
    var textarea_arr = document.getElementsByClassName( "prompt_txt" );
    
    for( var i = 0; i < textarea_arr.length; i++ )
    {
        textarea_arr[i].style.height = ( height - 22 ) + "px";
    }
}


function showPromptText( prompt_id )
{
    var divs_arr = document.getElementsByClassName( "prompt_txt" );
    var btns_arr = document.getElementsByClassName( "prompt_save_btn" );
    
    for( var i = 0; i < divs_arr.length; i++ )
    {
        divs_arr[i].style.display = "none";
        btns_arr[i].style.display = "none";
    }
    
    if( prompt_id.match( /select a prompt/i ) )
    {
        return;
    }
    
    document.getElementById( "prompt_txt_" + prompt_id ).style.display = "block";
    document.getElementById( "prompt_save_btn_" + prompt_id ).style.display = "block";
}


function selectPrompt()
{
    var prompt_id = getSelectedPrompt();
    
    showPromptText( prompt_id );
    
}


function getSelectedPrompt()
{
    var prompt_selector = document.getElementById( "prompt_selector" );
    var index = prompt_selector.selectedIndex;
    if( index < 0 )
    {
        return "";
    }
    
    var prompt_id = prompt_selector.options[index].value.replace( /^prompt_/, "" );
    if( prompt_id.match( /select product/i ) )
    {
        return "";
    }
    
    return prompt_id;    
}


function getSelectedPromptName()
{
    var prompt_selector = document.getElementById( "prompt_selector" );
    var index = prompt_selector.selectedIndex;
    if( index < 0 )
    {
        return "";
    }
    
    var prompt_name = prompt_selector.options[index].innerHTML;
    
    return prompt_name;    
}


function populatePromptText( prompt_id )
{
    _loadPromptText( prompt_id, function( error_str, prompt_txt )
    {
        if( error_str )
        {
            alert( error_str );
            return;
        }
    
        document.getElementById( "prompt_txt" ).innerHTML = prompt_txt;
        
    } );
    
}


function _loadPromptText( prompt_id, callback )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    $.ajax( { url         : "./load-prompt-text",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id,
                                              "prompt_id"  : prompt_id } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 callback( "Unexpected result returned when loading prompt text", "" );
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"] : "";
                             if( error_str )
                             {
                                 callback( "Loading prompt text failed\n\nError: " + error_str, "" );
                                 return;
                             }
    
                             var prompt_txt = result_json["prompt_txt"] ? result_json["prompt_txt"] : "";
                             
                             callback( "", prompt_txt );
                             
                         }
                         
            } );
    
}


function enablePromptSave( obj )
{
    var prompt_id = obj.id.replace( /^prompt_txt_/, "" );
    
    document.getElementById( "prompt_save_btn_" + prompt_id ).disabled = false;
}


function disablePromptSave( prompt_id )
{
    document.getElementById( "prompt_save_btn_" + prompt_id ).disabled = true;
}


function _savePromptTxt()
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    var prompt_id = getSelectedPrompt();
    
    var prompt_txt = document.getElementById( "prompt_txt_" + prompt_id ).value;
    
    $.ajax( { url         : "./save-prompt-text",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id,
                                              "prompt_id"  : prompt_id,
                                              "prompt_txt" : prompt_txt } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 alert( "Unexpected result returned when saving prompt text" );
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"] : "";
                             if( error_str )
                             {
                                 alert( "Saving prompt text failed\n\nError: " + error_str );
                                 return;
                             }
                             
                             disablePromptSave( prompt_id );
                             
                         }
                         
            } );
    
}




