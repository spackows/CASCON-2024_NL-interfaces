
const g_ibmdb = require( "ibm_db" ); // https://www.npmjs.com/package/ibm_db2
const g_fs    = require( "fs"     );

const g_log    = require( "./my_log.js"            );
const g_ts     = require( "./my_timestamps.js"     );


const g_connStr = "DRIVER={DB2};" +
                  "HOSTNAME=" + process.env.DB2HOSTNAME + ";" +
                  "PORT="     + process.env.DB2PORT     + ";" +
                  "DATABASE=" + process.env.DB2DATABASE + ";" +
                  "UID="      + process.env.DB2UID      + ";" +
                  "PWD="      + process.env.DB2PWD      + ";" +
                  "SSLCONNECTION=TRUE;" +
                  "SECURITY=SSL";
                
const g_schema = process.env.DB2SCHEMA;

//g_log.writeLog( g_connStr );

var g_pool;


var exports = module.exports = {};


exports.createConnPool = function()
{
    var Pool = g_ibmdb.Pool;
    g_pool = new Pool();
    g_pool.open( g_connStr, function( err, db )
    {
        if( err )
        {
            g_log.writeLog( 'Creating Db2 connection pool failed:' );
            g_log.writeLog( err );
        }
        else
        {
            g_log.writeLog( 'Db2 connection pool successfully created' );
            db.close();
        }

    } );

}


exports.removeSingleQuotes = function( txt )
{
    return removeSingleQuotes( txt );
}


function removeSingleQuotes( txt )
{
    txt = txt.replace( /\'/g, "_QUOTE_" );
    txt = txt.replace( /\r/g, "_CARRIAGERETURN_" );
    txt = txt.replace( /\n/g, "_NEWLINE_" );
    
    return txt;
}


exports.addSingleQuotes = function( txt )
{
    return addSingleQuotes( txt );
}

function addSingleQuotes( txt )
{
    txt = txt.replace( /_QUOTE_/g, "'" );
    txt = txt.replace( /_CARRIAGERETURN_/g, "\n" );
    txt = txt.replace( /_NEWLINE_/g, "\n" );
    
    return txt;
}



exports.runSQL = function( sql, callback )
{
    runSQL( sql, function( error_str, sql_result_arr )
    {
        callback( error_str, sql_result_arr );
        
    } );
    
}


function runSQL( sql, callback )
{
    if( !sql )
    {
        callback( "my_db2.runSQL sql: " + sql, [] );
        return;
    }
    
    g_pool.open( g_connStr, function( error_open, connection )
    {
        if ( error_open )
        {
            callback( "my_db2.runSQL ibmdb.open error: " + error_open.message, [] );
            return;
        }
        
        var parms = [];
        connection.query( sql, parms, function( error_query, results )
        {
            connection.close();
            
            if( error_query )
            {
                callback( "my_db2.runSQL query error: " + error_query.message, [] );
                return;
            }

            callback( "", results );

        } );

    } );

}









exports.loadData = function( first_date_filter, 
                             final_date_filter, 
                             sample_size_filter, 
                             evaluated_filter, 
                             callback )
{
    var func_name = "my_db2.loadQuestionsAnswers";
    
    var qa_content = g_fs.readFileSync( "./sample-data/sample_qa_arr.json" );
    var qa_arr_org = JSON.parse( qa_content );
    
    var eval_content = g_fs.readFileSync( "./sample-data/sample_evaluations.json" );
    var eval_json = JSON.parse( eval_content );
    
    var qa_arr = [];
    for( var i = 0; i < qa_arr_org.length; i++ )
    {
        qa_id = qa_arr_org[i]["QA_ID"];
        date_str = qa_arr_org[i]["TS_FORMATTED"].substr( 0, 10 );
        
        if( ( first_date_filter.match( /\d{4}\-\d{2}\-\d{2}/ ) && ( date_str < first_date_filter ) ) || 
            ( final_date_filter.match( /\d{4}\-\d{2}\-\d{2}/ ) && ( final_date_filter < date_str ) ) )
        {
            g_log.writeLog( "Skipped due to dates: " + qa_id );
            g_log.writeLog( "date_str: " + date_str );
            g_log.writeLog( "first_date_filter: " + first_date_filter );
            g_log.writeLog( "final_date_filter: " + final_date_filter + "\n" );
            continue;
        }
        
        b_evaluated = isEvaluated( eval_json, qa_id );
        
        if( evaluated_filter.match( /\S/ ) &&
            ( ( b_evaluated && !evaluated_filter.match( /yes/i ) ) ||
              ( !b_evaluated && !evaluated_filter.match( /no/i ) ) ) )
        {
            g_log.writeLog( "Skipped due to eval status: " + qa_id );
            g_log.writeLog( "evaluated_filter: " + evaluated_filter );
            g_log.writeLog( "b_evaluated: " + b_evaluated + "\n" );
            continue;
        }
        
        qa_arr.push( qa_arr_org[i] );
        
    }
    
    if( sample_size_filter.toString().match( /\d/ ) )
    {
        qa_arr = getSubsample( qa_arr, sample_size_filter );
    }
    
    callback( "", qa_arr, eval_json );
    
}
    

function isEvaluated( eval_json, qa_id )
{
    if( !( qa_id in eval_json ) )
    {
        return false;
    }
    
    if( !eval_json[ qa_id ] || !Array.isArray( eval_json[ qa_id ] ) || ( eval_json[ qa_id ].length < 1 ) )
    {
        return false;
    }
    
    return true;
    
}


function getSubsample( qa_arr, sample_size_filter )
{
    qa_arr.sort( function( a, b )
    {
        return 0.5 - Math.random();
        
    } );
    
    var n = parseInt( sample_size_filter );
    
    qa_arr = qa_arr.slice( 0, n );
    
    qa_arr.sort( function( a, b )
    {
        if( a["TS"] < b["TS"] )
        {
            return -1;
        }
        
        if( a["TS"] > b["TS"] )
        {
            return 1;
        }
        
        return 0;
        
    } );

    return qa_arr;
    
}

