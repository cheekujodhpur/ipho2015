$(document).ready(function(){

    //reload -f after 10m if to avoid ff stalling especially with firebug on
    setTimeout(function() { location.reload() },600000); 

    //set voting buttons to proper state onload
    if($('#l1v').val()!=0){
	$('.l1 button').attr('disabled','disabled');
	$('#l1-head .msg').text('Leader 1 voted!');
    }

    if($('#l2v').val()!=0){
	$('.l2 button').attr('disabled','disabled');
	$('#l2-head .msg').text('Leader 2 voted!')
    }


    //lib to play a sound on the client machine when a new vote is set 
  playSound=function(){
return $("<embed src='"+arguments[0]+".mp3' hidden='true' autostart='true' loop='false' class='playSound'>" + "<audio autoplay='autoplay' style='display:none;' controls='controls'><source src='"+arguments[0]+".mp3' /><source src='"+arguments[0]+".ogg' /></audio>").appendTo('body');
    }


    //get machine code and the question id values
    var mc=$('#mc').val();
    var qi=$('#vid').val();


    //castVote
    //cast vote when a button is pressed  
    $('#l1o1,#l1o2,#l1o3,#l1o4,#l2o1,#l2o2,#l2o3,#l2o4').click(function(){
	var ldr_no=(this.id).substr(0,2);
	var opt_no=(this.id).substr(2,2);
	var val=$(this).val();

	$('.'+ldr_no+' button').attr('disabled','disabled');
	$('#'+ldr_no+'-head .msg').text('Leader '+ldr_no[1]+' voted! ('+val+')');
	$.post( "cvote.php", { m: mc, l:ldr_no[1], v: val, i:qi } );
    });



      // Get canvas context 
    var ctx = $("#voteChart").get(0).getContext("2d");

    var data = [0,0,0,0];
    var o1=$('#o1').text();
    var o2=$('#o2').text();
    var o3=$('#o3').text();
    var o4=$('#o4').text();

    var data = {
	labels: [o1, o2, o3, o4],
	datasets: [
            {
		label: "Votes",
		fillColor: "rgba(10,110,200,0.5)",
		strokeColor: "rgba(220,220,220,1)",
		pointColor: "rgba(220,220,220,1)",
		pointStrokeColor: "#fff",
		pointHighlightFill: "#fff",
		pointHighlightStroke: "rgba(220,220,220,1)",
		data:data
            }
    ]
    };

    var barChart= new Chart(ctx).Bar(data,{ scaleFontSize: "16"});
   


//poll long...
    (function worker() {
	$.ajax({
            url: './getvotes.php?cv='+qi,
            success: function(data) {

		var vd=data.split(',');

		//update result numbers
		$('.resultOp1').html(vd[0]);
		$('.resultOp2').html(vd[1]);
		$('.resultOp3').html(vd[2]);
		$('.resultOp4').html(vd[3]);

		barChart.datasets[0].bars[0].value = vd[0];
		barChart.datasets[0].bars[1].value = vd[1];
		barChart.datasets[0].bars[2].value = vd[2];
		barChart.datasets[0].bars[3].value = vd[3];

		//bar color - custom 
//		barChart.datasets[0].bars[0].fillColor = "rgba(255,0,0,0.5)";

		//redraw the chart
		barChart.update();

		//when a new vote is set... 
		//...reload the page and play an alert sound
		if(qi!=vd[4]){
		    location.reload();
		    //alert 
		    $.playSound('Glass');
		}

            },
            complete: function() {
            // schedule the next request when the current one's complete
		setTimeout(worker, 1000);
            }
        });

    })();



});