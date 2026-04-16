<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ── اتصال قاعدة البيانات ──
require_once __DIR__ . '/../db.php';

try {
    $pdo = monqid_get_pdo();
} catch (Exception $e) {
    json_out(['success' => false, 'message' => 'فشل الاتصال: ' . $e->getMessage()], 500);
}

// ── دوال مساعدة ──
function json_out(array $data, int $http = 200): void
{
    http_response_code($http);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function clean(string $s): string
{
    return trim(preg_replace('/\s+/u', ' ', $s));
}

// ── تحديد الـ action ──
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ════════════════════════════════════════
// طلبات الدم — قراءة
// ════════════════════════════════════════
if ($action === 'requests' && $method === 'GET') {
    $stmt = $pdo->query(
        "SELECT id, patient_name, hospital, blood_type, bags, city, phone, urgency, notes, created_at
         FROM demandes
         WHERE TRIM(COALESCE(patient_name,'')) <> ''
           AND TRIM(COALESCE(hospital,''))      <> ''
           AND TRIM(COALESCE(blood_type,''))    <> ''
           AND TRIM(COALESCE(city,''))          <> ''
           AND TRIM(COALESCE(phone,''))         <> ''
         ORDER BY
           CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
           created_at DESC"
    );
    $rows = $stmt->fetchAll();

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id'       => (int)$r['id'],
            'name'     => $r['patient_name'],
            'hospital' => $r['hospital'],
            'blood'    => $r['blood_type'],
            'city'     => $r['city'],
            'bags'     => (int)$r['bags'],
            'urgency'  => $r['urgency'],
            'phone'    => $r['phone'],
            'notes'    => $r['notes'] ?? '',
            'donated'  => false,
        ];
    }
    json_out(['success' => true, 'data' => $out]);
}

// ════════════════════════════════════════
// طلبات الدم — إضافة
// ════════════════════════════════════════
if ($action === 'add_request' && $method === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    $in = stripos($ct, 'application/json') !== false ? read_json_body() : $_POST;

    $name     = clean((string)($in['patient_name'] ?? $in['name'] ?? ''));
    $hospital = clean((string)($in['hospital'] ?? ''));
    $blood    = clean((string)($in['blood_type']  ?? $in['blood'] ?? ''));
    $city     = clean((string)($in['city'] ?? ''));
    $phone    = clean((string)($in['phone'] ?? ''));
    $urgency  = clean((string)($in['urgency'] ?? 'normal'));
    $notes    = trim((string)($in['notes'] ?? ''));
    $bags     = max(1, (int)($in['bags'] ?? 1));

    $allowed_blood = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    $allowed_urg   = ['critical','high','normal'];

    if (!$name || !$hospital || !$blood || !$city || !$phone)
        json_out(['success'=>false,'message'=>'حقول مطلوبة ناقصة'], 400);
    if (!in_array($blood, $allowed_blood, true))
        json_out(['success'=>false,'message'=>'فصيلة دم غير صالحة'], 400);
    if (!in_array($urgency, $allowed_urg, true)) $urgency = 'normal';
    if (strlen($phone) < 6)
        json_out(['success'=>false,'message'=>'رقم التواصل قصير جداً'], 400);

    $stmt = $pdo->prepare(
        "INSERT INTO demandes (patient_name, hospital, blood_type, bags, city, phone, urgency, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())"
    );
    $stmt->execute([$name, $hospital, $blood, $bags, $city, $phone, $urgency, $notes]);
    $id = (int)$pdo->lastInsertId();

    json_out(['success'=>true, 'data'=>[
        'id'=>$id,'name'=>$name,'hospital'=>$hospital,
        'blood'=>$blood,'bags'=>$bags,'city'=>$city,
        'phone'=>$phone,'urgency'=>$urgency,'notes'=>$notes,'donated'=>false
    ]]);
}

// ════════════════════════════════════════
// حملات — قراءة
// ════════════════════════════════════════
if ($action === 'campaigns' && $method === 'GET') {
    $stmt = $pdo->query(
        "SELECT id, title, organization, description, city, phone,
                start_date, end_date, priority, blood_types, goal, created_at
         FROM campaigns
         ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
                  created_at DESC"
    );
    json_out(['success'=>true, 'data'=>$stmt->fetchAll()]);
}

