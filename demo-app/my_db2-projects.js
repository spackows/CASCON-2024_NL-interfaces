
const g_underscore = require( "underscore"      );
const g_uid        = require( "short-unique-id" );

const g_db2    = require( "./my_db2.js"        );
const g_log    = require( "./my_log.js"        );
const g_ts     = require( "./my_timestamps.js" );

const g_schema = process.env.DB2SCHEMA;


var exports = module.exports = {};



exports.loadProjects = function( login_email, callback )
{
    var func_name = "my_db2-projects.loadProjects";
    
    var sql = "SELECT TS, PROJECT_ID, PROJECT_NAME " +
              "FROM " + g_schema + ".PROJECTS " +
              "WHERE OWNER_EMAIL='" + login_email + "' " +
              "ORDER BY TS DESC;"
              
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        //g_log.writeLog( func_name + " sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
        
        if( sql_error_str )
        {
            g_log.writeLog( func_name + " failed.\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            var msg = "Querying the database failed";
            callback ( msg, [] );
            return;
        }
        
        if( !sql_result )
        {
            var msg = "Database query returned an invalid result";
            callback ( msg, [] );
            return;
        }
        
        var projects_arr = [];
        
        var role = "";
        var privileges_arr = [];
        for( var i = 0; i < sql_result.length; i++ )
        {
            projects_arr.push( { "PROJECT_ID"   : sql_result[i]["PROJECT_ID"],
                                 "PROJECT_NAME" : addSingleQuotes( sql_result[i]["PROJECT_NAME"] ) } );
        }
        
        callback( "", projects_arr );
        
    } );

}


exports.saveSampleProject = function( sample_data, callback )
{
    var func_name = "my_db2-projects.saveSampleProject";
    
    var project_name = ( ( "project_name" in sample_data ) && sample_data["project_name"] ) ? sample_data["project_name"] : "";
    var mockup_type  = ( ( "mockup_type"  in sample_data ) && sample_data["mockup_type"]  ) ? sample_data["mockup_type"]  : "";
    var prompts_arr  = ( ( "prompts_arr"  in sample_data ) && sample_data["prompts_arr"] && Array.isArray( sample_data["prompts_arr"] ) ) ? sample_data["prompts_arr"] : [];
    var elem_arr     = ( ( "elem_arr"     in sample_data ) && sample_data["elem_arr"]    && Array.isArray( sample_data["elem_arr"]    ) ) ? sample_data["elem_arr"]    : [];
    
    var project_error_str = "";
    var project_id        = "";
    var prompts_error_str = "";
    
    saveNewProject( project_name, "workshop", mockup_type, elem_arr, function( project_error_str, project_id )
    {
        if( project_error_str )
        {
            callback( project_error_str, "" );
            return;
        }
        
        saveNewPrompts( project_id, prompts_arr, function( prompts_error_str )
        {
            callback( project_error_str, project_id );
            
        } );
    
    } );

}


function saveNewProject( project_name, owner_email, mockup_type, elem_arr, callback )
{
    var func_name = "my_db2-projects.saveNewProject";
    
    if( !project_name || !mockup_type )
    {
        var msg = "Invalid project details specified";
        g_log.writeLog( func_name + ": " + msg          + "\n" +
                        "project_name: " + project_name + "\n" +
                        "owner_email:  " + owner_email  + "\n" +
                        "mockup_type:  " + mockup_type  + "\n" +
                        "elem_arr:\n" + JSON.stringify( elem_arr, null, 3 ) );
        callback( msg, "" );
        return;
    }

    var uid = new g_uid( { length: 12 } );
    
    var project_id = "proj_" + uid.rnd();
    
    var ts = new Date().getTime();
    var ts_str = g_ts.myGetLongDateStrUTC( ts );
        
    var sql = "INSERT INTO " + g_schema + ".PROJECTS " +
              "( PROJECT_ID, "   +
                "TS, "           +
                "TS_FORMATTED, " +
                "PROJECT_NAME, " +
                "OWNER_EMAIL, "  +
                "MOCKUP_TYPE, "  +
                "ELEM_ARR "      +
              ") " +
              "VALUES ( '" + project_id   + "', " +
                       "'" + ts           + "', " +
                       "'" + ts_str       + "', " +
                       "'" + project_name + "', " +
                       "'" + owner_email  + "', " +
                       "'" + mockup_type  + "', " +
                       "'" + removeSingleQuotes( JSON.stringify( elem_arr ) ) + "' "  +
                     ");"
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving project details in the database failed";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg, "" );
            return;
        }
        
        callback( "", project_id );
        
    } );
    
}


