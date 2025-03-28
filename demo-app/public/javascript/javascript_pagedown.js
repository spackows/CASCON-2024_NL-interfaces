
function pageDown( e )
{
    if( "PageDown" == e.key )
    {
        e.preventDefault();
        scrollToNextMessage();
        return;
    }
    
    if( "PageUp" == e.key )
    {
        e.preventDefault();
        scrollToPrevMessage();
        return;
    }
}


function scrollToNextMessage()
{
    var main_div = document.getElementById( "eval_main_div" );
    
    var message_divs_arr = document.getElementsByClassName( "qa_div" );
    
    var message_div;
    
    for( var i = 0; i < message_divs_arr.length; i++ )
    {
        message_div = message_divs_arr[i];
        
        if( message_div.offsetTop <= ( main_div.scrollTop + 20 ) )
        {
            continue;
        }
        
        main_div.scrollTop = message_div.offsetTop - 20;
        
        break;
        
    }
}


function scrollToPrevMessage()
{
    var main_div = document.getElementById( "eval_main_div" );
    
    var message_divs_arr = document.getElementsByClassName( "qa_div" );
    
    var message_div;
    
    for( var i = ( message_divs_arr.length - 1 ); i >= 0; i-- )
    {
        message_div = message_divs_arr[i];
        
        if( message_div.offsetTop >= ( main_div.scrollTop + 20 ) )
        {
            continue;
        }
        
        main_div.scrollTop = message_div.offsetTop - 20;
        
        break;
        
    }
}






