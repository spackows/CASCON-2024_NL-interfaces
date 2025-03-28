
const g_log = require( "./my_log.js" );

const g_axios = require( "axios" );
const g_querystring = require( "querystring" );

const g_cloud_apikey  = process.env.CLOUDAPIKEY;
const g_cloud_IAM_url = process.env.CLOUDIAMURL;
const g_wml_url       = process.env.WMLURL;
const g_wx_project_id = process.env.WXPROJECTID;

var exports = module.exports = {};


exports.classifyInput = function( user_input_txt, prompt_json, callback )
{
    var func_name = "my_llm.classifyInput";
    
    getToken( function( token_error_str, token )
    {
        if( token_error_str )
        {
            callback( token_error_str, "", "" );
            return;
        }
        
        var prompt_txt = prompt_json["prompt_txt"];
        prompt_txt = prompt_txt.replace( /__USER_INPUT_PLACEHOLDER__/, user_input_txt );
                                 
        var model_id = prompt_json["model_id"];
        
        var parameters = prompt_json["parms_json"];
        
        generate( model_id, prompt_txt, parameters, token, function( error_str, nli_class )
        {
            var logs_details_txt = "\n\n---------- " + func_name + "\n[ prompt_txt: ]\n" + prompt_txt + "\n\n[ generated output: ]\n" + nli_class + "\n\n";
            
            g_log.writeLog( logs_details_txt );
            
            callback( error_str, nli_class, logs_details_txt );
            
        } );
            
    } );
    
}


exports.generateContextualHelp = function( question_txt, 
                                           mouse_pos_dom_id, 
                                           dom_id_in_question, 
                                           element_details_arr, 
                                           prompt_json,
                                           callback )
{
    var func_name = "my_llm.generateContextualHelp";
    
    var dom_id = ( dom_id_in_question && !dom_id_in_question.match( /^none$/i ) ) ? dom_id_in_question : mouse_pos_dom_id;
    var element_name = "";
    var article_txt = "";
    
    if( !dom_id || ( dom_id.match( /^none$/i ) ) )
    {
        // General question
        var logs_details_txt = "[ Returning a curated, hard-coded answer for a general question ]";
        callback( "", "General information: This web app is for reviewing answers returned by a RAG solution.", logs_details_txt );
        return;
    }
    
    var element_json = null;
    for( var i = 0; i < element_details_arr.length; i++ )
    {
        if( dom_id == element_details_arr[i]["dom_id"] )
        {
            element_json = element_details_arr[i];
            element_name = element_json["element_name"];
            break;
        }
    }
    
    if( null == element_json )
    {
        // This shouldn't happen
        var msg = "There is no information available for the indicated element.";
        callback( "", msg, "" );
        return;
    }
        
    // TO DO: Chop article length, when needed
    
    getToken( function( token_error_str, token )
    {
        if( token_error_str )
        {
            callback( token_error_str, "", "" );
            return;
        }
        
        var prompt_txt = prompt_json["prompt_txt"];
        prompt_txt = prompt_txt.replace( /__ELEMENT_PLACEHOLDER__/, element_json["element_name"] );
        prompt_txt = prompt_txt.replace( /__TASK_PLACEHOLDER__/, element_json["task_description"] );
        prompt_txt = prompt_txt.replace( /__ARTICLE_PLACEHOLDER__/, element_json["article_txt_arr"].join( "\n\n" ) );
        prompt_txt = prompt_txt.replace( /__ELEMENT_PLACEHOLDER__/, element_json["element_name"] );
        prompt_txt = prompt_txt.replace( /__USER_INPUT_PLACEHOLDER__/, question_txt );
                                 
        var model_id = prompt_json["model_id"];
        
        var parameters = prompt_json["parms_json"];
        
        generate( model_id, prompt_txt, parameters, token, function( error_str, generated_output )
        {
            var logs_details_txt = "\n\n---------- " + func_name + "\n[ prompt_txt: ]\n" + prompt_txt + "\n\n[ generated output: ]\n" + generated_output + "\n\n";
            
            g_log.writeLog( logs_details_txt );
            
            callback( error_str, generated_output, logs_details_txt );
            
        } );
            
    } );
    
}


