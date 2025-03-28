

function _loadElemArr( callback )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    $.ajax( { url         : "./load-elem-arr",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 alert( "Unexpected result returned when loading element details" );
                                 callback();
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"] : "";
                             if( error_str )
                             {
                                 alert( "Loading element details failed\n\nError: " + error_str );
                                 callback();
                                 return;
                             }
    
                             var elem_arr = result_json["elem_arr"] ? result_json["elem_arr"] : [];
                             if( !elem_arr || ( elem_arr.length < 1 ) )
                             {
                                 alert( "Loading element details returned no results" );
                                 callback();
                                 return;
                             }
                             
                             populateElemArr( elem_arr );
                             
                             callback();
                             
                         }
                         
            } );

}


function getElemArr()
{
    var elem_arr_str = document.getElementById( "elem_arr_txt" ).value;
    
    var elem_arr = JSON.parse( elem_arr_str );
    
    return elem_arr;
}


function populateElemArr( elem_arr )
{
    document.getElementById( "elem_arr_txt" ).innerHTML = JSON.stringify( elem_arr, null, 3 );
}


function enableElemArrSave()
{
    document.getElementById( "elem_arr_save_btn" ).disabled = false;
}


function disableElemArrSave()
{
    document.getElementById( "elem_arr_save_btn" ).disabled = true;
}


function _saveElemArr()
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    try
    {
        var elem_arr = getElemArr();
    }
    catch( e )
    {
        alert( "Parsing element details array JSON failed.\n\n" +
               "Look for a typo that makes the JSON invalid." );
        return;
    }
    
    $.ajax( { url         : "./save-elem-arr",
              type        : "POST",
              data        : JSON.stringify( { "project_id" : project_id,
                                              "elem_arr"   : elem_arr } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 alert( "Unexpected result returned when saving element details" );
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"] : "";
                             if( error_str )
                             {
                                 alert( "Saving element details failed\n\nError: " + error_str );
                                 return;
                             }
                             
                             disableElemArrSave();
                             
                         }
                         
            } );
    
}



