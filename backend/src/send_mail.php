<?php
/**
 * TEMPORARY MAIL STUB
 * -------------------
 * This file intentionally does NOT send email.
 * It provides a hardcoded reset code so the
 * forgot-password and reset-password flows
 * can be tested independently of email delivery.
 *
 * REMOVE OR REPLACE when implementing real mail().
 */

function send_password_reset_code(string $toEmail, string &$outCode = null): bool
{
    // 🔒 Hardcoded reset code for testing
    $hardcodedCode = "123456";

    // Pass the code back to the caller so it can be stored/hashed
    $outCode = $hardcodedCode;

    // Log for debugging / demo purposes
    error_log("TEMP RESET CODE for {$toEmail}: {$hardcodedCode}");

    // Pretend the email was successfully sent
    return true;
}