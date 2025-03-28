
var g_mouse_x = 0;
var g_mouse_y = 0;

var g_tracking_resize = false;
var g_mouse_start = 0;
var g_resizer_start = 370;


function closeMenu( e )
{
    var mouse_x = e.clientX;
    
    var filter_menu_right = document.getElementById( "filters_container_div" ).offsetWidth;
    
    if( ( "block" == document.getElementById( "filters_container_div" ).style.display ) &&
        ( mouse_x > filter_menu_right ) )
    {
        closeFiltersMenu();
    }
    
}


function mouseMove( e )
{
    if( g_tracking_resize )
    {
        resizeRightHandSide( e.pageX - g_mouse_start );
    }

}


function resizeRightHandSide( x_diff )
{
    var new_position = g_resizer_start - x_diff;
    
    document.getElementById( "resizer_div" ).style.right = new_position + "px";
    
    document.getElementById( "right_hand_div" ).style.width = new_position - 20 + "px";
    
    document.getElementById( "left_hand_div" ).style.right = new_position + "px";
}


function startTrackingMouseForResize( e )
{
    g_mouse_start = e.pageX;
    
    g_resizer_start = parseInt( document.getElementById( "resizer_div" ).style.right );
    
    document.onselectstart = disableSelect;
    
    g_tracking_resize = true;
}


function stopTrackingMouseForResize()
{
    document.onselectstart = enableSelect;

    g_tracking_resize = false;
}


function disableSelect()
{
    return false;
}


function enableSelect()
{
    return true;
}

