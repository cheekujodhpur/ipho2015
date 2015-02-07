<script src="./Chart.js-master/Chart.js"></script>
<?

//setting dummy sessionid to be replaced in case we need authentiation. 
$_SESSION['voterid']='abcd'; 

if(!isset($_SESSION['voterid']))  {    session_destroy();    exit;  }

$ip=$_SERVER['REMOTE_ADDR'];

//get computer ip and code
$query   = sprintf("SELECT `code`, `con`  from mip where ip='%s'", $ip);
$result  = mysql_query($query) or die('Error, query failed'.mysql_error());
while ($row = mysql_fetch_array($result)){  $mc=$row['code'];  $cn=$row['con']; }

if($mc==""){
  echo "Can't identify this node!";
  exit;
}

//get vote details
$query   = sprintf("SELECT `vid`, `question`,`desc`,`option1`,`option2`,`option3`,`option4` FROM `vote` ORDER BY vid DESC LIMIT 1");
$result  = mysql_query($query) or die('Error, query failed'.mysql_error());
while ($row = mysql_fetch_array($result)){
  $vid=$row['vid'];  $q=$row['question'];  $desc= $row['desc']; $o1=$row['option1'];  $o2=$row['option2'];  $o3=$row['option3'];  $o4=$row['option4'];
}


//check whether already voted - to avoid vote again on page refresh
$queryL   = sprintf("SELECT `%sL1`, `%sL2` FROM `leaders` where `vid` = '%s'",$mc, $mc, $vid);
$resultL  = mysql_query($queryL) or die('Error, query failed'.mysql_error());
while ($rowL = mysql_fetch_array($resultL)){
  if($rowL['0']!=0){    $L1voted=1;      }else {$L1voted=0;}
  if($rowL['1']!=0){    $L2voted=1;      }else {$L2voted=0;}

}



?>

<style>
  .vul li{margin:20px; list-style-type: none;}
.vol li{ margin:10px; font-size:1.2em;}
.big{  font-size:2em;    padding-left:10px;   }  
.ldrs{  border:solid 2px black;   background-color:#eee;  padding:10px;  }
.btn-group >.btn{margin:0 20px;  border-radius:50px; }
p{font-size: 1.2em;}
}
</style>


<div id="container-fluid bs3">
<div class="row row-centered">
    <div class="col-lg-10 col-centered">
  <h1><? echo $cn; ?></h1>
  <hr/>

 <div class="row-fluid">
 <div class="span12">
<h3> </h3>
    <div class="row-fluid">
    <div class="span6">
<h3>  <? echo $q; ?> </h3>
<? 
if($desc!=''){
  echo'<p>'.$desc.'</p>';
}else{
  echo '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Integer pulvinar id ligula sed lacinia. Donec ac turpis ullamcorper, euismod lectus id, porttitor justo. 
Fusce a urna sed velit suscipit semper. </p>';
}
?>

<?
echo'
<ol class="vol">
  <li id="o1" val="'.$o1.'">'.$o1.'</li>
  <li id="o2" val="'.$o2.'">'.$o2.'</li>';

    if($o3!=''){
      echo ' <li id="o3" val="'.$o3.'">'.$o3.'</li>';
    }
    if($o4!=''){
      echo '  <li id="o4" val="'.$o4.'">'.$o4.'</li>';
    }

echo '</ol>';

?>  

  </div>

    <div class="span6 panel panel-warning center">
<h4>Votes</h4>
  <canvas id="voteChart" width="500" height="500"></canvas> 
<div class="result">
<ul class="vul">
<li> Option 1: <span class="resultOp1 text-danger big"></span></li>
  <li> Option 2: <span class="resultOp2 text-danger big"></span></li>
<?
    // display these only if those are set
    if($o3!=''){
      echo ' <li> Option 3: <span class="resultOp3 text-danger big"></span></li>';
    }
    if($o4!=''){
      echo '  <li> Option 4: <span class="resultOp4 text-danger big"></span></li>';
    }
?>

</ul>
</div>

</div>
    </div>
    </div>
    </div>



 <div class="row-fluid">
 <div class="span12 center">
<h3> </h3>
    <div class="row-fluid">
    <div class="span6 ldrs">


<div id="l1-head"><h4 class="">Leader 1</h4><div class="msg alert-success"></div></div><br/>
<div class="btn-group btn-group-lg l1" id="btn-group-l1">
  <button type="button" class="btn btn-primary l1btn" id="l1o1" value="1">1</button>
  <button type="button" class="btn btn-primary l1btn" id="l1o2" value="2">2</button>

<?
    if($o3!=''){
      echo '  <button type="button" class="btn btn-primary l1btn" id="l1o3" value="3">3</button>';
    }
    if($o4!=''){
      echo' <button type="button" class="btn btn-primary l1btn" id="l1o4" value="4">4</button>';
    }
?>
</div>
    </div>

    <div class="span6 ldrs">
<div id="l2-head"><h4>Leader 2</h4><div class="msg alert-success"></div></div><br/>
<div class="btn-group btn-group-lg l2" id="btn-group-l2">
  <button type="button" class="btn btn-primary l2btn" id="l2o1" value="1">1</button>
  <button type="button" class="btn btn-primary l2btn" id="l2o2" value="2">2</button>
<?
    if($o3!=''){
      echo '  <button type="button" class="btn btn-primary l2btn" id="l2o3" value="3">3</button>';
    }
    if($o4!=''){
      echo '<button type="button" class="btn btn-primary l2btn" id="l2o4" value="4">4</button>';
    }
?>
</div>
</div>

    </div>
    </div>
    </div>


<br/>
</div>
</div>

<form>
<input type="hidden" id="mc" name="mc" value="<? echo $mc; ?>">
<input type="hidden" id="vid" name="vid" value="<? echo $vid; ?>">
<input type="hidden" id="l1v" name="l1v" value="<? echo $L1voted; ?>">
<input type="hidden" id="l2v" name="l2v" value="<? echo $L2voted; ?>">
</form>

</div>

<script src="./js/vscript.js"></script>
