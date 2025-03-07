<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$log_file = 'customer_log.txt';

function logRegistrationDetails($message, $data = null) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message\n";
    
    if ($data !== null) {
        $log_entry .= "Détails de l'inscription:\n";
        foreach ($data as $key => $value) {
            if (in_array($key, ['password', 'payment_details'])) {
                $value = '********';
            }
            $log_entry .= "  - $key: " . (is_array($value) ? json_encode($value) : $value) . "\n";
        }
    }
    
    $log_entry .= "Informations supplémentaires:\n";
    $log_entry .= "  - Adresse IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
    $log_entry .= "  - User Agent: " . $_SERVER['HTTP_USER_AGENT'] . "\n";
    $log_entry .= "---\n";
    

    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

try {

    if ($_SERVER["REQUEST_METHOD"] != "POST") {
        throw new Exception("Méthode de requête non autorisée");
    }

    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $first_name = filter_input(INPUT_POST, 'first_name', FILTER_SANITIZE_STRING);
    $last_name = filter_input(INPUT_POST, 'last_name', FILTER_SANITIZE_STRING);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $plan_id = filter_input(INPUT_POST, 'plan', FILTER_VALIDATE_INT);
    $price = filter_input(INPUT_POST, 'price', FILTER_VALIDATE_FLOAT);
    $duration = filter_input(INPUT_POST, 'duration', FILTER_SANITIZE_STRING);

    if (!$email) {
        throw new Exception("Email invalide");
    }
    if (empty($first_name) || empty($last_name)) {
        throw new Exception("Nom et prénom requis");
    }

    $host = 'localhost';
    $dbname = 'ecommerce_db';
    $username = 'root';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->beginTransaction();

    $stmt_customer = $pdo->prepare("
        INSERT INTO customers 
        (email, first_name, last_name, phone, current_plan_id) 
        VALUES 
        (:email, :first_name, :last_name, :phone, :current_plan_id)
    ");

    $stmt_customer->execute([
        ':email' => $email,
        ':first_name' => $first_name,
        ':last_name' => $last_name,
        ':phone' => $phone,
        ':current_plan_id' => $plan_id
    ]);

    $customer_id = $pdo->lastInsertId();

    $stmt_order = $pdo->prepare("
        INSERT INTO orders 
        (customer_id, plan_id, order_amount, payment_details, status) 
        VALUES 
        (:customer_id, :plan_id, :order_amount, :payment_details, :status)
    ");

    $stmt_order->execute([
        ':customer_id' => $customer_id,
        ':plan_id' => $plan_id,
        ':order_amount' => $price,
        ':payment_details' => json_encode([
            'method' => 'registration_form',
            'additional_info' => $duration
        ]),
        ':status' => 'pending'
    ]);

    $order_id = $pdo->lastInsertId();
    $stmt_update_customer = $pdo->prepare("
        UPDATE customers 
        SET last_order_id = :last_order_id 
        WHERE id = :customer_id
    ");
    $stmt_update_customer->execute([
        ':last_order_id' => $order_id,
        ':customer_id' => $customer_id
    ]);

    $pdo->commit();

    logRegistrationDetails("Inscription client réussie", [
        'customer_id' => $customer_id,
        'email' => $email,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'phone' => $phone,
        'plan_id' => $plan_id,
        'order_id' => $order_id
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Inscription réussie',
        'customer_id' => $customer_id,
        'order_id' => $order_id
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

        logRegistrationDetails("Erreur d'inscription", [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);

    // Réponse d'erreur
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors de l'inscription : " . $e->getMessage()
    ]);
}
?>