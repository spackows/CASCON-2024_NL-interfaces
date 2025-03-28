
const g_express      = require( "express"     );
const g_bodyParser   = require( "body-parser" );

const g_log      = require( "./my_log.js"            );
const g_db2      = require( "./my_db2.js"            );
const g_db2_proj = require( "./my_db2-projects.js"   );
const g_sample   = require( "./my_sample-project.js" );
const g_llm      = require( "./my_llm.js"            );

var g_app = g_express();
g_app.use( g_express.static( __dirname + '/public' ) );
g_app.use( g_bodyParser.json() );
g_app.use( g_bodyParser.urlencoded( { extended: true } ) );
g_app.set( "view engine", "ejs" );


const PORT = 8080;
g_app.listen( 8080, function()
{
    g_log.writeLog( "[server] Server running" );

} );


g_db2.createConnPool();


g_app.get( '/', function( request, response )
{
    //g_log.writeLog( "[server] / query:\n"   + JSON.stringify( request.query,   null, 3 ) );
    
    var project_id    = ( request && request.query && request.query.project_id    ) ? request.query.project_id.toString()    : "";
    var slider_width  = ( request && request.query && request.query.slider_width  ) ? request.query.slider_width.toString()  : "";
    var right_scroll  = ( request && request.query && request.query.right_scroll  ) ? request.query.right_scroll.toString()  : "";
    var collapse      = ( request && request.query && request.query.collapse      ) ? request.query.collapse.toString()      : "";
    var prompt_index  = ( request && request.query && request.query.prompt_index  ) ? request.query.prompt_index.toString()  : "";
    var prompt_height = ( request && request.query && request.query.prompt_height ) ? request.query.prompt_height.toString() : "";
    var elem_height   = ( request && request.query && request.query.elem_height   ) ? request.query.elem_height.toString()   : "";
    var selected_logs = ( request && request.query && request.query.selected_logs ) ? request.query.selected_logs.toString() : "";
    var logs_height   = ( request && request.query && request.query.logs_height   ) ? request.query.logs_height.toString()   : "";
    
    if( !project_id )
    {
        response.render( "pages/home", { "error_str" : "" } );    
        
        return;
    }
    
    g_db2_proj.loadProject( project_id, function( project_error_str, project_json )
    {
        if( project_error_str )
        {
            var msg = "Loading the specified project failed. Error:\n\n" + project_error_str;
            response.render( "pages/home", { "error_str" : msg } ); 
            return;
        }
        
        if( "RAG_EVAL" == project_json["mockup_type"] )
        {
            var first_date_str = ( request && request.query && request.query.first_date  ) ? request.query.first_date.toString()  : "";
            var final_date_str = ( request && request.query && request.query.final_date  ) ? request.query.final_date.toString()  : "";
            var sample_size    = ( request && request.query && request.query.sample_size ) ? request.query.sample_size.toString() : "";
            var evaluated      = ( request && request.query && request.query.evaluated   ) ? request.query.evaluated.toString()   : "";
            
            response.render( "pages/main-rag-eval", { "project_id"    : project_id,
                                                      "slider_width"  : slider_width,
                                                      "right_scroll"  : right_scroll,
                                                      "collapse"      : collapse,
                                                      "prompt_index"  : prompt_index,
                                                      "prompt_height" : prompt_height,
                                                      "elem_height"   : elem_height,
                                                      "selected_logs" : selected_logs,
                                                      "logs_height"   : logs_height,
                                                      "first_date"    : first_date_str,
                                                      "final_date"    : final_date_str,
                                                      "sample_size"   : sample_size,
                                                      "evaluated"     : evaluated } );
            return;
        }
        
        var msg = "Other samples not supported";
        response.render( "pages/home", { "error_str" : msg } ); 
        
    } );
        
} );


g_app.post( '/load-projects', function( request, response )
{
    var projects_arr = g_sample.defaultProjects();
    
    response.status( 200 ).send( { "error_str"    : "", 
                                   "projects_arr" : projects_arr } );
        
} );


g_app.post( '/new-project', function( request, response )
{
    //g_log.writeLog( "[server] /new-project body:\n" + JSON.stringify( request.body,   null, 3 ) );
    
    var project_id_in = ( request && request.body && request.body.project_id   ) ? request.body.project_id.toString()   : "";
    
    if( !project_id_in.match( /^sample_rag-eval|sample_prompt-lab$/ ) )
    {
        response.status( 200 ).send( { "error_str" : "Invalid project ID specified" } );
        return;
    }
    
    g_sample.sampleProject( project_id_in, function( sample_error_str, sample_data )
    {
        if( sample_error_str )
        {
            response.status( 200 ).send( { "error_str"  : sample_error_str } );
            return;
        }
        
        //g_log.writeLog( "[server] /new-project sample_data:\n" + JSON.stringify( sample_data, null, 3 ) );
        
        g_db2_proj.saveSampleProject( sample_data, function( sample_save_error_str, project_id )
        {
            response.status( 200 ).send( { "error_str"  : sample_save_error_str, 
                                           "project_id" : project_id } );
            
        } );
        
    } );
    
    
} );