// ════════════════════════════════════════
// حملات — إضافة
// ════════════════════════════════════════
if ($action === 'add_campaign' && $method === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    $in = stripos($ct, 'application/json') !== false ? read_json_body() : $_POST;

    $title    = trim((string)($in['title']        ?? ''));
    $org      = trim((string)($in['organization'] ?? ''));
    $desc     = trim((string)($in['description']  ?? ''));
    $city     = trim((string)($in['city']         ?? ''));
    $phone    = trim((string)($in['phone']        ?? ''));
    $priority = trim((string)($in['priority']     ?? 'normal'));
    $goal     = max(1, (int)($in['goal'] ?? 1));
    $start    = ($in['start_date'] ?? '') ?: null;
    $end      = ($in['end_date']   ?? '') ?: null;

    $bloodRaw    = $in['blood_types'] ?? '';
    $blood_types = is_array($bloodRaw)
        ? implode(',', array_map('trim', $bloodRaw))
        : trim((string)$bloodRaw);

    $allowed_pri = ['critical','high','normal'];
    if (!in_array($priority, $allowed_pri, true)) $priority = 'normal';

    if (!$title || !$org || !$city || !$phone || !$blood_types)
        json_out(['success'=>false,'message'=>'حقول الحملة ناقصة'], 400);
    if (strlen($phone) < 6)
        json_out(['success'=>false,'message'=>'رقم التواصل قصير جداً'], 400);

    $stmt = $pdo->prepare(
        "INSERT INTO campaigns (title, organization, description, city, phone, start_date, end_date, priority, blood_types, goal, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())"
    );
    $stmt->execute([$title,$org,$desc,$city,$phone,$start,$end,$priority,$blood_types,$goal]);
    $id = (int)$pdo->lastInsertId();

    json_out(['success'=>true,'data'=>['id'=>$id]]);
}

// ════════════════════════════════════════
// مستخدمون — تسجيل
// ════════════════════════════════════════
if ($action === 'register' && $method === 'POST') {
    $first = trim((string)($_POST['f_nom']      ?? $_POST['first_name'] ?? ''));
    $last  = trim((string)($_POST['l_nom']      ?? $_POST['last_name']  ?? ''));
    $email = trim((string)($_POST['email']      ?? ''));
    $phone = trim((string)($_POST['tel']        ?? $_POST['phone']      ?? ''));
    $city  = trim((string)($_POST['ville']      ?? $_POST['city']       ?? ''));
    $blood = trim((string)($_POST['blood_type'] ?? ''));
    $addr  = trim((string)($_POST['adresse']    ?? $_POST['address']    ?? ''));
    $pass  = (string)($_POST['password']         ?? '');
    $pass2 = (string)($_POST['confirm_password'] ?? '');

    $errors = [];
    if (!$first || !$last)   $errors[] = 'الاسم مطلوب';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'بريد إلكتروني غير صالح';
    if (strlen($pass) < 6)  $errors[] = 'كلمة المرور 6 أحرف على الأقل';
    if ($pass !== $pass2)   $errors[] = 'تأكيد كلمة المرور غير مطابق';
    if ($errors) json_out(['success'=>false,'message'=>'تحقق من البيانات','errors'=>$errors], 400);

    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) json_out(['success'=>false,'message'=>'هذا البريد مسجّل مسبقاً'], 409);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        "INSERT INTO users (first_name, last_name, email, phone, city, blood_type, address, password, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([$first,$last,$email,$phone,$city,$blood,$addr,$hash]);

    json_out(['success'=>true,'message'=>'تم إنشاء الحساب','redirect'=>'login.html']);
}

// ════════════════════════════════════════
// مستخدمون — تسجيل الدخول
// ════════════════════════════════════════
if ($action === 'login' && $method === 'POST') {
    $email = trim((string)($_POST['email']    ?? ''));
    $pass  = (string)($_POST['password'] ?? '');

    if (!$email || !$pass)
        json_out(['success'=>false,'message'=>'البريد وكلمة المرور مطلوبان'], 400);

    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, email, password FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $u = $stmt->fetch();

    if (!$u) json_out(['success'=>false,'message'=>'بريد أو كلمة مرور خاطئة'], 401);

    $ok = password_verify($pass, $u['password']);
    // fallback للـ guest user اللي password ديالو plain text
    if (!$ok && strlen($u['password']) < 50) {
        $ok = hash_equals($u['password'], $pass);
    }
    if (!$ok) json_out(['success'=>false,'message'=>'بريد أو كلمة مرور خاطئة'], 401);

    json_out(['success'=>true,'message'=>'مرحباً','redirect'=>'profil.html','user'=>[
        'id'    => (int)$u['id'],
        'email' => $u['email'],
        'name'  => trim($u['first_name'].' '.$u['last_name']),
    ]]);
}

// ════════════════════════════════════════
// مستخدمون — الملف الشخصي
// ════════════════════════════════════════
if ($action === 'profile' && $method === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id < 1) json_out(['success'=>false,'message'=>'معرّف مطلوب'], 400);

    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, email, phone, city, blood_type, address, created_at
         FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_out(['success'=>false,'message'=>'المستخدم غير موجود'], 404);

    json_out(['success'=>true,'data'=>[
        'id'         => (int)$row['id'],
        'full_name'  => trim($row['first_name'].' '.$row['last_name']),
        'first_name' => $row['first_name'],
        'last_name'  => $row['last_name'],
        'email'      => $row['email'],
        'phone'      => $row['phone']      ?? '',
        'city'       => $row['city']       ?? '',
        'blood_type' => $row['blood_type'] ?? '',
        'address'    => $row['address']    ?? '',
        'created_at' => $row['created_at'] ?? null,
    ]]);
}

// ════════════════════════════════════════
// 404
// ════════════════════════════════════════
json_out(['success'=>false,'message'=>'action غير معروف: '.$action], 404);