function saveNewPrompts( project_id, prompts_arr, callback )
{
    if( !prompts_arr || ( prompts_arr.length < 1 ) )
    {
        callback( "" );
        return;
    }
    
    var prompt_details_json = prompts_arr.shift();
    
    saveNewPrompt( project_id, prompt_details_json, function( error_str )
    {
        if( error_str )
        {
            callback( error_str );
            return;
        }
        
        saveNewPrompts( project_id, prompts_arr, function( final_error_str )
        {
            callback( final_error_str );
        
        } );
        
    } );
    
}


function saveNewPrompt( project_id, prompt_details_json, callback )
{
    var func_name = "my_db2-projects.saveNewPrompt";
    
    var uid = new g_uid( { length: 12 } );
    
    var prompt_id = "prompt_" + uid.rnd();
    
    var prompt_name = ( "prompt_name" in prompt_details_json ) && prompt_details_json["prompt_name"] ? prompt_details_json["prompt_name"] : "";
    var model_id    = ( "model_id"    in prompt_details_json ) && prompt_details_json["model_id"]    ? prompt_details_json["model_id"]    : "";
    var parms_json  = ( "parms_json"  in prompt_details_json ) && prompt_details_json["parms_json"]  ? prompt_details_json["parms_json"]  : {};
    var prompt_txt  = ( "prompt_txt"  in prompt_details_json ) && prompt_details_json["prompt_txt"]  ? prompt_details_json["prompt_txt"]  : "";
    
    if( !project_id || !prompt_id || !prompt_name )
    {
        var msg = "Invalid prompt details specified";
        g_log.writeLog( func_name + ": " + msg + "\n" +
                        "project_id: " + project_id + "\n" +
                        "prompt_id:  " + prompt_id  + "\n" +
                        "prompt_details_json:\n" + JSON.stringify( prompt_details_json, null, 3 ) );
        callback( msg );
        return;
    }

    var sql = "INSERT INTO " + g_schema + ".PROMPTS " +
              "( PROMPT_ID, "   +
                "PROMPT_NAME, " +
                "MODEL_ID, "    +
                "PARMS_JSON, "  +
                "PROMPT_TXT, "  +
                "PROJECT_ID "   +
              ") " +
              "VALUES ( '" + prompt_id   + "', " +
                       "'" + prompt_name + "', " +
                       "'" + model_id    + "', " +
                       "'" + removeSingleQuotes( JSON.stringify( parms_json ) ) + "', "  +
                       "'" + removeSingleQuotes( prompt_txt ) + "', " +
                       "'" + project_id  + "' " +
                     ");"
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving prompt details in the database failed";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg );
            return;
        }
        
        callback( "" );
        
    } );
    
}


