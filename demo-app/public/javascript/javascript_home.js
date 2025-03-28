

function showError()
{
    var error_str = document.getElementById( "error_str" ).value;
    
    if( error_str )
    {
        alert( error_str );
    }
}


function loadProjects()
{
    $.ajax( { url         : "./load-projects",
              type        : "POST",
              data        : JSON.stringify( {} ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 alert( "Unexpected result returned when loading projects" );
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"]  : "";
                             if( error_str )
                             {
                                 alert( "Loading projects failed\n\nError: " + error_str );
                                 return;
                             }
    
                             var projects_arr = result_json["projects_arr"] ? result_json["projects_arr"]  : [];
                             if( !projects_arr || ( projects_arr.length < 1 ) )
                             {
                                 alert( "Loading projects returned no results" );
                                 return;
                             }
    
                             populateProjectsDropdown( projects_arr );
                             
                         }
                         
            } );

}


function populateProjectsDropdown( projects_arr )
{
    document.getElementById( "project_selector" ).innerHTML = "";
    
    var option = document.createElement( "option" );
    option.id = "option_default";
    option.value = "-- Select a project --";
    option.innerHTML = "-- Select a project --";
    document.getElementById( "project_selector" ).add( option );
    
    var project_id   = "";
    var project_name = "";
    for( var i = 0; i < projects_arr.length; i++ )
    {
        project_id   = projects_arr[i]["PROJECT_ID"];
        project_name = projects_arr[i]["PROJECT_NAME"];
        
        option = document.createElement( "option" );
        option.value = "project_" + project_id;
        option.innerHTML = project_name;
        document.getElementById( "project_selector" ).add( option );
    }
    
}


function selectProject( select_obj )
{
    var selected_value = select_obj.options[ select_obj.selectedIndex ].value;
    
    if( selected_value.match( /select\s+a\s+project/i ) )
    {
        return;
    }

    var project_id = selected_value.replace( /^project_/, "" );
    
    if( project_id.match( /sample_rag-eval|sample_prompt-lab/ ) )
    {
        createSampleProject( project_id );
        return;
    }
    
    document.location.href = "./?project_id=" + project_id;
    
}


function createSampleProject( sample_id )
{
    createProject( sample_id, "", function( error_str, project_id )
    {
        if( error_str )
        {
            alert( error_str );
            return;
        }
        
        document.location.href = "./?project_id=" + project_id;
        
    } );

}


function createNewProject( obj )
{
    var project_name = document.getElementById( "new_project_input" ).value;
    project_name = project_name.trim();
    project_name = project_name.replace( /\s+/g, " " );
    
    if( !project_name )
    {
        document.getElementById( "new_project_input" ).style.borderColor = "red";
        return;
    }

    document.getElementById( "new_project_input" ).style.borderColor = "lightgrey";
    document.getElementById( "new_project_input" ).style.borderTop = "1px solid grey";
    
    createProject( "", project_name, function( error_str, project_id )
    {
        if( error_str )
        {
            alert( error_str );
            return;
        }
        
        document.location.href = "./?project_id=" + project_id;
        
    } );

}


function createProject( project_id, project_name, callback )
{
    $.ajax( { url         : "./new-project",
              type        : "POST",
              data        : JSON.stringify( { "project_id"   : project_id,
                                              "project_name" : project_name } ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var result_json = result["responseJSON"] ? result["responseJSON"] : null;
                             if( !result_json )
                             {
                                 callback( "Unexpected result returned when starting project", "" );
                                 return;
                             }
                             
                             var error_str  = result_json["error_str"] ? result_json["error_str"]  : "";
                             if( error_str )
                             {
                                 callback( "Starting project failed\n\nError: " + error_str, "" );
                                 return;
                             }
    
                             var project_id = result_json["project_id"] ? result_json["project_id"] : "";
                             if( !project_id )
                             {
                                 callback( "Starting project returned no result", "" );
                                 return;
                             }
                             
                             callback( "", project_id );
                             
                         }
                         
            } );
}



