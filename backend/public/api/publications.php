<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/db.php';
require_once __DIR__ . '/../../src/auth.php';

const PUBLICATIONS_CACHE_TTL_SECONDS = 1800; // 30 minutes
const PUBLICATIONS_SYNC_PROVIDER = 'OpenAlex';

function publications_json(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function publications_config(): array {
    return require __DIR__ . '/../../src/config.php';
}

function publications_openalex_queries(): array {
    return [
        'avian influenza poultry livestock outbreak surveillance',
        'african swine fever swine livestock outbreak surveillance',
        'foot and mouth disease cattle livestock outbreak surveillance',
        'bovine tuberculosis cattle livestock outbreak surveillance',
        'bluetongue sheep cattle livestock outbreak surveillance',
        'brucellosis cattle goat sheep livestock outbreak surveillance',
        'livestock epidemic disease surveillance cattle swine poultry'
    ];
}

function publications_livestock_terms(): array {
    return [
        'livestock', 'cattle', 'bovine', 'cow', 'dairy', 'swine', 'pig', 'porcine',
        'poultry', 'avian', 'chicken', 'broiler', 'turkey', 'sheep', 'ovine',
        'goat', 'caprine', 'herd', 'flock'
    ];
}

function publications_disease_terms(): array {
    return [
        'outbreak', 'epidemic', 'epizootic', 'surveillance', 'transmission',
        'avian influenza', 'h5n1', 'african swine fever', 'foot and mouth',
        'foot-and-mouth', 'bovine tuberculosis', 'brucellosis', 'bluetongue',
        'disease', 'pathogen', 'infection'
    ];
}

function publications_join_authors(array $authorships): string {
    $names = [];
    foreach ($authorships as $author) {
        $name = trim((string)($author['author']['display_name'] ?? ''));
        if ($name !== '') {
            $names[] = $name;
        }
    }
    return implode(', ', $names);
}

function publications_extract_journal(array $work): string {
    return trim((string)($work['primary_location']['source']['display_name'] ?? ''));
}

function publications_extract_origin_url(array $work): string {
    $landing = trim((string)($work['primary_location']['landing_page_url'] ?? ''));
    if ($landing !== '') return $landing;

    $doi = trim((string)($work['doi'] ?? ''));
    if ($doi !== '') return $doi;

    return trim((string)($work['id'] ?? ''));
}

function publications_rebuild_abstract($invertedIndex): string {
    if (!is_array($invertedIndex) || empty($invertedIndex)) {
        return '';
    }

    $positionToWord = [];
    foreach ($invertedIndex as $word => $positions) {
        if (!is_array($positions)) continue;
        foreach ($positions as $pos) {
            $positionToWord[(int)$pos] = $word;
        }
    }

    if (empty($positionToWord)) return '';

    ksort($positionToWord);
    return trim(implode(' ', $positionToWord));
}

function publications_is_relevant(string $text): bool {
    $text = strtolower($text);

    $hasLivestock = false;
    foreach (publications_livestock_terms() as $term) {
        if (str_contains($text, strtolower($term))) {
            $hasLivestock = true;
            break;
        }
    }

    if (!$hasLivestock) return false;

    foreach (publications_disease_terms() as $term) {
        if (str_contains($text, strtolower($term))) {
            return true;
        }
    }

    return false;
}

function publications_http_get_json(string $url): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'User-Agent: LivestockEpidemicTracker/1.0'
        ],
    ]);

    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        throw new RuntimeException('cURL error: ' . $error);
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('HTTP status ' . $status);
    }

    $decoded = json_decode((string)$body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON response');
    }

    return $decoded;
}

