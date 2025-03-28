

function loadData()
{
    var first_date_str = document.getElementById( "first_date_parm"  ).value;
    var final_date_str = document.getElementById( "final_date_parm"  ).value;
    var sample_size    = document.getElementById( "sample_size_parm" ).value;
    var evaluated      = document.getElementById( "evaluated_parm"   ).value;
    
    var parms_json = { "first_date"  : first_date_str,
                       "final_date"  : final_date_str,
                       "sample_size" : sample_size,
                       "evaluated"   : evaluated };
    
    $.ajax( { url         : "./data",
              type        : "POST",
              data        : JSON.stringify( parms_json ),
              dataType    : "json",
              contentType : "application/json",
              complete : function( result )
                         {
                             var status_code = ( "status"     in result ) ? result["status"]     : "";
                             var status_text = ( "statusText" in result ) ? result["statusText"] : "";
                             
                             if( !( "responseJSON" in result ) || !result["responseJSON"] )
                             {
                                 var msg = "Loading data failed.\n\n" +
                                           "No 'responseJSON' field returned.";
                                 msg += ( status_code == "" ) ? "" : "\n\nStatus code: " + status_code;
                                 msg += ( status_text == "" ) ? "" : "\n\nStatus text: " + status_text;
                                 alert( msg );
                                 return;
                             }
                             
                             var error_str = ( "error_str" in result["responseJSON"] ) ? result["responseJSON"]["error_str"] : "";
                             if( error_str )
                             {
                                 var msg = "Loading data failed.\n\n" +
                                           "error_str: " + error_str;
                                 alert( msg );
                                 return;
                             }
                             
                             var qa_arr = ( "qa_arr" in result["responseJSON"] ) ? result["responseJSON"]["qa_arr"] : null;
                             if( !qa_arr )
                             {
                                 var msg = "Loading data failed.\n\n" +
                                           "No 'qa_arr' field returned.";
                                 alert( msg );
                                 return;
                             }
                             
                             var eval_json = ( "eval_json" in result["responseJSON"] ) ? result["responseJSON"]["eval_json"] : null;
                             if( !eval_json )
                             {
                                 var msg = "Loading data failed.\n\n" +
                                           "No 'eval_json' field returned.";
                                 alert( msg );
                                 return;
                             }
                             
                            populateQA( qa_arr );
                            
                            adjustWidths();
                            
                            checkEvaluations( eval_json );
                                                                                       
                         }
                         
            } );

}


function populateQA( qa_arr )
{
    var sql_row  = {};
    var qa_id    = "";
    var answer   = "";
    var qa_card;
    
    for( var i = 0; i < qa_arr.length; i++ )
    {
        sql_row = qa_arr[i];
        
        if( !( "QA_ID"        in sql_row ) ||
            !( "TS_FORMATTED" in sql_row ) ||
            !( "QUESTION"     in sql_row ) ||
            !( "ANSWER"       in sql_row ) ||
            !( "ARTICLES_ARR" in sql_row ) ||
            !( "CUSTOM_JSON"  in sql_row ) )
        {
            console.log( "Invalid sql_row: " + i + "\n" + JSON.stringify( sql_row, null, 3 ) );
            continue;
        }
        
        qa_id  = sql_row["QA_ID"];
        answer = sql_row["ANSWER"] ? sql_row["ANSWER"] : "No answer was returned";
        
        qa_card = document.createElement( "table" );
        qa_card.className = "qa_div card";
        qa_card.id = "qa_id_" + qa_id
        qa_card.style.width = "95%";
        qa_card.innerHTML = "<tr>" +
                            "<td class='question_td' valign='top'>" + questionDiv( sql_row )  + "</td>" +
                            "<td class='answer_td'   valign='top'>" + answerDiv( sql_row )    + "</td>" +
                            "<td class='eval_td'     valign='top'>" + evalsTableHTML( qa_id ) + "</td>" +
                            "</tr>";
        
        document.getElementById( "eval_main_div" ).appendChild( qa_card );
        
    }
    
    document.getElementById( "totals_div" ).innerHTML = "Total: " + qa_arr.length;
}


function questionDiv( sql_row )
{
    var qa_id = sql_row["QA_ID"];
    
    var html = "<div class='ts_div'>" +
               "[ " + sql_row["TS_FORMATTED"] + " ] " +
               "<div class='qa_id_div'>" + qa_id + "</div>" +
               "</div>" + 
               "<div>" + sql_row["QUESTION"] + "</div>" +
               customJSONDiv( sql_row );
    
    return html;
}


function customJSONDiv( sql_row )
{
    var html = "<div class='custom_json_container_div'>" +
               "<p>Custom data:</p>" +
               "<ul>";
    
    var custom_json = sql_row["CUSTOM_JSON"];
    
    var custom_fields_arr = Object.keys( custom_json );
    
    var field = "";
    var value = "";
    for( var i = 0; i < custom_fields_arr.length; i++ )
    {
        field = custom_fields_arr[i];
        value = custom_json[ field ];
        
        html += "<li>" + field + ": " + value + "</li>";
    }
    
    html += "</ul></div>";
    
    return html;
}


