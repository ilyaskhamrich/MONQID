<?php
declare(strict_types=1);

function monqid_json_out(array $data, int $http = 200): void
{
    http_response_code($http);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function monqid_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function monqid_non_empty(string $s): string
{
    return trim(preg_replace('/\s+/u', ' ', $s) ?? '');
}

function monqid_resolve_action(): string
{
    $fromGet = $_GET['action'] ?? '';
    if ($fromGet !== '') {
        return $fromGet;
    }
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (preg_match('#/api\.php/requests/?#', $uri)) {
        return $method === 'POST' ? 'add_request' : 'requests';
    }
    return '';
}
