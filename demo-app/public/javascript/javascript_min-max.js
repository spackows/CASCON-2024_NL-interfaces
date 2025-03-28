
function mixMax( btn_obj )
{
    var x = 1;
    
    if( btn_obj.style.rotate.match( /90/ ) )
    {
        btn_obj.style.rotate = "";
        btn_obj.title = btn_obj.title.replace( /Maximize/, "Minimize" );
        var div_id = btn_obj.id.replace( /_chevron_button/, "_div" );
        document.getElementById( div_id ).style.display = "block";
        return;
    }
    
    btn_obj.style.rotate = "-90deg";
    btn_obj.title = btn_obj.title.replace( /Minimize/, "Maximize" );
    var div_id = btn_obj.id.replace( /_chevron_button/, "_div" );
    document.getElementById( div_id ).style.display = "none";
    
}



