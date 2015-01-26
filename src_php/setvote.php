<?
include "top.php";

if(isset($_POST['bsubmit']) && $_SERVER['REQUEST_METHOD']=='POST') {

  $error = '';

  $q =htmlspecialchars(trim($_POST['q']), ENT_QUOTES);
  $desc =htmlspecialchars(trim($_POST['desc']), ENT_QUOTES);
  $o1 =htmlspecialchars(trim($_POST['o1']), ENT_QUOTES);
  $o2 =htmlspecialchars(trim($_POST['o2']), ENT_QUOTES);
  $o3 =htmlspecialchars(trim($_POST['o3']), ENT_QUOTES);
  $o4 =htmlspecialchars(trim($_POST['o4']), ENT_QUOTES);

  //get current vid so that it can be added to leaders
  $queryu= sprintf("select `vid` from vote order by vid desc limit 1");
  $resultu  = mysql_query($queryu) or die('Error, queryu failed'.mysql_error());
  $vid=mysql_fetch_array($resultu);



  if($error==''){
    $query1= sprintf("insert INTO `vote` (`question`, `desc`, `option1`,`option2`, `option3`, `option4`)
values('%s','%s','%s','%s', '%s', '%s')",
		     mysql_real_escape_string($q),
		     mysql_real_escape_string($desc),
		     mysql_real_escape_string($o1),
		     mysql_real_escape_string($o2),
		     mysql_real_escape_string($o3),
		     mysql_real_escape_string($o4)
		     );
      // echo $query1;
      $result1  = mysql_query($query1) or die('Error, query1 failed'.mysql_error());

      //insert new row in leaders 
      $query1= sprintf("insert INTO `leaders` (`vid`) values ('%s')", $vid['0']+1);
      $result1  = mysql_query($query1) or die('Error, query1 failed'.mysql_error());

      echo '<strong> Vote set!</strong> ';
  }


}

?>
<div class="container bs3">

<div class="row row-centered">
    <div class="col-lg-12 col-centered">


<form name="form1" id="form1" action="./setvote.php" method="POST" role="form" class="form-horizontal">

   <fieldset>
   <legend>Set Vote</legend>

   <div class="form-group required">
   <label for="q" class="col-lg-4 control-label ">Question</label>
   <textarea id="q" name="q" class="form-control" rows="5"></textarea>
    </div>

   <div class="form-group required">
   <label for="desc" class="col-lg-4 control-label ">Description</label>
   <textarea id="desc" name="desc" class="form-control" rows="5"></textarea>
    </div>

   <div class="form-group required">
   <label for="o1" class="col-lg-4 control-label ">Option1</label>
   <div class="col-lg-3"> <input type="textbox" name="o1" id="o1" class="form-control col-xs-6 col-sm-6 col-md-6" value="" required="required" title="option1">
    </div>
    </div>

   <div class="form-group required">
   <label for="o2" class="col-lg-4 control-label ">Option1</label>
   <div class="col-lg-3"> <input type="textbox" name="o2" id="o2" class="form-control col-xs-6 col-sm-6 col-md-6" value="" required="required" title="option1">
    </div>
    </div>

   <div class="form-group">
   <label for="o3" class="col-lg-4 control-label ">Option1</label>
   <div class="col-lg-3"> <input type="textbox" name="o3" id="o3" class="form-control col-xs-6 col-sm-6 col-md-6" value=""  title="option1">
    </div>
    </div>

   <div class="form-group">
   <label for="o4" class="col-lg-4 control-label ">Option1</label>
   <div class="col-lg-3"> <input type="textbox" name="o4" id="o4" class="form-control col-xs-6 col-sm-6 col-md-6" value=""  title="option1">
    </div>
    </div>

<button type="submit" id="bsubmit" name="bsubmit" value="Submit" class="btn btn-info col-lg-1 col-lg-offset-4 ">Submit</button>
<a href=""><div class="btn btn-default col-xs-offset-1 ">Cancel</div></a>
</fieldset>
</form>
<br/>
<br/>
</div>
</div>
</div>

<?
include 'footer.php';
?>