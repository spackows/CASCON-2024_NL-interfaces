
const g_fs  = require( "fs" );
const g_uid = require( "short-unique-id" );

const g_log = require( "./my_log.js" );


var g_default_projects = { "sample_rag-eval" : { "name" : "[ SAMPLE ] RAG eval filters", "mockup" : "RAG_EVAL" } };


var exports = module.exports = {};


exports.defaultProjects = function()
{
    return [ { "PROJECT_ID" : "sample_rag-eval", "PROJECT_NAME" : "[ SAMPLE ] RAG eval filters" } ];
}


exports.sampleProject = function( sample_id, callback )
{
    var func_name = "my_sample-project.sampleProject";
    
    try
    {
        var prompts_arr = JSON.parse( g_fs.readFileSync( "sample-data/" + sample_id + "_prompts_arr.json", "utf8" ) );
        var elem_arr    = JSON.parse( g_fs.readFileSync( "sample-data/" + sample_id + "_elem_arr.json",    "utf8" ) );
        
        var sample_data = { "project_name" : g_default_projects[ sample_id ]["name"],
                            "mockup_type"  : g_default_projects[ sample_id ]["mockup"],
                            "prompts_arr"  : prompts_arr,
                            "elem_arr"     : elem_arr };
    
        callback( "", sample_data );
    }
    catch( e )
    {
        var msg = "Creating sample project failed";
        g_log.writeLog( func_name + ": " + msg + "\nError: " + e.message );
        callback( msg, "", {} );
    }
    
}

