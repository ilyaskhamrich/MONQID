<?php
declare(strict_types=1);

function monqid_handle_campaigns(PDO $pdo): void
{
    try {
        $stmt = $pdo->query(
            'SELECT id, title, organization, description, city, phone, start_date, end_date, priority, blood_types, goal, created_by, created_at
             FROM campaigns ORDER BY created_at DESC'
        );
        $rows = $stmt->fetchAll();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    monqid_json_out(['success' => true, 'data' => $rows]);
}

function monqid_handle_add_campaign(PDO $pdo): void
{
    $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    $in = stripos($ct, 'application/json') !== false ? monqid_read_json_body() : $_POST;

    $title    = trim((string) ($in['title'] ?? ''));
    $org      = trim((string) ($in['organization'] ?? ''));
    $desc     = trim((string) ($in['description'] ?? ''));
    $city     = trim((string) ($in['city'] ?? ''));
    $phone    = trim((string) ($in['phone'] ?? ''));
    $priority = trim((string) ($in['priority'] ?? 'normal'));
    $bloodRaw = $in['blood_types'] ?? '';

    if (is_array($bloodRaw)) {
        $blood_types = implode(',', array_map('trim', $bloodRaw));
    } else {
        $blood_types = trim((string) $bloodRaw);
    }

    $goal  = (int) ($in['goal'] ?? 0);
    $start = $in['start_date'] ?? null;
    $end   = $in['end_date'] ?? null;

    $allowedPri = ['critical', 'high', 'normal'];
    if (!in_array($priority, $allowedPri, true)) {
        $priority = 'normal';
    }

    if ($title === '' || $org === '' || $city === '' || $phone === '' || $blood_types === '') {
        monqid_json_out(['success' => false, 'message' => 'حقول الحملة ناقصة'], 400);
    }
    if (strlen($phone) < 6) {
        monqid_json_out(['success' => false, 'message' => 'رقم التواصل قصير جداً'], 400);
    }
    if ($goal < 1) {
        $goal = 1;
    }

    $sd = $start !== null && $start !== '' ? $start : null;
    $ed = $end !== null && $end !== '' ? $end : null;
    $created_by = isset($in['created_by']) ? (int) $in['created_by'] : 1;

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO campaigns
            (title, organization, description, city, phone, start_date, end_date, priority, blood_types, goal, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$title, $org, $desc, $city, $phone, $sd, $ed, $priority, $blood_types, $goal, $created_by]);
        $id = (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    monqid_json_out(['success' => true, 'data' => ['id' => $id]]);
}