exports.loadProject = function( project_id, callback )
{
    var func_name = "my_db2-projects.loadProject";
    
    var sql = "SELECT * " +
              "FROM " + g_schema + ".PROJECTS " +
              "WHERE PROJECT_ID='" + project_id + "';"
              
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        //g_log.writeLog( func_name + " sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
        
        if( sql_error_str )
        {
            g_log.writeLog( func_name + " failed.\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            var msg = "Querying the database failed";
            callback ( msg, {} );
            return;
        }
        
        if( !sql_result || !Array.isArray( sql_result ) )
        {
            var msg = "Database query returned an invalid result";
            callback ( msg, {} );
            return;
        }
        
        if( sql_result.length < 1 )
        {
            var msg = "No project was found with the given project_id (" + project_id + ")";
            callback( msg, {} );
            return;
        }
        
        try
        {
            var project_json = { "project_name" : addSingleQuotes( sql_result[0]["PROJECT_NAME"] ),
                                 "owner_email"  : sql_result[0]["OWNER_EMAIL"],
                                 "mockup_type"  : sql_result[0]["MOCKUP_TYPE"] };
            
            //g_log.writeLog( func_name + " project_json:\n" + JSON.stringify( project_json, null, 3 ) );
                            
            callback( "", project_json );
            
        }
        catch( e )
        {
            var msg = "Processing project information from the database failed";
            g_log.writeLog( func_name + ": " + msg + "\n" +
                            "Error: " + e.message + "\n" +
                            "sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
            callback( msg, {} );
        }
        
    } );

}


exports.loadPrompts = function( project_id, callback )
{
    loadPrompts( project_id, function( error_str, prompts_arr )
    {
        callback( error_str, prompts_arr );
        
    } );
    
}


function loadPrompts( project_id, callback )
{
    var func_name = "my_db2-projects.loadPrompts";
    
    var sql = "SELECT * " +
              "FROM " + g_schema + ".PROMPTS " +
              "WHERE PROJECT_ID='" + project_id + "';"
              
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        //g_log.writeLog( func_name + " sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
        
        if( sql_error_str )
        {
            g_log.writeLog( func_name + " failed.\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            var msg = "Querying the database failed";
            callback ( msg, [] );
            return;
        }
        
        if( !sql_result || !Array.isArray( sql_result ) )
        {
            var msg = "Database query returned an invalid result";
            callback ( msg, [] );
            return;
        }

        try
        {
            var prompts_arr = [];
            
            for( var i = 0; i < sql_result.length; i++ )
            {
                prompts_arr.push( { "prompt_id"   : sql_result[i]["PROMPT_ID"],
                                    "prompt_name" : sql_result[i]["PROMPT_NAME"],
                                    "model_id"    : sql_result[i]["MODEL_ID"],
                                    "parms_json"  : JSON.parse( addSingleQuotes( sql_result[i]["PARMS_JSON"] ) ),
                                    "prompt_txt"  : addSingleQuotes( sql_result[i]["PROMPT_TXT"] ) } );
            }
            
            //g_log.writeLog( func_name + " prompts_arr:\n" + JSON.stringify( prompts_arr, null, 3 ) );
                            
            callback( "", prompts_arr );
            
        }
        catch( e )
        {
            var msg = "Processing prompts information from the database failed";
            g_log.writeLog( func_name + ": " + msg + "\n" +
                            "Error: " + e.message + "\n" +
                            "sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
            callback( msg, [] );
        }
        
    } );

}


exports.loadLogs = function( project_id, callback )
{
    var func_name = "my_db2-projects.loadLogs";
    
    var sql = "SELECT * " +
              "FROM " + g_schema + ".LOGS " +
              "WHERE PROJECT_ID='" + project_id + "';"
              
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        //g_log.writeLog( func_name + " sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
        
        if( sql_error_str )
        {
            g_log.writeLog( func_name + " failed.\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            var msg = "Querying the database failed";
            callback ( msg, "", "" );
            return;
        }
        
        if( !sql_result || !Array.isArray( sql_result ) )
        {
            var msg = "Database query returned an invalid result";
            callback ( msg, "", "" );
            return;
        }

        if( sql_result.length < 1 )
        {
            callback ( "", "", "" );
            return;
        }
        
        var highlights_txt = addSingleQuotes( sql_result[0]["HIGHLIGHTS_TXT"] );
        var details_txt    = addSingleQuotes( sql_result[0]["DETAILS_TXT"] );
        
        callback( "", highlights_txt, details_txt );
        
    } );

}