exports.getRelatedElementAndValues = function( input_txt, nli_class, mouse_pos_dom_id, element_details_arr, element_prompt_json, value_prompt_json, callback )
{
    var func_name = "my_llm.getRelatedElementAndValues";
    
    getRelatedElement( input_txt, nli_class, element_details_arr, element_prompt_json, function( element_error_str, prompt_txt, dom_id_in_question, elem_logs_details_txt )
    {
        var logs_details_txt = elem_logs_details_txt;
        
        if( element_error_str )
        {
            callback( element_error_str, "", [], logs_details_txt );
            return;
        }
        
        if( nli_class != "action_request" )
        {
            callback( "", dom_id_in_question, [], logs_details_txt );
            return;
        }
        
        var dom_id = ( dom_id_in_question && !dom_id_in_question.match( /^none$/i ) ) ? dom_id_in_question : mouse_pos_dom_id;
        
        if( !dom_id )
        {
            callback( "", dom_id_in_question, [], logs_details_txt );
            return;
        }
    
        var element_json = null;
        for( var i = 0; i < element_details_arr.length; i++ )
        {
            if( dom_id == element_details_arr[i]["dom_id"] )
            {
                element_json = element_details_arr[i];
                break;
            }
        }
        
        if( null == element_json )
        {
            // This shouldn't happen
            var msg = "There is no information available for the indicated element: " + dom_id_in_question;
            callback( "", msg, [], logs_details_txt ); 
            return;
        }
        
        if( !( "actions_arr" in element_json ) || !Array.isArray( element_json["actions_arr"] ) || ( element_json["actions_arr"].length < 1 ) )
        {
            var msg = "[ No actions listed for element ]";
            logs_details_txt += msg + "\n\n"
            callback(  "", dom_id_in_question, [], logs_details_txt ); 
            return;
        }
        
        var values_needed_arr = [];
        var num_values_needed = 0;
        for( var i = 0; i < element_json["actions_arr"].length; i++ )
        {
            values_needed_arr = element_json["actions_arr"][i]["values_needed_arr"];
            num_values_needed += values_needed_arr.length;
        }
        
        if( num_values_needed < 1 )
        {
            var msg = "[ No values needed ]";
            logs_details_txt += msg + "\n\n"
            callback(  "", dom_id_in_question, [], logs_details_txt ); 
            return;
        }
        

        // TO DO: Handle more than one value
        getValue( prompt_txt, value_prompt_json, function( value_error_str, value_txt, value_logs_details_txt )
        {
            logs_details_txt += value_logs_details_txt;
            
            callback( value_error_str, dom_id_in_question, [ value_txt ], logs_details_txt );
            
        } );
        
    } );
    
}


function getRelatedElement( input_txt, nli_class, element_details_arr, element_prompt_json, callback )
{
    var func_name = "my_llm.getRelatedElement";
    
    var prompt_txt = element_prompt_json["prompt_txt"];
    
    var elements_txt = "";
    var element_json = {};
    for( var i = 0; i < element_details_arr.length; i++ )
    {
        element_json = element_details_arr[i];
        
        elements_txt += "Element: " + element_json["dom_id"] + "\n" +
                        "Description: " + element_json["element_name"] + ". " + element_json["task_description"] + "\n\n";
    }
    
    elements_txt += "Element: none\n" +
                    "Description: Anything else";
    
    prompt_txt = prompt_txt.replace( /__ELEMENTS_PLACEHOLDER__/, elements_txt );
    prompt_txt = prompt_txt.replace( /__USER_INPUT_PLACEHOLDER__/, input_txt );

    getToken( function( token_error_str, token )
    {
        if( token_error_str )
        {
            callback( token_error_str, "", "", "" );
            return;
        }
        
        var model_id = element_prompt_json["model_id"];
        
        var parameters = element_prompt_json["parms_json"];
        
        generate( model_id, prompt_txt, parameters, token, function( error_str, generated_output )
        {
            var logs_details_txt = "\n\n---------- " + func_name + "\n[ prompt_txt: ]\n" + prompt_txt + "\n\n[ generated output: ]\n" + generated_output + "\n\n";
            
            g_log.writeLog( logs_details_txt );
            
            prompt_txt += generated_output;
            
            callback( error_str, prompt_txt, generated_output, logs_details_txt );
            
        } );
            
    } );
    
}



function getValue( prev_dialog_txt, value_prompt_json, callback )
{
    var func_name = "my_llm.getValue";

    var prompt_txt = prev_dialog_txt + "\n\n" + value_prompt_json["prompt_txt"];
    
    getToken( function( token_error_str, token )
    {
        if( token_error_str )
        {
            callback( token_error_str, "", "" );
            return;
        }
        
        var model_id = value_prompt_json["model_id"];
        
        var parameters = value_prompt_json["parms_json"];
        
        generate( model_id, prompt_txt, parameters, token, function( error_str, generated_output )
        {
            var logs_details_txt = "\n\n---------- " + func_name + "\n[ prompt_txt: ]\n" + prompt_txt + "\n\n[ generated output: ]\n" + generated_output + "\n\n";
            
            g_log.writeLog( logs_details_txt );
            
            callback( error_str, generated_output, logs_details_txt );
            
        } );
            
    } );
    
}


