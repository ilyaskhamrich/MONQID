<?php
declare(strict_types=1);

function monqid_get_pdo(): PDO
{
    $host    = '127.0.0.1';
    $port    = 8080;          // ← XAMPP ديالك على 8080
    $db      = 'monqid_db';
    $user    = 'root';
    $pass    = '';            // XAMPP password فارغ بالعادة
    $charset = 'utf8mb4';

    // MySQL دائماً على port 3306 حتى لو Apache على 8080
    $dsn = "mysql:host=$host;port=3306;dbname=$db;charset=$charset";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}