exports.savePromptText = function( project_id, prompt_id, prompt_txt, callback )
{
    var func_name = "my_db2-projects.savePromptText";

    var sql = "UPDATE " + g_schema + ".PROMPTS " +
              "SET PROMPT_TXT='" + removeSingleQuotes( prompt_txt ) + "' " +
              "WHERE PROJECT_ID='" + project_id + "' " +
              "AND PROMPT_ID='" + prompt_id + "';";
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving prompt details in the database failed";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg );
            return;
        }
        
        callback( "" );
        
    } );
        
}


exports.loadElemArr = function( project_id, callback )
{
    loadElemArr( project_id, function( error_str, elem_arr )
    {
        callback( error_str, elem_arr );
        
    } );
}


function loadElemArr( project_id, callback )
{
    var func_name = "my_db2-projects.loadElemArr";
    
    var sql = "SELECT * " +
              "FROM " + g_schema + ".PROJECTS " +
              "WHERE PROJECT_ID='" + project_id + "';"
              
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        //g_log.writeLog( func_name + " sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
        
        if( sql_error_str )
        {
            g_log.writeLog( func_name + " failed.\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            var msg = "Querying the database failed";
            callback ( msg, [] );
            return;
        }
        
        if( !sql_result || !Array.isArray( sql_result ) )
        {
            var msg = "Database query returned an invalid result";
            callback ( msg, [] );
            return;
        }
        
        if( sql_result.length < 1 )
        {
            var msg = "No project was found with the given project_id (" + project_id + ")";
            callback( msg, [] );
            return;
        }
        
        try
        {
            var elem_arr = JSON.parse( addSingleQuotes( sql_result[0]["ELEM_ARR"] ) );
            
            //g_log.writeLog( func_name + " elem_arr:\n" + JSON.stringify( elem_arr, null, 3 ) );
                            
            callback( "", elem_arr );
            
        }
        catch( e )
        {
            var msg = "Processing project information from the database failed";
            g_log.writeLog( func_name + ": " + msg + "\n" +
                            "Error: " + e.message + "\n" +
                            "sql_result:\n" + JSON.stringify( sql_result, null, 3 ) );
            callback( msg, [] );
        }
        
    } );

}


exports.saveElemArr = function( project_id, elem_arr, callback )
{
    var func_name = "my_db2-projects.saveElemArr";

    var sql = "UPDATE " + g_schema + ".PROJECTS " +
              "SET ELEM_ARR='" + removeSingleQuotes( JSON.stringify( elem_arr ) ) + "' " +
              "WHERE PROJECT_ID='" + project_id + "';";
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving element details in the database failed";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg );
            return;
        }
        
        callback( "" );
        
    } );

}


exports.loadPromptsAndElemArr = function( project_id, callback )
{
    var func_name = "my_db2-projects.loadPromptsAndElemArr";
    
    var prompts_error_str = "";
    var prompts_arr = [];
    var prompt_json = {};
    var elem_error_str = "";
    var elem_arr = [];
    
    var taskComplete = g_underscore.after( 2, function()
    {
        if( prompts_error_str || elem_error_str )
        {
            var msg = "Looking up prompt details failed";
            callback( msg, {}, [] );
            return;
        }
        
        var matches = [];
        for( var i = 0; i < prompts_arr.length; i++ )
        {
            matches = prompts_arr[i]["prompt_name"].toLowerCase().match( /classify|element|value|help/i );
            if( !matches || ( matches.length < 1 ) )
            {
                g_log.writeLog( func_name + " Unexpected prompt:\n" + JSON.stringify( prompts_arr[i], null, 3 ) );
                continue;
            }
            
            prompt_json[ matches[0] ] = prompts_arr[i];
        }
        
        if( Object.keys( prompt_json ).length < 4 )
        {
            var msg = "Failed to look up all required prompts";
            callback( msg, {}, [] );
            return;
        }
        
        callback( "", prompt_json, elem_arr );
        
    } );
    
    loadPrompts( project_id, function( error_str, result_arr )
    {
        prompts_error_str = error_str;
        prompts_arr = result_arr;
        taskComplete();
        
    } );
    
    loadElemArr( project_id, function( error_str, result_arr )
    {
        elem_error_str = error_str;
        elem_arr = result_arr;
        taskComplete();
        
    } );
    
}


