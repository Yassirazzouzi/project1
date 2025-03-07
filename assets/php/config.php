<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecommerce_db"; // Remplacez par le nom de votre base de données

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>