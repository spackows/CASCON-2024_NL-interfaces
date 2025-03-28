
const g_ts = require( './my_timestamps.js' );
const g_fs = require( "fs" );

var g_stream = g_fs.createWriteStream( "log/log.txt", { flags : "a+" } );

var exports = module.exports = {};
                

exports.readLog = function( callback )
{
    g_fs.readFile( "log/log.txt", 'utf8', function( read_err, contents )
    {
        if( read_err )
        {
            return callback( "[Error]\n" + read_err.stack );
        }
        
        callback( contents );
        
    } );
    
}


exports.writeLog = function( content )
{
    try
    {
        console.log( content );
        g_stream.write( g_ts.myGetLongDateStrUTC( Date.now() ) + "\n" + content + "\n\n" );
    }
    catch( e )
    {
        console.log( "[my_log] writeLog failed.\n" + e.stack );
    }
}


exports.clearLog = function( callback )
{
    console.log( "my_log.clearLog..." );
    
    g_stream.end( function( end_error_str )
    {
        if( end_error_str )
        {
            console.log( "my_log.clearLog end failed: " + end_error_str );
            return callback( "my_log.clearLog end failed: " + end_error_str );
        }
        
        console.log( "my_log.clearLog end completed" );
        
        g_fs.unlink( "log/log.txt", function( unlink_error_str )
        {
            if( unlink_error_str )
            {
                console.log( "my_log.clearLog unlink failed: " + unlink_error_str );
                return callback( "my_log.clearLog unlink failed: " + unlink_error_str );
            }
            
            console.log( "my_log.clearLog unlink completed" );
            
            g_stream = g_fs.createWriteStream( "log/log.txt", { flags: "a+" } );
            
            console.log( "my_log.clearLog createWriteStream completed" );
            
            callback( null );
            
        } );
        
        
    } );
}