exports.saveLog_org = function( project_id, highlights_txt, details_txt, callback )
{
    var highlights_error_str = "";
    var details_error_str    = "";
    
    var taskComplete = g_underscore.after( 2, function()
    {
        callback( highlights_error_str + details_error_str );
        
    } );

    saveHighlightsLog( project_id, highlights_txt, function( error_str )
    {
        highlights_error_str = error_str;
        taskComplete();
        
    } );

    saveDetailsLog( project_id, details_txt, function( error_str )
    {
        details_error_str = error_str;
        taskComplete();
        
    } );

}


exports.saveLog = function( project_id, highlights_txt, details_txt, callback )
{
    var func_name = "my_db2-projects.saveLog";
    
    if( !highlights_txt && !details_txt )
    {
        callback( "" );
        return;
    }

    if( !project_id )
    {
        var msg = func_name + ": No 'project_id' specified; ";
        callback( msg );
        return;
    }
    
    var sql = "MERGE INTO " + g_schema + ".LOGS AS T " + 
              "USING ( VALUES ( '" + project_id + "' ) ) AS S( PROJECT_ID ) " + 
              "ON ( T.PROJECT_ID = S.PROJECT_ID ) " + 
              "WHEN MATCHED THEN " + 
                  "UPDATE SET HIGHLIGHTS_TXT = CONCAT( HIGHLIGHTS_TXT, '" + removeSingleQuotes( highlights_txt ) + "' ), " +
                             "DETAILS_TXT    = CONCAT( DETAILS_TXT,    '" + removeSingleQuotes( details_txt    ) + "' ) " +
              "WHEN NOT MATCHED THEN " + 
                  "INSERT ( PROJECT_ID, " + 
                           "HIGHLIGHTS_TXT, " + 
                           "DETAILS_TXT " +
                         ") " + 
                  "VALUES ( '" + project_id + "', " + 
                           "'" + removeSingleQuotes( highlights_txt ) + "', " + 
                           "'" + removeSingleQuotes( details_txt    ) + "' " + 
                         ");"
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving log info in the database failed; ";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg );
            return;
        }
        
        callback( "" );
        
    } );

}


function saveDetailsLog( project_id, details_txt, callback )
{
    if( !details_txt )
    {
        callback( "" );
        return;
    }

    var func_name = "my_db2-projects.saveDetailsLog";
    
    if( !project_id )
    {
        var msg = func_name + ": No 'project_id' specified; ";
        callback( msg );
        return;
    }
    
    var sql = "UPDATE " + g_schema + ".LOGS " +
              "SET DETAILS_TXT = ISNULL( DETAILS_TXT, '' ) + '" + removeSingleQuotes( details_txt ) + "' " +
              "WHERE PROJECT_ID='" + project_id + "';"
    
    //g_log.writeLog( func_name + " sql:\n" + sql );
    
    runSQL( sql, function( sql_error_str, sql_result )
    {
        if( sql_error_str )
        {
            var msg = "Saving log details in the database failed; ";
            g_log.writeLog( func_name + " " + msg + "\n" +
                            "sql:\n" + sql + "\n" +
                            "error:\n" + sql_error_str );
                            
            callback ( msg );
            return;
        }
        
        callback( "" );
        
    } );

}



function removeSingleQuotes( txt )
{
    return g_db2.removeSingleQuotes( txt );
}


function addSingleQuotes( txt )
{
    return g_db2.addSingleQuotes( txt );
}


function runSQL( sql, callback )
{
    g_db2.runSQL( sql, function( error_str, sql_result )
    {
        callback( error_str, sql_result );
        
    } );

}

