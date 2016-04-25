<?php

$username = "";
$password = "";
$serverLoc = "127.0.0.1";


$connection = mysqli_connect('127.0.0.1','spacedust',':^)','vichan2');

//$Boards = array();

$sql = "SELECT * FROM boards";
$result = mysqli_query($connection,$sql);
 while($row = mysqli_fetch_array($result))
 {
   //echo $row['uri'];
   $uri = $row['uri'];
   $sql2 = "UPDATE posts_".$uri." SET email='".$uri."'";
  // echo $sql2;
   $res =  mysqli_query($connection,$sql2);
  echo mysqli_error($connection);
 }



?>
