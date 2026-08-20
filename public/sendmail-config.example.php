<?php
/**
 * Copie este arquivo para "sendmail-config.php" (mesma pasta) e preencha com
 * os dados reais do provedor de e-mail. "sendmail-config.php" NÃO deve ir
 * para o Git (já está no .gitignore) — é o único lugar com a senha SMTP.
 */

define('SMTP_HOST', 'mail.sp2mgestao.com.br');
define('SMTP_PORT', 465);
define('SMTP_SECURE', 'ssl'); // 'ssl' para porta 465, 'tls' para porta 587
define('SMTP_USER', 'noreply@sp2mgestao.com.br');
define('SMTP_PASS', 'sua_senha_aqui');
define('SMTP_FROM_EMAIL', 'noreply@sp2mgestao.com.br');
define('SMTP_FROM_NAME', 'SP2M Gestão');

// Para onde o lead do formulário de contato simples é enviado
define('SP2M_TO_EMAIL', 'contato@sp2mgestao.com.br');

// Para onde o diagnóstico completo (PDF com as 80 respostas do cliente) é enviado
define('DIAGNOSTIC_TO_EMAIL', 'seidel@sp2mgestao.com.br');
