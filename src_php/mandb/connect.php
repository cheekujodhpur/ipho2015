<?php
$server = 'localhost';
$username = '';
$password = '';
$database_name = '';
$conn=mysql_connect($server, $username, $password) or die ('Error connecting to mysql');
mysql_select_db($database_name);
?>
