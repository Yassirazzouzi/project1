<?php
// Activer le rapport d'erreurs complet
error_reporting(E_ALL);
ini_set('display_errors', 1);

// En-têtes CORS sécurisés
header('Content-Type: application/json');
// Remplacez cette ligne par votre domaine spécifique
$allowed_origin = 'https://votre-domaine.com';

// Vérifier si l'origine est présente dans la requête
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// N'autoriser que l'origine spécifique
if ($origin === $allowed_origin) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Gestion des requêtes OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Fichier de log
$log_file = 'cookie_consent_debug.log';

// Fonction de journalisation
function logDebug($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] " . htmlspecialchars($message) . "\n", FILE_APPEND);
}

try {
    // Vérification de la méthode HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Méthode non autorisée");
    }

    // Récupération des données JSON
    $json_data = file_get_contents('php://input');
    logDebug("Données reçues brutes : " . htmlspecialchars($json_data));

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
        throw new Exception("Paramètres manquants");
    }

    // Validation plus poussée des données
    if (!is_bool($data['accepted']) && !is_numeric($data['accepted'])) {
        throw new Exception("Le champ 'accepted' doit être un booléen ou une valeur numérique");
    }

    if (!is_array($data['consentData'])) {
        throw new Exception("Le champ 'consentData' doit être un objet");
    }

    // Récupération de l'adresse IP de manière sécurisée
    $ip_address = filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP);
    if (!$ip_address) {
        $ip_address = '0.0.0.0'; // Valeur par défaut si l'IP n'est pas valide
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
        
        // Conversion explicite du booléen en entier pour MySQL
        $accepted = (int)$data['accepted'];
        
        // Préparation des données JSON en vérifiant les erreurs
        $json_consent = json_encode($data['consentData']);
        if ($json_consent === false) {
            throw new Exception("Erreur de conversion JSON: " . json_last_error_msg());
        }
        
        // Exécution de la requête avec des données validées
        $result = $stmt->execute([
            ':ip_address' => $ip_address,
            ':consent_data' => $json_consent,
            ':accepted' => $accepted
        ]);
        
        // Vérification du résultat
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            logDebug("Erreur d'insertion : " . print_r($errorInfo, true));
            throw new Exception("Échec de l'insertion dans la base de données");
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
        throw new Exception("Erreur de base de données");
    }
} catch (Exception $e) {
    // Journalisation de l'erreur complète
    logDebug("Erreur générale : " . $e->getMessage());
   
    // Réponse d'erreur sans détails techniques en production
    $response = [
        'success' => false,
        'message' => "Erreur lors de l'enregistrement du consentement"
    ];
    
    // En développement uniquement, ajouter plus de détails
    if (ini_get('display_errors')) {
        $response['details'] = $e->getMessage();
    }
    
    logDebug("Réponse d'erreur : " . json_encode($response));
    http_response_code(400); // Code d'erreur HTTP approprié
    echo json_encode($response);
}
?>