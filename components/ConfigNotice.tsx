export function ConfigNotice() {
  return (
    <div className="notice notice-warn">
      <strong>Почта не настроена.</strong>
      <p>
        Задайте переменные окружения <code>EMAIL</code>,{" "}
        <code>EMAIL_PASSWORD</code> (пароль приложения Gmail) и <code>IMAP</code>
        , затем перезапустите сервис. Подробности — в <code>README.md</code>.
      </p>
    </div>
  );
}
