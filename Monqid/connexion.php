<?php
// ═══════════════════════════════════════════════════════
//  config.php — ربط قاعدة البيانات مع الموقع
//  ضع هذا الملف في: C:\xampp\htdocs\monqid\config.php
// ═══════════════════════════════════════════════════════

$host     = "localhost";
$dbname   = "monqid";
$username = "root";
$password = "";  // XAMPP بدون password افتراضياً

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die(json_encode([
        "success" => false,
        "message" => "Connection failed: " . $e->getMessage()
    ]));
}


// ═══════════════════════════════════════════════════════
//  register.php — تسجيل مستخدم جديد
// ═══════════════════════════════════════════════════════

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $errors = [];

    $nom      = trim($_POST['f_nom']      ?? '');
    $prenom   = trim($_POST['l_nom']      ?? '');
    $email    = trim($_POST['email']      ?? '');
    $tel      = trim($_POST['tel']        ?? '');
    $blood    = trim($_POST['blood_type'] ?? '');
    $ville    = trim($_POST['ville']      ?? '');
    $adresse  = trim($_POST['adresse']    ?? '');
    $password = trim($_POST['password']   ?? '');
    $confirm  = trim($_POST['confirm_password'] ?? '');
    $username = strtolower($prenom . '_' . $nom . rand(10,99));

    // Validation
    if (!$nom)    $errors[] = 'الاسم الأخير مطلوب';
    if (!$prenom) $errors[] = 'الاسم الأول مطلوب';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'البريد غير صحيح';
    if (strlen($password) < 6) $errors[] = 'كلمة المرور 6 أحرف على الأقل';
    if ($password !== $confirm) $errors[] = 'كلمتا المرور غير متطابقتين';

    // تحقق من عدم تكرار الإيميل
    if (!$errors) {
        $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) $errors[] = 'البريد الإلكتروني مستخدم مسبقاً';
    }

    if ($errors) {
        echo json_encode(["success" => false, "errors" => $errors]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("
        INSERT INTO users
          (nom, prenom, username, email, password_hash, tel, blood_type, ville, role, status)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')
    ");
    $stmt->execute([$nom, $prenom, $username, $email, $hash, $tel, $blood, $ville]);

    echo json_encode([
        "success"  => true,
        "redirect" => "profil.html"
    ]);
}



// ═══════════════════════════════════════════════════════
//  login.php — تسجيل الدخول
// ═══════════════════════════════════════════════════════

require_once 'config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_nom']  = $user['prenom'] . ' ' . $user['nom'];

        echo json_encode([
            "success"  => true,
            "redirect" => "index.html"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "البريد أو كلمة المرور غير صحيحة"
        ]);
    }
}


// ═══════════════════════════════════════════════════════
//  requests.php — جلب طلبات الدم
// ═══════════════════════════════════════════════════════

require_once 'config.php';

$blood   = $_GET['blood']   ?? 'all';
$ville   = $_GET['ville']   ?? 'all';
$urgency = $_GET['urgency'] ?? 'all';

$sql    = "SELECT * FROM blood_requests WHERE is_fulfilled = 0";
$params = [];

if ($blood !== 'all')   { $sql .= " AND blood_type = ?"; $params[] = $blood; }
if ($ville !== 'all')   { $sql .= " AND ville = ?";      $params[] = $ville; }
if ($urgency !== 'all') { $sql .= " AND urgency = ?";    $params[] = $urgency; }

$sql .= " ORDER BY FIELD(urgency,'critical','high','normal'), created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode($stmt->fetchAll());



// ═══════════════════════════════════════════════════════
//  add_request.php — إضافة طلب دم جديد
// ═══════════════════════════════════════════════════════

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $pdo->prepare("
        INSERT INTO blood_requests
          (patient_name, hospital, blood_type, ville, bags_needed, urgency, phone, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $_POST['name'],
        $_POST['hospital'],
        $_POST['blood'],
        $_POST['city'],
        $_POST['bags'],
        $_POST['urgency'],
        $_POST['phone'],
        $_POST['notes'] ?? ''
    ]);

    echo json_encode([
        "success" => true,
        "id"      => $pdo->lastInsertId()
    ]);
}



// ═══════════════════════════════════════════════════════
//  donate.php — تسجيل تبرع
// ═══════════════════════════════════════════════════════

require_once 'config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_pub     = $_SESSION['user_id'] ?? null;
    $id_demande = $_POST['id_demande'] ?? null;
    $id_org     = $_POST['id_org']     ?? null;
    $type       = $_POST['type']       ?? 'spontane';

    $stmt = $pdo->prepare("
        INSERT INTO donations (id_pub, id_demande, id_org, type_donation)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$id_pub, $id_demande, $id_org, $type]);

    // زيد عدد الأكياس في الطلب
    if ($id_demande) {
        $pdo->prepare("
            UPDATE blood_requests
            SET bags_filled = bags_filled + 1
            WHERE id = ?
        ")->execute([$id_demande]);
    }

    // زيد نقاط المتبرع
    if ($id_pub) {
        $pdo->prepare("
            UPDATE users
            SET donations_count = donations_count + 1,
                points = points + 100
            WHERE id = ?
        ")->execute([$id_pub]);
    }

    echo json_encode(["success" => true]);
}

?>