<?php
session_start();
include ("./mandb/connect.php");

//returns votes + current question no.

$cv=$_GET['cv'];

if($cv!=''){
  $queryu= sprintf("select `c1`,`c2`,`c3`,`c4` from vote where vid = '%s'", $cv);
  $resultu  = mysql_query($queryu) or die('Error, queryu failed'.mysql_error());
  while($row=mysql_fetch_array($resultu)){
    $str=$row['0'].','.$row['1'].','.$row['2'].','.$row['3'];
  }
  //get current question number
 $queryu= sprintf("select `vid` from vote order by vid desc limit 1");
  $resultu  = mysql_query($queryu) or die('Error, queryu failed'.mysql_error());
  $row=mysql_fetch_array($resultu);

  /* json encode data
  while($obj = mysql_fetch_object($resultu)) {
      $var[] = $obj;
      }
  echo '{"votes":'.json_encode($var).'}';
  */
  //echo  mysql_fetch_array($resultu);

  echo $str.','.$row['0'];
}


?>
