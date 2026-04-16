<?php
declare(strict_types=1);

function monqid_handle_profile(PDO $pdo): void
{
    $id = (int) ($_GET['id'] ?? 0);
    if ($id < 1) {
        monqid_json_out(['success' => false, 'message' => 'معرّف المستخدم مطلوب'], 400);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT id, first_name, last_name, email, phone, city, blood_type, address, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    if (!$row) {
        monqid_json_out(['success' => false, 'message' => 'المستخدم غير موجود'], 404);
    }

    monqid_json_out([
        'success' => true,
        'data' => [
            'id'         => (int) $row['id'],
            'first_name' => $row['first_name'],
            'last_name'  => $row['last_name'],
            'full_name'  => trim($row['first_name'] . ' ' . $row['last_name']),
            'email'      => $row['email'],
            'phone'      => $row['phone'] ?? '',
            'city'       => $row['city'] ?? '',
            'blood_type' => $row['blood_type'] ?? '',
            'address'    => $row['address'] ?? '',
            'created_at' => $row['created_at'] ?? null,
        ],
    ]);
}

function monqid_handle_register(PDO $pdo): void
{
    $first = trim((string) ($_POST['l_nom'] ?? $_POST['first_name'] ?? ''));
    $last  = trim((string) ($_POST['f_nom'] ?? $_POST['last_name'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $phone = trim((string) ($_POST['tel'] ?? $_POST['phone'] ?? ''));
    $city  = trim((string) ($_POST['ville'] ?? $_POST['city'] ?? ''));
    $blood = trim((string) ($_POST['blood_type'] ?? ''));
    $addr  = trim((string) ($_POST['adresse'] ?? $_POST['address'] ?? ''));
    $pass  = (string) ($_POST['password'] ?? '');
    $pass2 = (string) ($_POST['confirm_password'] ?? '');

    $errors = [];
    if ($first === '' || $last === '') {
        $errors[] = 'الاسم مطلوب';
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'بريد إلكتروني غير صالح';
    }
    if (strlen($pass) < 6) {
        $errors[] = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if ($pass !== $pass2) {
        $errors[] = 'تأكيد كلمة المرور غير مطابق';
    }
    if ($errors !== []) {
        monqid_json_out(['success' => false, 'message' => 'تحقق من البيانات', 'errors' => $errors], 400);
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);

    try {
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $chk->execute([$email]);
        if ($chk->fetch()) {
            monqid_json_out(['success' => false, 'message' => 'هذا البريد مسجّل مسبقاً', 'errors' => ['البريد مستخدم']], 409);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO users (first_name, last_name, email, phone, city, blood_type, address, password, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$first, $last, $email, $phone, $city, $blood, $addr, $hash]);
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    monqid_json_out([
        'success'  => true,
        'message'  => 'تم إنشاء الحساب',
        'redirect' => 'login.html',
    ]);
}

function monqid_handle_login(PDO $pdo): void
{
    $email = trim((string) ($_POST['email'] ?? ''));
    $pass  = (string) ($_POST['password'] ?? '');

    if ($email === '' || $pass === '') {
        monqid_json_out(['success' => false, 'message' => 'البريد وكلمة المرور مطلوبان'], 400);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT id, first_name, last_name, email, password FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $u = $stmt->fetch();
    } catch (PDOException $e) {
        monqid_json_out(['success' => false, 'message' => $e->getMessage()], 500);
    }

    if (!$u) {
        monqid_json_out(['success' => false, 'message' => 'بريد أو كلمة مرور خاطئة'], 401);
    }

    $stored = $u['password'];
    $ok = password_verify($pass, $stored);
    if (!$ok && strlen($stored) < 50) {
        $ok = hash_equals($stored, $pass);
    }
    if (!$ok) {
        monqid_json_out(['success' => false, 'message' => 'بريد أو كلمة مرور خاطئة'], 401);
    }

    monqid_json_out([
        'success'  => true,
        'message'  => 'مرحباً',
        'redirect' => 'profil.html',
        'user' => [
            'id'    => (int) $u['id'],
            'email' => $u['email'],
            'name'  => trim($u['first_name'] . ' ' . $u['last_name']),
        ],
    ]);
}
