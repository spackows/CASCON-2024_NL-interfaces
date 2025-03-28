
function openFiltersMenu()
{
    document.getElementById( "filters_container_div" ).style.display = "block";
}

function closeFiltersMenu()
{
    document.getElementById( "filters_container_div" ).style.display = "none";
}

function setSampleSize( num )
{
    var num_txt = num.toString().replace( /[^\d]/g, "" );
    
    document.getElementById( "sample_size_input" ).value = num_txt;
}

function setEval( checked_str )
{
    var b_checked = ( checked_str && checked_str.match( /yes|true|1/i ) ) ? true : false;
    
    document.getElementById( "show_evaluated_cb" ).checked = b_checked;
}

function setUneval( checked_str )
{
    var b_checked = ( checked_str && checked_str.match( /yes|true|1/i ) ) ? true : false;
    
    document.getElementById( "show_unevaluated_cb" ).checked = b_checked;
}

function populateFilters()
{
    var first_date_str = document.getElementById( "first_date_parm"  ).value;
    var final_date_str = document.getElementById( "final_date_parm"  ).value;
    var sample_size    = document.getElementById( "sample_size_parm" ).value;
    var evaluated      = document.getElementById( "evaluated_parm"   ).value;

    if( first_date_str )
    {
        document.getElementById( "first_date_input" ).value = first_date_str;
    }

    if( final_date_str )
    {
        document.getElementById( "final_date_input" ).value = final_date_str;
    }
    
    if( sample_size.match( /^\d+$/ ) )
    {
        document.getElementById( "sample_size_input" ).value = sample_size;
    }
    
    document.getElementById( "show_evaluated_cb" ).checked = false;
    document.getElementById( "show_unevaluated_cb" ).checked = false;
    
    if( !evaluated || evaluated.match( /yes/i ) )
    {
        document.getElementById( "show_evaluated_cb" ).checked = true;
    }
    
    if( !evaluated || evaluated.match( /no/i ) )
    {
        document.getElementById( "show_unevaluated_cb" ).checked = true;
    }
    
}


function reloadPage()
{
    var first_date_str   = document.getElementById( "first_date_input"  ).value;
    var final_date_str   = document.getElementById( "final_date_input"  ).value;
    var sample_size      = document.getElementById( "sample_size_input" ).value;
    var b_evaluated_yes  = document.getElementById( "show_evaluated_cb" ).checked;
    var b_evaluated_no   = document.getElementById( "show_unevaluated_cb" ).checked;
    
    var parms_json = {};
    
    if( first_date_str.match( /\d{4}\-\d{2}\-\d{2}/ ) )
    {
        parms_json["first_date"] = first_date_str;
    }
    
    if( final_date_str.match( /\d{4}\-\d{2}\-\d{2}/ ) )
    {
        parms_json["final_date"] = final_date_str;
    }
    
    var sample_size_str = checkGetSampleSizeInput();
    if( sample_size_str.match( /\S/ ) )
    {
        var sample_size = parseInt( sample_size_str );
        
        if( sample_size < 0 )
        {
            return;
        }
        
        parms_json["sample_size"] = sample_size;
    }
    
    var b_evaluated_yes = document.getElementById( "show_evaluated_cb" ).checked;
    var b_evaluated_no  = document.getElementById( "show_unevaluated_cb"  ).checked;
    var evaluated = (  b_evaluated_yes && !b_evaluated_no ) ? "yes" :
                    ( !b_evaluated_yes &&  b_evaluated_no ) ? "no"  :
                    "";
    if( evaluated )
    {
        parms_json["evaluated"] = evaluated;
    }
    
    parms_json = addNLIParms( parms_json );
        
    var url = buildURL( parms_json );
    
    document.location.href = url;
    
}


function checkGetSampleSizeInput()
{
    var sample_size_str = document.getElementById( "sample_size_input" ).value.trim();
    
    if( sample_size_str.match( /[^\d]/ ) )
    {
        document.getElementById( "sample_size_input" ).style.borderColor = "red";
        return "-1";
    }
    
    document.getElementById( "sample_size_input" ).value = sample_size_str;
    document.getElementById( "sample_size_input" ).style.borderColor = "lightgrey";
    document.getElementById( "sample_size_input" ).style.borderTop = "1px solid grey";
    
    return sample_size_str;
}


function buildURL( parms_json )
{
    var project_id = document.getElementById( "project_id_parm" ).value;
    
    var url = "./?project_id=" + project_id;
    
    var parms_arr = Object.keys( parms_json );
    var parm_name = "";
    var parm_value = "";
    for( var i = 0; i < parms_arr.length; i++ )
    {
        parm_name = parms_arr[i];
        parm_value = parms_json[ parm_name ];
        url += "&" + parm_name + "=" + parm_value;
    }
    
    return url;
}


function checkEvalStatus( cb_obj )
{
    var yes_cb = document.getElementById( "show_evaluated_cb" );
    var no_cb  = document.getElementById( "show_unevaluated_cb"  );
    
    if( !yes_cb.checked && !no_cb.checked )
    {
        if( cb_obj.id.match( /yes/ ) )
        {
            no_cb.checked = true;
            return;
        }
        
        yes_cb.checked = true;
    }
}


function setFirstDateInput( date_str )
{
    date_str = date_str.replace( /[^\d\-]/g, "" );
    
    document.getElementById( "first_date_input" ).value = date_str;
}


function setFinalDateInput( date_str )
{
    date_str = date_str.replace( /[^\d\-]/g, "" );
    
    document.getElementById( "final_date_input" ).value = date_str;
}