function publications_log_sync(PDO $pdo, string $status, string $message): void {
    $stmt = $pdo->prepare("
        INSERT INTO publication_sync_status (provider, status, message)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([PUBLICATIONS_SYNC_PROVIDER, $status, mb_substr($message, 0, 500)]);
}

function publications_build_openalex_url(string $query): string {
    $cfg = publications_config();

    $params = [
        'search' => $query,
        'per_page' => 25,
        'page' => 1,
        'select' => 'id,display_name,publication_year,publication_date,doi,type,authorships,primary_location,abstract_inverted_index',
        'mailto' => $cfg['openalex_mailto'] ?? '',
    ];

    if (!empty($cfg['openalex_api_key'])) {
        $params['api_key'] = $cfg['openalex_api_key'];
    }

    return 'https://api.openalex.org/works?' . http_build_query($params);
}

function publications_upsert_api_record(PDO $pdo, array $row): void {
    $stmt = $pdo->prepare("
        INSERT INTO api_publications_cache (
            external_id, source_name, title, authors, journal,
            publication_year, publication_date, doi, origin_url,
            abstract_text, publication_type, raw_json, cached_at
        ) VALUES (
            :external_id, :source_name, :title, :authors, :journal,
            :publication_year, :publication_date, :doi, :origin_url,
            :abstract_text, :publication_type, :raw_json, NOW()
        )
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            authors = VALUES(authors),
            journal = VALUES(journal),
            publication_year = VALUES(publication_year),
            publication_date = VALUES(publication_date),
            doi = VALUES(doi),
            origin_url = VALUES(origin_url),
            abstract_text = VALUES(abstract_text),
            publication_type = VALUES(publication_type),
            raw_json = VALUES(raw_json),
            cached_at = NOW()
    ");

    $stmt->execute($row);
}

function publications_sync_openalex(PDO $pdo): array {
    $saved = 0;
    $seen = [];

    foreach (publications_openalex_queries() as $query) {
        $url = publications_build_openalex_url($query);
        $response = publications_http_get_json($url);
        $results = $response['results'] ?? [];

        if (!is_array($results)) {
            continue;
        }

        foreach ($results as $work) {
            $externalId = trim((string)($work['id'] ?? ''));
            if ($externalId === '' || isset($seen[$externalId])) {
                continue;
            }

            $title = trim((string)($work['display_name'] ?? ''));
            $authors = publications_join_authors($work['authorships'] ?? []);
            $journal = publications_extract_journal($work);
            $abstract = publications_rebuild_abstract($work['abstract_inverted_index'] ?? null);
            $combinedText = trim($title . ' ' . $journal . ' ' . $abstract);

            if (!publications_is_relevant($combinedText)) {
                continue;
            }

            $seen[$externalId] = true;

            publications_upsert_api_record($pdo, [
                'external_id' => $externalId,
                'source_name' => 'OpenAlex',
                'title' => $title !== '' ? $title : 'Untitled publication',
                'authors' => $authors,
                'journal' => $journal,
                'publication_year' => !empty($work['publication_year']) ? (int)$work['publication_year'] : null,
                'publication_date' => !empty($work['publication_date']) ? $work['publication_date'] : null,
                'doi' => trim((string)($work['doi'] ?? '')),
                'origin_url' => publications_extract_origin_url($work),
                'abstract_text' => $abstract,
                'publication_type' => trim((string)($work['type'] ?? '')),
                'raw_json' => json_encode($work, JSON_UNESCAPED_SLASHES),
            ]);

            $saved++;
        }
    }

    $message = "OpenAlex sync completed. Saved/updated {$saved} relevant publications.";
    publications_log_sync($pdo, 'up', $message);

    return [
        'ok' => true,
        'status' => 'up',
        'message' => $message
    ];
}

function publications_get_last_cache_time(PDO $pdo): ?int {
    $stmt = $pdo->query("SELECT MAX(cached_at) AS latest FROM api_publications_cache");
    $row = $stmt->fetch();
    if (!$row || empty($row['latest'])) return null;
    $ts = strtotime((string)$row['latest']);
    return $ts !== false ? $ts : null;
}

function publications_get_last_sync_status(PDO $pdo): array {
    $stmt = $pdo->prepare("
        SELECT status, message, ran_at
        FROM publication_sync_status
        WHERE provider = ?
        ORDER BY ran_at DESC, id DESC
        LIMIT 1
    ");
    $stmt->execute([PUBLICATIONS_SYNC_PROVIDER]);
    $row = $stmt->fetch();

    if (!$row) {
        return [
            'status' => 'unknown',
            'message' => 'No sync has run yet.',
            'ran_at' => null
        ];
    }

    return [
        'status' => (string)$row['status'],
        'message' => (string)$row['message'],
        'ran_at' => (string)$row['ran_at']
    ];
}

function publications_ensure_cache(PDO $pdo): array {
    $lastCache = publications_get_last_cache_time($pdo);
    $isStale = !$lastCache || (time() - $lastCache) > PUBLICATIONS_CACHE_TTL_SECONDS;

    if (!$isStale) {
        return publications_get_last_sync_status($pdo);
    }

    try {
        $sync = publications_sync_openalex($pdo);
        return [
            'status' => $sync['status'],
            'message' => $sync['message'],
            'ran_at' => date('Y-m-d H:i:s')
        ];
    } catch (Throwable $e) {
        $message = 'OpenAlex sync failed. Serving cached publications instead. ' . $e->getMessage();
        publications_log_sync($pdo, 'down', $message);

        return [
            'status' => 'down',
            'message' => $message,
            'ran_at' => date('Y-m-d H:i:s')
        ];
    }
}

function publications_fetch_api_rows(PDO $pdo, string $search): array {
    $sql = "
        SELECT
            id,
            title,
            authors,
            journal,
            publication_year,
            publication_date,
            doi,
            origin_url,
            abstract_text,
            publication_type,
            source_name,
            cached_at
        FROM api_publications_cache
    ";

    $params = [];
    if ($search !== '') {
        $sql .= "
            WHERE
                title LIKE ?
                OR authors LIKE ?
                OR journal LIKE ?
                OR abstract_text LIKE ?
                OR doi LIKE ?
        ";
        $like = '%' . $search . '%';
        $params = [$like, $like, $like, $like, $like];
    }

    $sql .= " ORDER BY COALESCE(publication_date, CONCAT(publication_year, '-01-01')) DESC, id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll() ?: [];
    foreach ($rows as &$row) {
        $row['bucket'] = 'api';
        $row['display_source'] = 'OpenAlex';
        $row['submitted_by_me'] = false;
    }
    return $rows;
}

function publications_fetch_user_rows(PDO $pdo, string $search, string $sourceMode): array {
    $mineOnly = ($sourceMode === 'mine');

    if ($mineOnly && !isLoggedIn()) {
        return [];
    }

    $sql = "
        SELECT
            up.id,
            up.user_id,
            up.title,
            up.authors,
            up.journal,
            up.publication_year,
            up.publication_date,
            up.doi,
            up.origin_url,
            up.abstract_text,
            up.publication_type,
            up.created_at,
            u.first_name,
            u.last_name
        FROM user_publications up
        LEFT JOIN users u ON u.id = up.user_id
    ";

    $clauses = [];
    $params = [];

    if ($mineOnly) {
        $clauses[] = "up.user_id = ?";
        $params[] = (int)$_SESSION['user_id'];
    }

    if ($search !== '') {
        $clauses[] = "(
            up.title LIKE ?
            OR up.authors LIKE ?
            OR up.journal LIKE ?
            OR up.abstract_text LIKE ?
            OR up.doi LIKE ?
        )";
        $like = '%' . $search . '%';
        array_push($params, $like, $like, $like, $like, $like);
    }

    if (!empty($clauses)) {
        $sql .= " WHERE " . implode(" AND ", $clauses);
    }

    $sql .= " ORDER BY COALESCE(up.publication_date, CONCAT(up.publication_year, '-01-01')) DESC, up.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll() ?: [];
    foreach ($rows as &$row) {
        $fullName = trim(((string)($row['first_name'] ?? '')) . ' ' . ((string)($row['last_name'] ?? '')));
        $row['bucket'] = 'user';
        $row['source_name'] = 'User Submission';
        $row['display_source'] = $fullName !== '' ? 'User Submission • ' . $fullName : 'User Submission';
        $row['submitted_by_me'] = isLoggedIn() && ((int)$row['user_id'] === (int)$_SESSION['user_id']);
    }
    return $rows;
}

function publications_sort_rows(array &$rows): void {
    usort($rows, function ($a, $b) {
        $dateA = $a['publication_date'] ?: (($a['publication_year'] ?? '') ? ($a['publication_year'] . '-01-01') : '1900-01-01');
        $dateB = $b['publication_date'] ?: (($b['publication_year'] ?? '') ? ($b['publication_year'] . '-01-01') : '1900-01-01');
        return strcmp($dateB, $dateA);
    });
}

function publications_handle_list(): void {
    $pdo = db();

    $search = trim((string)($_GET['q'] ?? ''));
    $source = trim((string)($_GET['source'] ?? 'all'));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);

    if (!in_array($source, ['all', 'api', 'user', 'mine'], true)) {
        $source = 'all';
    }

    if (!in_array($perPage, [10, 20, 30, 40, 50], true)) {
        $perPage = 10;
    }

    $syncStatus = publications_ensure_cache($pdo);

    $rows = [];
    if ($source === 'all' || $source === 'api') {
        $rows = array_merge($rows, publications_fetch_api_rows($pdo, $search));
    }
    if ($source === 'all' || $source === 'user' || $source === 'mine') {
        $rows = array_merge($rows, publications_fetch_user_rows($pdo, $search, $source));
    }

    publications_sort_rows($rows);

    $total = count($rows);
    $totalPages = max(1, (int)ceil($total / $perPage));
    if ($page > $totalPages) $page = $totalPages;

    $offset = ($page - 1) * $perPage;
    $items = array_slice($rows, $offset, $perPage);

    publications_json([
        'ok' => true,
        'items' => array_values($items),
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
        ],
        'apiStatus' => $syncStatus,
        'isLoggedIn' => isLoggedIn(),
    ]);
}

