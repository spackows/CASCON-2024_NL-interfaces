

function cleanText( msg_txt_in )
{
    var msg_txt = msg_txt_in;
    msg_txt = ascii( msg_txt_in );
    msg_txt = msg_txt.replace( /[^a-z0-9\-\_ ]/i, "" );
    msg_txt = msg_txt.replace( /\s+/g, " " );
    msg_txt = msg_txt.replace( /^\s+/, "" );
    msg_txt = msg_txt.replace( /\s+$/, "" );
    
    return msg_txt;
}


function ascii( txt_in )
{
    var cleaned_txt = '';
    for( var i = 0; i < txt_in.length; i++ )
    {
        if( txt_in.charCodeAt(i) <= 127 )
        {
            cleaned_txt += txt_in.charAt( i );
        }
    }
    
    return cleaned_txt;
}


function getUserInput()
{
    var inputs_arr = document.getElementsByClassName( "user_input_txt" );
    
    var user_input_arr = [];
    
    var input_obj;
    var value = "";
    for( var i = 0; i < inputs_arr.length; i++ )
    {
        input_obj = inputs_arr[i];
        value = input_obj.value;
        value = ascii( value );
        value = value.replace( /^\s+/, "" ).replace( /\s+$/, "" );
        if( !value )
        {
            input_obj.style.borderColor = "red";
            return null;
        }
        else
        {
            user_input_arr.push( value );
            input_obj.style.borderColor = "lightgrey";
            input_obj.style.borderTop = "1px solid grey";
        }
    }
    
    return user_input_arr;
}


function getTS()
{
    var d = new Date();
    
    var year    = d.getUTCFullYear();
    var month   = myPadZero( d.getUTCMonth() + 1 );
    var day     = myPadZero( d.getUTCDate() );
    var hours   = myPadZero( d.getUTCHours() );
    var minutes = myPadZero( d.getUTCMinutes() );
    var seconds = myPadZero( d.getUTCSeconds() );

    var date_str = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' (UTC)';

    return date_str;    
}


function myPadZero( input )
{
	if( input < 10 )
	{
		return "0" + input;
	}
	
	return input;
}

