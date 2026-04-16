<?php
declare(strict_types=1);

function monqid_handle_requests(PDO $pdo): void
{
    try {
        $stmt = $pdo->query(
            "SELECT id, patient_name, hospital, blood_type, bags, city, phone, urgency, notes, created_by, created_at
             FROM demandes
             WHERE TRIM(COALESCE(patient_name, '')) <> ''
               AND TRIM(COALESCE(hospital, '')) <> ''
               AND TRIM(COALESCE(blood_type, '')) <> ''
               AND TRIM(COALESCE(city, '')) <> ''
               AND TRIM(COALESCE(phone, '')) <> ''
             ORDER BY created_at DESC"
        );
        $rows = $stmt->fetchAll();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id'             => (int) $r['id'],
            'name'           => $r['patient_name'],
            'hospital'       => $r['hospital'],
            'blood'          => $r['blood_type'],
            'city'           => $r['city'],
            'bags'           => (int) $r['bags'],
            'urgency'        => $r['urgency'],
            'phone'          => $r['phone'],
            'notes'          => $r['notes'] ?? '',
            'donated'        => false,
            'created_at'     => $r['created_at'] ?? null,
            'nom_patient'    => $r['patient_name'],
            'ville'          => $r['city'],
            'groupe_sanguin' => $r['blood_type'],
            'hopital'        => $r['hospital'],
        ];
    }

    monqid_json_out(['success' => true, 'data' => $out]);
}

function monqid_handle_add_request(PDO $pdo): void
{
    $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    $in = stripos($ct, 'application/json') !== false ? monqid_read_json_body() : $_POST;

    $patient_name = monqid_non_empty((string) ($in['patient_name'] ?? $in['name'] ?? ''));
    $hospital     = monqid_non_empty((string) ($in['hospital'] ?? ''));
    $blood_type   = monqid_non_empty((string) ($in['blood_type'] ?? $in['blood'] ?? ''));
    $city         = monqid_non_empty((string) ($in['city'] ?? $in['ville'] ?? ''));
    $phone        = monqid_non_empty((string) ($in['phone'] ?? ''));
    $urgency      = monqid_non_empty((string) ($in['urgency'] ?? 'normal'));
    $notes        = trim((string) ($in['notes'] ?? ''));

    if ($urgency === '') {
        $urgency = 'normal';
    }

    $bags = (int) ($in['bags'] ?? $in['bags_needed'] ?? 1);
    if ($bags < 1) {
        $bags = 1;
    }

    $allowedBlood = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    $allowedUrg   = ['critical', 'high', 'normal'];

    if ($patient_name === '' || $hospital === '' || $blood_type === '' || $city === '' || $phone === '') {
        monqid_json_out(['success' => false, 'message' => 'حقول مطلوبة ناقصة'], 400);
    }
    if (!in_array($blood_type, $allowedBlood, true)) {
        monqid_json_out(['success' => false, 'message' => 'فصيلة دم غير صالحة'], 400);
    }
    if (!in_array($urgency, $allowedUrg, true)) {
        monqid_json_out(['success' => false, 'message' => 'درجة الاستعجال غير صالحة'], 400);
    }
    if (strlen($phone) < 6) {
        monqid_json_out(['success' => false, 'message' => 'رقم التواصل قصير جداً'], 400);
    }

    $created_by = isset($in['created_by']) ? (int) $in['created_by'] : 1;

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO demandes
             (patient_name, hospital, blood_type, bags, city, phone, urgency, notes, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $patient_name, $hospital, $blood_type, $bags, $city, $phone, $urgency, $notes, $created_by,
        ]);
        $id = (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    monqid_json_out([
        'success' => true,
        'data' => [
            'id'           => $id,
            'patient_name' => $patient_name,
            'hospital'     => $hospital,
            'blood_type'   => $blood_type,
            'bags'         => $bags,
            'city'         => $city,
            'phone'        => $phone,
            'urgency'      => $urgency,
            'notes'        => $notes,
        ],
    ]);
}

function monqid_handle_delete_request(PDO $pdo): void
{
    $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    $in = stripos($ct, 'application/json') !== false ? monqid_read_json_body() : $_POST;

    $id = (int) ($in['id'] ?? 0);
    if ($id < 1) {
        monqid_json_out(['success' => false, 'message' => 'معرّف غير صالح'], 400);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM demandes WHERE id = ?');
        $stmt->execute([$id]);
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    monqid_json_out(['success' => true, 'message' => 'تم الحذف']);
}