function getToken( callback )
{
    var func_name = "my_llm.getToken";
    
    // https://cloud.ibm.com/apidocs/iam-identity-token-api#authentication
    
    var url = g_cloud_IAM_url;
    
    var headers = { "Content-Type" : "application/x-www-form-urlencoded",
                    "Accept"       : "application/json" };
                    
    var data = g_querystring.stringify( { "grant_type" : "urn:ibm:params:oauth:grant-type:apikey", "apikey" : g_cloud_apikey } );

    //g_log.writeLog( func_name + "\n" +
    //                "url: " + url + "\n" +
    //                "headers:\n"  + JSON.stringify( headers, null, 3 ) + "\n" +
    //                "data:\n" + JSON.stringify( data, null, 3 ) );
    
    g_axios.post( url, data, { "headers" : headers } ).then( function( response )
    {
        //g_log.writeLog( func_name + " response:\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
        //g_log.writeLog( func_name + " response[\"status\"]: " + response["status"] );
        //g_log.writeLog( func_name + " response[\"statusText\"]: " + response["statusText"] );
        //g_log.writeLog( func_name + " response[\"headers\"]:\n" + JSON.stringify( response["headers"], null, 3 ) );
        //g_log.writeLog( func_name + " response[\"data\"]:\n" + JSON.stringify( response["data"], null, 3 ) );

        if( 200 != response["status"] )
        {
            var msg = "Getting a token returned an error.\n" +
                      "Status: '" + response["status"] + "'";
            g_log.writeLog( func_name + ": " + msg );
            callback( msg, "" );
            return;
        }

        if( !( "data" in response ) )
        {
            var msg = "An unexpected result was returned from the getting a token";
            g_log.writeLog( func_name + ": " + msg + "\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
            callback( msg, "" );
            return;
        }
        
        if( !( "access_token" in response["data"] ) || !response["data"]["access_token"] )
        {
            var msg = "No access_token was returned";
            g_log.writeLog( func_name + ": " + msg + "\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
            callback( msg, "" );
            return;
        }
        
        callback( "", response["data"]["access_token"] );

    } ).catch( function( error )
    {
        var msg = "Getting a token caught an error:\n" + error.message;
        g_log.writeLog( func_name + ": " + msg + "\n" + error.stack );
        callback( msg, "" );
        
    } );

}


function generate( model_id, prompt_txt, parameters, token, callback )
{
    var func_name = "my_wml.generate";
    
    var url = g_wml_url;
    
    var headers = { "Authorization": "Bearer " + token,
                    "Content-Type" : "application/json",
                    "Accept"       : "application/json" };
    
    //var model_parameters = { "decoding_method": "greedy",
    //                         "stop_sequences": [ "\n\n" ],
    //                         "max_new_tokens": 200,
    //                         "min_new_tokens": 0       
    //                       };
                           
    var data = { "input"      : prompt_txt,
                 "model_id"   : model_id,
                 "parameters" : parameters,
                 "project_id" : g_wx_project_id 
               };

    g_axios.post( url, data, { "headers" : headers } ).then( function( response )
    {
        //g_log.writeLog( func_name + " response:\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
        //g_log.writeLog( func_name + " response[\"status\"]: " + response["status"] );
        //g_log.writeLog( func_name + " response[\"statusText\"]: " + response["statusText"] );
        //g_log.writeLog( func_name + " response[\"headers\"]:\n" + JSON.stringify( response["headers"], null, 3 ) );
        //g_log.writeLog( func_name + " response[\"data\"]:\n" + JSON.stringify( response["data"], null, 3 ) );

        if( 200 != response["status"] )
        {
            var msg = "Generating text returned an error.\n" +
                      "Status: '" + response["status"] + "'";
            g_log.writeLog( func_name + ": " + msg );
            callback( msg, "" );
            return;
        }

        if( !( "data" in response ) )
        {
            var msg = "An unexpected result was returned from WML";
            g_log.writeLog( func_name + ": " + msg + "\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
            callback( msg, "" );
            return;
        }
        
        if( !( "results" in response["data"] ) || ( response["data"]["results"].length < 1 ) || !( "generated_text" in response["data"]["results"][0] ) )
        {
            var msg = "No result was returned from WML";
            g_log.writeLog( func_name + ": " + msg + "\n" + JSON.stringify( Object.keys( response ), null, 3 ) );
            callback( msg, "" );
            return;
        }
        
        var generated_text = response["data"]["results"][0]["generated_text"] ? response["data"]["results"][0]["generated_text"] : "";
        
        generated_text = generated_text.replace( /^\s+/, "" );
        generated_text = generated_text.replace( /\s+$/, "" );
        generated_text = generated_text.replace( /\s+\"\s+\"/g, " \"" );
        generated_text = generated_text.replace( /\"\s+\"\s+/g, " \" " );
        generated_text = generated_text.replace( /\s*(\d+)\./g, "\n$1." );
        generated_text = generated_text.replace( /\s+-\s+/g, "\n- " );
        generated_text = generated_text.replace( /\n+/g, "\n" );
        generated_text = generated_text.replace( /\n/g, "<br/>" );
        
        callback( "", generated_text );

    } ).catch( function( error )
    {
        var msg = "Calling WML caught an error:\n" + error.message;
        g_log.writeLog( func_name + ": " + msg + "\n" + error.stack );
        callback( msg, "" );
        
    } );

}