function answerDiv( sql_row )
{
    var answer_txt = sql_row["ANSWER"] ? sql_row["ANSWER"] : "No answer was returned";
    var answer_html = "<p>" + answer_txt + "</p>";
        
    var links_arr = sql_row["ARTICLES_ARR"];
    
    var links_html = "<ul class='links_ul'>";
    for( var i = 0; i < links_arr.length; i++ )
    {
        links_html += "<li>" + links_arr[i]["title"] + "</li>";
    }
    links_html += "</ul>";
    
    return answer_html + links_html;
}


function evalsTableHTML( qa_id )
{
    var html = "<table class='evals_tbl'>" +
               "<tr>" +
               "<td style='padding-left: 10px;'>Valid&nbsp;question<span class='description_help' title='Is this a question we should be able to answer?'>?</span></td>" +
               "<td><input type='radio' id='valid_question_yes_"     + qa_id + "' disabled />Yes</td>" +
               "<td><input type='radio' id='valid_question_no_"      + qa_id + "' disabled />No</td>" +
               "<td><input type='radio' id='valid_question_unknown_" + qa_id + "' disabled />?</td>" +
               "<td>&nbsp;</td>" +
               "</tr>" +
               "<tr>" +
               "<td style='padding-left: 10px;'>Correct&nbsp;class<span class='description_help' title='Is the question classification correct?'>?</span></td>" +
               "<td><input type='radio' id='correct_class_yes_"     + qa_id + "' disabled />Yes</td>" +
               "<td><input type='radio' id='correct_class_no_"      + qa_id + "' disabled />No</td>" +
               "<td><input type='radio' id='correct_class_unknown_" + qa_id + "' disabled />?</td>" +
               "<td>&nbsp;</td>" +
               "</tr>" +
               "<tr>" +
               "<td style='padding-left: 10px;'>Article&nbsp;exists<span class='description_help' title='Is there a relevant article in the knowledge base?'>?</span></td>" +
               "<td><input type='radio' id='article_exists_yes_"     + qa_id + "' disabled />Yes</td>" +
               "<td><input type='radio' id='article_exists_no_"      + qa_id + "' disabled />No</td>" +
               "<td><input type='radio' id='article_exists_unknown_" + qa_id + "' disabled />?</td>" +
               "<td>&nbsp;</td>" +
               "</tr>" +
               "<tr>" +
               "<td style='padding-left: 10px;'>Search&nbsp;success<span class='description_help' title='Did search find the relevant article or articles?'>?</span></td>" +
               "<td><input type='radio' id='search_success_top_"     + qa_id + "' disabled />Top</td>" +
               "<td><input type='radio' id='search_success_top3_"    + qa_id + "' disabled />Top&nbsp;3</td>" +
               "<td><input type='radio' id='search_success_fail_"    + qa_id + "' disabled />Fail</td>" +
               "<td><input type='radio' id='search_success_unknown_" + qa_id + "' disabled />?</td>" +
               "</tr>" +
               "<tr>" +
               "<td style='padding-left: 10px;'>Good&nbsp;answer<span class='description_help' title='Was the answer helpful?'>?</span></td>" +
               "<td><input type='radio' id='good_answer_correct_" + qa_id + "' disabled />Yes</td>" +
               "<td><input type='radio' id='good_answer_partly_"  + qa_id + "' disabled />Partly</td>" +
               "<td><input type='radio' id='good_answer_wrong_"   + qa_id + "' disabled />No</td>" +
               "<td><input type='radio' id='good_answer_unknown_" + qa_id + "' disabled />?</td>" +
               "</tr>" +
               "</table>";
    
    return html;
    
}


function adjustWidths()
{
    var main_eval_div = document.getElementById( "eval_main_div" );
    var cards_arr = main_eval_div.children;
    if( cards_arr.length < 1 )
    {
        return;
    }
    
    var first_card = cards_arr[0];
    var total_width = first_card.offsetWidth;
    var available_width = total_width - 350;
    var col_width = Math.floor( available_width / 2 );
    
    var questions_arr = document.getElementsByClassName( "question_td" );
    for( var i = 0; i < questions_arr.length; i++ )
    {
        questions_arr[i].style.width = col_width + "px";
    }
    
    var evals_arr = document.getElementsByClassName( "eval_td" );
    for( var i = 0; i < evals_arr.length; i++ )
    {
        evals_arr[i].style.width = "330px";
    }
}
    

function checkEvaluations( eval_json )
{
    var qa_ids_arr = Object.keys( eval_json );
    
    var qa_id    = "";
    var eval_arr = [];
    var category = "";
    var value    = "";
    var radio_id = "";
    
    for( var i = 0; i < qa_ids_arr.length; i++ )
    {
        qa_id = qa_ids_arr[i];
        
        eval_arr = eval_json[ qa_id ];
        
        for( var j = 0; j < eval_arr.length; j++ )
        {
            category = eval_arr[j]["CATEGORY"];
            value    = eval_arr[j]["VALUE"];
            radio_id = category + "_" + value + "_" + qa_id;
            
            if( document.getElementById( radio_id ) )
            {
                document.getElementById( radio_id ).checked = true;
            }
        }
    }
    
}
