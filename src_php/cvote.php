<?php
//cast vote
session_start();
include ("./mandb/connect.php");

if(!isset($_SESSION['voterid']))  {    session_destroy();    exit;  }

$rc=htmlspecialchars(trim($_SESSION['cc_code']));


$con=htmlspecialchars(trim($_POST['m']), ENT_QUOTES);
$leader=htmlspecialchars(trim($_POST['l']), ENT_QUOTES);
$option=htmlspecialchars(trim($_POST['v']), ENT_QUOTES);
$vid=htmlspecialchars(trim($_POST['i']), ENT_QUOTES);

if($con!='' && $leader!='' && $option!='' && $vid!=''){

  if($option=='1'){      $c='c1';  }
  if($option=='2'){      $c='c2';  }
  if($option=='3'){      $c='c3';  }
  if($option=='4'){      $c='c4';  }

  if(preg_match('/^[1-4]{1}$/',$option)===0){      exit;    }
  if(preg_match('/^[1-2]{1}$/',$leader)===0){      exit;    }

  //update leader table
  $field=$con.'L'.$leader;

  
  //cast vote only if not voted yet
  $queryc= sprintf("select `%s` from `leaders` where `vid` = '%s'", $field, $vid);
  $resultc  = mysql_query($queryc) or die('Error, queryc failed'.mysql_error());
  while($row = mysql_fetch_array($resultc)){
    $fset=$row['0'];
  }



  if($fset==='0'){
  $queryu= sprintf("update vote set `%s` = `%s` + 1 where `vid` = '%s'", $c, $c, $vid);
  $resultu  = mysql_query($queryu) or die('Error, queryu failed'.mysql_error());
  
  $queryl= sprintf("update leaders set `%s` = '%s' where `vid` = '%s'", $field, $option, $vid);
  $resultl  = mysql_query($queryl) or die('Error, queryl failed'.mysql_error());
  }


  

}


?>
