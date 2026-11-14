<?php
require __DIR__ . '/auth.php';
meiwaku_session_start();

if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

$error = '';
$postedId = '';
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $postedId = isset($_POST['login_id']) ? trim((string) $_POST['login_id']) : '';
    $postedPassword = isset($_POST['password']) ? (string) $_POST['password'] : '';
    $postedToken = isset($_POST['csrf']) ? (string) $_POST['csrf'] : '';
    $tokenOk = is_string($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $postedToken);
    if ($tokenOk && meiwaku_check_login($postedId, $postedPassword)) {
        session_regenerate_id(true);
        $_SESSION['meiwaku_user'] = $postedId;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        header('Location: ./', true, 303);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        exit;
    }
    $error = 'IDまたはパスワードが違います';
}

if (meiwaku_logged_in()) {
    $app = __DIR__ . '/index.html';
    if (!is_file($app)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $html = file_get_contents($app);
    if (!is_string($html)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $save = '<script>(function(){try{var i=sessionStorage.getItem("meiwakumail_pending_id");var p=sessionStorage.getItem("meiwakumail_pending_password");if(i&&p){localStorage.setItem("meiwakumail_login_id",i);localStorage.setItem("meiwakumail_login_password",p);sessionStorage.removeItem("meiwakumail_pending_id");sessionStorage.removeItem("meiwakumail_pending_password");}}catch(e){}})();</script>';
    $html = preg_replace('/<\\/head>/', $save . '</head>', $html, 1);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('X-Content-Type-Options: nosniff');
    echo $html;
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
http_response_code(200);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#f3efe4">
    <title>ログイン｜めいわくチェック</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Yu Gothic UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif;
            color: #1b2330;
            background:
                radial-gradient(900px 420px at 0% -10%, #e3f6eb, transparent 55%),
                #f3efe4;
        }
        main { max-width: 420px; margin: 0 auto; padding: 32px 16px 48px; }
        header { text-align: center; }
        .mark { width: 72px; height: 72px; }
        h1 { margin: 12px 0 0; font-size: 1.45rem; letter-spacing: -0.02em; }
        .lead { margin: 8px 0 0; color: #5c6572; line-height: 1.7; }
        form {
            margin-top: 22px;
            background: #fffdf8;
            border: 1px solid #e3d8c6;
            border-radius: 24px;
            padding: 20px;
            box-shadow: 0 12px 32px rgba(48, 36, 12, 0.08);
        }
        label { display: block; font-size: 0.85rem; font-weight: 700; color: #0f5a38; margin-bottom: 6px; }
        .field { margin-bottom: 14px; }
        input {
            width: 100%;
            border: 1px solid #e3d8c6;
            background: #fff;
            border-radius: 12px;
            padding: 12px 14px;
            font: inherit;
            color: inherit;
        }
        .password-row { display: flex; gap: 8px; }
        .password-row input { min-width: 0; }
        button, .toggle { font: inherit; cursor: pointer; }
        .toggle {
            flex: 0 0 auto;
            border-radius: 12px;
            border: 1px solid #146b43;
            background: #fff;
            color: #146b43;
            padding: 0 14px;
            font-weight: 700;
        }
        .submit {
            width: 100%;
            border: none;
            border-radius: 14px;
            background: #146b43;
            color: #fff;
            font-weight: 700;
            padding: 14px;
        }
        .error {
            margin: 0 0 14px;
            padding: 10px 12px;
            border-radius: 12px;
            background: #fdeceb;
            color: #a31b16;
            font-size: 0.95rem;
            font-weight: 700;
        }
        [hidden] { display: none !important; }
    </style>
</head>
<body>
    <main>
        <header>
            <svg class="mark" viewBox="0 0 512 512" aria-hidden="true">
                <rect width="512" height="512" rx="96" fill="#146B43"/>
                <path fill="#F4F0E6" d="M256 78 L404 138 V270 C404 368 338 428 256 460 C174 428 108 368 108 270 V138 Z"/>
                <path d="M184 268 L230 318 L328 196" fill="none" stroke="#146B43" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h1>めいわくチェック</h1>
            <p class="lead">入るには ID とパスワードが必要です</p>
        </header>
        <form method="post" action="" autocomplete="off">
            <input type="hidden" name="csrf" value="<?php echo htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8'); ?>">
            <p id="loginError" class="error" role="alert"<?php echo $error === '' ? ' hidden' : ''; ?>><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
            <div class="field">
                <label for="login_id">ID</label>
                <input id="login_id" name="login_id" type="text" inputmode="text" autocomplete="username" required maxlength="64" value="<?php echo htmlspecialchars($postedId, ENT_QUOTES, 'UTF-8'); ?>">
            </div>
            <div class="field">
                <label for="password">パスワード</label>
                <div class="password-row">
                    <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128">
                    <button type="button" class="toggle" id="togglePassword" aria-controls="password" aria-pressed="false">表示</button>
                </div>
            </div>
            <button type="submit" class="submit">入る</button>
        </form>
    </main>
    <script>
        var idKey = 'meiwakumail_login_id';
        var passwordKey = 'meiwakumail_login_password';
        var form = document.querySelector('form');
        var idInput = document.getElementById('login_id');
        var passwordInput = document.getElementById('password');
        var errorBox = document.getElementById('loginError');

        document.getElementById('togglePassword').addEventListener('click', function () {
            var showing = passwordInput.type === 'text';
            passwordInput.type = showing ? 'password' : 'text';
            this.textContent = showing ? '表示' : '隠す';
            this.setAttribute('aria-pressed', showing ? 'false' : 'true');
        });

        form.addEventListener('submit', function () {
            try {
                sessionStorage.setItem('meiwakumail_pending_id', idInput.value.trim());
                sessionStorage.setItem('meiwakumail_pending_password', passwordInput.value);
            } catch (err) {}
        });

        try {
            var failed = errorBox && !errorBox.hasAttribute('hidden') && errorBox.textContent;
            if (failed) {
                localStorage.removeItem(passwordKey);
                sessionStorage.removeItem('meiwakumail_pending_id');
                sessionStorage.removeItem('meiwakumail_pending_password');
            }
            var savedId = localStorage.getItem(idKey) || '';
            var savedPassword = localStorage.getItem(passwordKey) || '';
            if (!failed && savedId && savedPassword) {
                idInput.value = savedId;
                passwordInput.value = savedPassword;
                form.submit();
            } else if (savedId && !idInput.value) {
                idInput.value = savedId;
            }
        } catch (err) {}
    </script>
</body>
</html>