function publications_handle_submit(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        publications_json(['ok' => false, 'error' => 'POST required'], 405);
    }

    if (!isLoggedIn()) {
        publications_json(['ok' => false, 'error' => 'You must be logged in to upload a publication.'], 401);
    }

    $payload = json_decode((string)file_get_contents('php://input'), true) ?? [];

    $title = trim((string)($payload['title'] ?? ''));
    $authors = trim((string)($payload['authors'] ?? ''));
    $journal = trim((string)($payload['journal'] ?? ''));
    $publicationYear = trim((string)($payload['publication_year'] ?? ''));
    $publicationDate = trim((string)($payload['publication_date'] ?? ''));
    $doi = trim((string)($payload['doi'] ?? ''));
    $originUrl = trim((string)($payload['origin_url'] ?? ''));
    $abstractText = trim((string)($payload['abstract_text'] ?? ''));
    $publicationType = trim((string)($payload['publication_type'] ?? ''));

    if ($title === '' || $authors === '') {
        publications_json(['ok' => false, 'error' => 'Title and authors are required.'], 400);
    }

    if ($publicationYear !== '' && !preg_match('/^\d{4}$/', $publicationYear)) {
        publications_json(['ok' => false, 'error' => 'Publication year must be a 4-digit year.'], 400);
    }

    if ($publicationDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $publicationDate)) {
        publications_json(['ok' => false, 'error' => 'Publication date must be YYYY-MM-DD.'], 400);
    }

    if ($originUrl !== '' && !filter_var($originUrl, FILTER_VALIDATE_URL)) {
        publications_json(['ok' => false, 'error' => 'Origin URL must be a valid URL.'], 400);
    }

    $pdo = db();
    $stmt = $pdo->prepare("
        INSERT INTO user_publications (
            user_id, title, authors, journal,
            publication_year, publication_date, doi, origin_url,
            abstract_text, publication_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        (int)$_SESSION['user_id'],
        $title,
        $authors,
        $journal,
        $publicationYear !== '' ? (int)$publicationYear : null,
        $publicationDate !== '' ? $publicationDate : null,
        $doi,
        $originUrl,
        $abstractText,
        $publicationType,
    ]);

    publications_json([
        'ok' => true,
        'message' => 'Publication uploaded successfully.'
    ]);
}

$route = $_GET['r'] ?? '';

if ($route === 'publications-list') {
    publications_handle_list();
}

if ($route === 'publications-submit') {
    publications_handle_submit();
}

publications_json(['ok' => false, 'error' => 'Invalid publications route.'], 400);