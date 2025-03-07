<?php
// Ensure proper JSON content type
header('Content-Type: application/json; charset=utf-8');

// Disable error display to prevent breaking JSON
ini_set('display_errors', 0);
error_reporting(0);

// Include PHPMailer classes
require_once 'phpmailer/src/Exception.php';
require_once 'phpmailer/src/PHPMailer.php';
require_once 'phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Function to send JSON response
function sendJsonResponse($status, $message) {
    echo json_encode([
        'status' => $status,
        'message' => $message
    ]);
    exit;
}

// Check if the form was submitted via POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJsonResponse('error', 'Requête invalide.');
}

// Validate and sanitize inputs
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$subject = filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING);
$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);

// Validate inputs
$errors = [];
if (empty($name)) $errors[] = "Nom requis";
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Email invalide";
if (empty($subject)) $errors[] = "Sujet requis";
if (empty($message)) $errors[] = "Message requis";

// If there are validation errors, return them
if (!empty($errors)) {
    sendJsonResponse('error', implode('<br>', $errors));
}

// Create a new PHPMailer instance
$mail = new PHPMailer(true);

try {
    // SMTP configuration
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'yassirazzouzi6@gmail.com';
    $mail->Password = 'pufanzdmkffxzqnj';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // Email content configuration
    $mail->setFrom($email, $name);
    $mail->addReplyTo($email, $name);
    $mail->addAddress('yassirazzouzi6@gmail.com');

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = nl2br("From: $name<br>Email: $email<br><br>Message:<br>$message");
    $mail->AltBody = "From: $name\nEmail: $email\n\nMessage:\n$message";

    // Send email
    if ($mail->send()) {
        sendJsonResponse('success', "Merci $name! Votre message a été envoyé avec succès.");
    } else {
        sendJsonResponse('error', "Désolé, une erreur s'est produite. Veuillez réessayer plus tard.");
    }
} catch (Exception $e) {
    // Catch any PHPMailer exceptions
    sendJsonResponse('error', "Erreur lors de l'envoi du message : " . $mail->ErrorInfo);
}
?>