g_app.post( '/load-prompts', function( request, response )
{
    //g_log.writeLog( "[server] /load-prompts body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id = ( request && request.body && request.body.project_id ) ? request.body.project_id.toString() : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    g_db2_proj.loadPrompts( project_id, function( error_str, prompts_arr )
    {

        response.status( 200 ).send( { "error_str"   : error_str, 
                                       "prompts_arr" : prompts_arr } );
        
    } );
    
} );


g_app.post( '/save-prompt-text', function( request, response )
{
    //g_log.writeLog( "[server] /save-prompt-text body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id = ( request && request.body && request.body.project_id ) ? request.body.project_id.toString() : "";
    var prompt_id  = ( request && request.body && request.body.prompt_id  ) ? request.body.prompt_id.toString()  : "";
    var prompt_txt = ( request && request.body && request.body.prompt_txt ) ? request.body.prompt_txt.toString() : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    if( !prompt_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'prompt_id' specified" } );
        return;
    }
    
    if( !prompt_txt )
    {
        response.status( 200 ).send( { "error_str" : "No 'prompt_txt' specified" } );
        return;
    }
    
    g_db2_proj.savePromptText( project_id, prompt_id, prompt_txt, function( error_str )
    {

        var error_str = "";
                                               
        response.status( 200 ).send( { "error_str" : error_str } );
        
    } );
    
} );


g_app.post( '/load-elem-arr', function( request, response )
{
    //g_log.writeLog( "[server] /load-elem-arr body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id = ( request && request.body && request.body.project_id ) ? request.body.project_id.toString() : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    g_db2_proj.loadElemArr( project_id, function( error_str, elem_arr )
    {
        response.status( 200 ).send( { "error_str" : error_str, 
                                       "elem_arr"  : elem_arr } );
        
    } );
    
} );


g_app.post( '/save-elem-arr', function( request, response )
{
    //g_log.writeLog( "[server] /save-elem-arr body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id = ( request && request.body && request.body.project_id ) ? request.body.project_id.toString() : "";
    var elem_arr   = ( request && request.body && request.body.elem_arr   ) ? request.body.elem_arr : null;
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    if( !elem_arr )
    {
        response.status( 200 ).send( { "error_str" : "No 'elem_arr' specified" } );
        return;
    }
    
    g_db2_proj.saveElemArr( project_id, elem_arr, function( error_str )
    {
        response.status( 200 ).send( { "error_str" : error_str } );
        
    } );
    
} );


g_app.post( '/load-logs', function( request, response )
{
    //g_log.writeLog( "[server] /load-logs body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id = ( request && request.body && request.body.project_id ) ? request.body.project_id.toString() : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    g_db2_proj.loadLogs( project_id, function( error_str, highlights_txt, details_txt )
    {
        response.status( 200 ).send( { "error_str" : error_str, 
                                       "highlights_txt" : highlights_txt, 
                                       "details_txt"    : details_txt } );
        
    } );
    
} );


g_app.post( '/save-log', function( request, response )
{
    //g_log.writeLog( "[server] /save-elem-arr body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id     = ( request && request.body && request.body.project_id     ) ? request.body.project_id.toString()     : "";
    var highlights_txt = ( request && request.body && request.body.highlights_txt ) ? request.body.highlights_txt.toString() : "";
    var details_txt    = ( request && request.body && request.body.details_txt    ) ? request.body.details_txt.toString()    : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    g_db2_proj.saveLog( project_id, highlights_txt, details_txt, function( error_str )
    {
        response.status( 200 ).send( { "error_str" : error_str } );
        
    } );
    
} );


