<?php
declare(strict_types=1);

/**
 * TEMPORARY MAIL STUB (no real sending yet)
 */
function send_password_reset_code(string $toEmail, ?string &$outCode = null): bool
{
    $hardcodedCode = "123456";
    $outCode = $hardcodedCode;

    error_log("TEMP RESET CODE for {$toEmail}: {$hardcodedCode}");
    return true;
}