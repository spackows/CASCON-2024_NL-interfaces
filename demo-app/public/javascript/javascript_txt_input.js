

function checkForReturn( e )
{
    if( "Enter" == e.key )
    {
        e.preventDefault();
        document.getElementById( "txt_input_btn" ).click();
        return;
    }
}


function submitTextInput()
{
    var txt = document.getElementById( "user_input_txt" ).value;
    
    if( !txt || !txt.match( /\S/ ) )
    {
        return;
    }
    
    document.getElementById( "output_txt" ).innerHTML = "";
    
    var ts = "[ " + getTS() + " ]";
    
    var log_txt = ts + "\n" +
                  "----------------------------------\n" +
                  "User text input:\n'" + 
                  txt + 
                  "'\n\n"; 
        
    //var logs_div = document.getElementById( "logs_txt" );
    //logs_div.innerHTML += log_txt;
    //logs_div.scrollTop = logs_div.scrollHeight;
    var highlights_txt = log_txt;
    var details_txt    = "";
    _saveLog( highlights_txt, details_txt );

    document.getElementById( "user_input_txt" ).value = "";
        
    llm( txt, ts );

}