g_app.post( '/llm', function( request, response )
{
    //g_log.writeLog( "[server] /llm body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var project_id       = ( request && request.body && request.body.project_id       ) ? request.body.project_id.toString()       : "";
    var input_txt        = ( request && request.body && request.body.input_txt        ) ? request.body.input_txt.toString()        : "";
    var mouse_pos_dom_id = ( request && request.body && request.body.mouse_pos_dom_id ) ? request.body.mouse_pos_dom_id.toString() : "";
    
    if( !project_id )
    {
        response.status( 200 ).send( { "error_str" : "No 'project_id' specified" } );
        return;
    }
    
    g_db2_proj.loadPromptsAndElemArr( project_id, function( db2_error_str, prompts_json, elem_arr )
    {
        if( db2_error_str )
        {
            response.status( 200 ).send( { "error_str" : "Loading details for prompting failed" } );
            return;            
        }
        
        g_llm.classifyInput( input_txt, prompts_json["classify"], function( classify_error_str, nli_class, classify_logs_details_txt )
        {
            if( classify_error_str )
            {
                //g_log.writeLog( "[server] /llm result (1):\n" +
                //                "error_str: " + classify_error_str + "\n" +
                //                "nli_class: " + nli_class          + "\n" +
                //                "element_in_question: " + ""       + "\n" +
                //                "contextual_help: " + ""           + "\n" +
                //                "task_values_arr:\n" + JSON.stringify( "[]" ) );

                response.status( 200 ).send( { "error_str" : classify_error_str, 
                                               "nli_class" : "", 
                                               "element_in_question" : "",
                                               "contextual_help" : "",
                                               "task_values_arr" : [] } );
                return;
            }
            
            var logs_details_txt = classify_logs_details_txt;
            
            if( !nli_class.match( /^question|action_request|none$/ ) )
            {
                var msg = "Unexpected classification: " + nli_class;

                //g_log.writeLog( "[server] /llm result (2):\n" +
                //                "error_str: " + msg          + "\n" +
                //                "nli_class: " + nli_class    + "\n" +
                //                "element_in_question: " + "" + "\n" +
                //                "contextual_help: " + ""     + "\n" +
                //                "task_values_arr:\n" + JSON.stringify( "[]" ) );

                response.status( 200 ).send( { "error_str" : msg, 
                                               "nli_class" : nli_class, 
                                               "element_in_question" : "",
                                               "contextual_help"  : "",
                                               "task_values_arr"  : [],
                                               "logs_details_txt" : logs_details_txt } );
                return;
            }
                
            g_llm.getRelatedElementAndValues( input_txt, 
                                              nli_class, 
                                              mouse_pos_dom_id, 
                                              elem_arr, 
                                              prompts_json["element"], 
                                              prompts_json["value"], 
                                              function( element_error_str, element_in_question, task_values_arr, element_values_logs_details_txt )
            {
                logs_details_txt += element_values_logs_details_txt;
                
                switch( nli_class )
                {
                    case "action_request":
                    
                        //g_log.writeLog( "[server] /llm result (3):\n" +
                        //                "error_str: " + element_error_str + "\n" +
                        //                "nli_class: " + nli_class         + "\n" +
                        //                "element_in_question: " + element_in_question + "\n" +
                        //                "contextual_help: " + ""          + "\n" +
                        //                "task_values_arr:\n" + JSON.stringify( task_values_arr, null, 3 ) );
                        
                        response.status( 200 ).send( { "error_str" : element_error_str, 
                                                       "nli_class" : nli_class, 
                                                       "element_in_question" : element_in_question,
                                                       "contextual_help"  : "",
                                                       "task_values_arr"  : task_values_arr,
                                                       "logs_details_txt" : logs_details_txt } );
                        break;
                    
                    default:
                    
                        g_llm.generateContextualHelp( input_txt, 
                                                      mouse_pos_dom_id, 
                                                      element_in_question, 
                                                      elem_arr, 
                                                      prompts_json["help"], 
                                                      function( help_error_str, help_output, help_logs_details_txt )
                        {
                            //g_log.writeLog( "[server] /llm result (4):\n" +
                            //                "error_str: " + help_error_str    + "\n" +
                            //                "nli_class: " + nli_class         + "\n" +
                            //                "element_in_question: " + element_in_question + "\n" +
                            //                "contextual_help: " + help_output + "\n" +
                            //                "task_values_arr:\n" + JSON.stringify( task_values_arr, null, 3 ) );
                        
                            logs_details_txt += help_logs_details_txt;
                            
                            response.status( 200 ).send( { "error_str" : help_error_str, 
                                                           "nli_class" : nli_class, 
                                                           "element_in_question" : element_in_question,
                                                           "contextual_help"  : help_output,
                                                           "task_values_arr"  : task_values_arr,
                                                           "logs_details_txt" : logs_details_txt } );
                        } );
                        
                }
                
            } );
            
        } );
        
    } );
    
} );


//
// RAG eval QA pairs data
//
g_app.post( '/data', function( request, response )
{
    //g_log.writeLog( "[server] /data body:\n" + JSON.stringify( request.body, null, 3 ) );
    
    var first_date  = ( request && request.body && request.body.first_date  ) ? request.body.first_date.toString()  : "";
    var final_date  = ( request && request.body && request.body.final_date  ) ? request.body.final_date.toString()  : "";
    var sample_size = ( request && request.body && request.body.sample_size ) ? request.body.sample_size.toString() : "";
    var evaluated   = ( request && request.body && request.body.evaluated   ) ? request.body.evaluated.toString()   : "";
    
    g_db2.loadData( first_date,
                    final_date,
                    sample_size,
                    evaluated,
    function( error_str, qa_arr, eval_json )
    {
        response.status( 200 ).send( { "error_str" : error_str, 
                                       "qa_arr"    : qa_arr, 
                                       "eval_json" : eval_json } );
        
    } );
    
} );


//
// Misc
//
g_app.get( "/logs", function( request, response )
{
    g_log.readLog( function( content )
    {
        response.status( 200 ).end( content );
        
    } );
    
} );


g_app.post( "/clearlog", function( request, response )
{
    g_log.clearLog( function( error_str )
    {
        if( error_str )
        {
            response.status( 500 ).send( JSON.stringify( { error_str : error_str }, null, 3 ) );
            return;
        }            
        
        response.status( 200 ).send( JSON.stringify( { result : "Success" }, null, 3 ) );
        
    } );
        
} );


g_app.get( "/health", function( request, response )
{
    // For Code Engine pipeline to check
    
    g_log.writeLog( "[server] /health ..." );
    
    response.status( 200 ).send( "Success" );
    
} );











