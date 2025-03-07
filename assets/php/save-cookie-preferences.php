<?php
// Activer le rapport d'erreurs complet
error_reporting(E_ALL);
ini_set('display_errors', 1);

// En-têtes pour le débogage
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Fichier de log
$log_file = 'cookie_consent_debug.log';

// Fonction de journalisation
function logDebug($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

try {
    // Récupération des données JSON
    $json_data = file_get_contents('php://input');
    logDebug("Données reçues brutes : " . $json_data);

    // Vérification des données
    if (empty($json_data)) {
        throw new Exception("Aucune donnée reçue");
    }

    // Décodage des données JSON
    $data = json_decode($json_data, true);
    if ($data === null) {
        throw new Exception("Erreur de décodage JSON : " . json_last_error_msg());
    }

    // Validation des données
    if (!isset($data['accepted']) || !isset($data['consentData'])) {
        throw new Exception("Paramètres manquants : " . print_r($data, true));
    }

    // Paramètres de connexion à la base de données
    $host = 'localhost';
    $dbname = 'ecommerce_db';
    $username = 'root';
    $password = '';

    try {
        // Connexion à la base de données
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Préparation de la requête SQL
        $stmt = $pdo->prepare(
            "INSERT INTO cookie_preferences (
                ip_address, 
                consent_data, 
                accepted, 
                created_at
            ) VALUES (
                :ip_address, 
                :consent_data, 
                :accepted, 
                NOW()
            )"
        );

        // Exécution de la requête
        $result = $stmt->execute([
            ':ip_address' => $_SERVER['REMOTE_ADDR'],
            ':consent_data' => json_encode($data['consentData']),
            ':accepted' => $data['accepted'] ? 1 : 0
        ]);

        // Vérification du résultat
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            logDebug("Erreur d'insertion : " . print_r($errorInfo, true));
            throw new Exception("Échec de l'insertion : " . print_r($errorInfo, true));
        }

        // Réponse de succès
        $response = [
            'success' => true, 
            'message' => 'Consentement enregistré avec succès',
            'insertedId' => $pdo->lastInsertId()
        ];
        logDebug("Réponse envoyée : " . json_encode($response));
        echo json_encode($response);

    } catch (PDOException $e) {
        logDebug("Erreur PDO : " . $e->getMessage());
        throw new Exception("Erreur de base de données : " . $e->getMessage());
    }

} catch (Exception $e) {
    // Journalisation de l'erreur complète
    logDebug("Erreur générale : " . $e->getMessage());
    
    // Réponse d'erreur détaillée
    $response = [
        'success' => false, 
        'message' => "Erreur lors de l'enregistrement",
        'details' => $e->getMessage()
    ];
    logDebug("Réponse d'erreur : " . json_encode($response));
    echo json_encode($response);
}
?>