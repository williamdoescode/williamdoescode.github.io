<?php
// Visitor pets API for the portfolio. No database: everything lives in data/.
//
//   data/pets.json            index of every pet, newest first
//   data/pets/{id}.json       one pet's record (name, species, signature)
//   data/pets/{id}*.png       its 32x32 painting (renamed on every edit)
//   data/private/             rate limits, edit tokens, and the admin token
//                             (never served)
//
//   GET  pets.php                               -> { pets: [...] }
//   POST pets.php {action:"create", ...}        -> { pet, token }
//   POST pets.php {action:"update", id, token, ...} -> { pet, token }
//   POST pets.php {action:"delete", id, token}  (admin only)
//
// "token" on create/update is the owner's edit token: the browser that made
// the pet keeps it and must send it back to edit. Only its hash is stored.
// Pets saved before edit tokens existed have none, so the first edit claims
// them (the site only offers that to the browser that created the pet).
//
// To enable deleting, put a long random string in data/private/admin-token.txt.

declare(strict_types=1);

const MAX_PETS = 1000;
const MAX_PER_HOUR = 3;
const MAX_PER_DAY = 8;
const MAX_EDITS_PER_HOUR = 20;
const MAX_NAME = 24;
const MAX_PNG_BYTES = 6000;
const MAX_STROKES = 60;
const MAX_POINTS = 800;
const SIGNATURE_W = 300;
const SIGNATURE_H = 100;

$data = __DIR__ . '/data';
$private = $data . '/private';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(int $status, string $message): never
{
    respond($status, ['error' => $message]);
}
function read_json(string $file, array $fallback = []): array
{
    $text = @file_get_contents($file);
    $value = $text === false ? null : json_decode($text, true);
    return is_array($value) ? $value : $fallback;
}
function write_json(string $file, array $value): void
{
    $temp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($temp, $json) !== false) {
        // The swap can fail for a moment while another program has the file
        // open (seen on Windows), so try a few times before giving up.
        for ($try = 0; $try < 5; $try++) {
            if (@rename($temp, $file)) {
                return;
            }
            usleep(60000);
        }
    }
    @unlink($temp);
    fail(500, 'Could not save. Please try again later.');
}

/** Checks what a visitor submitted; returns [species, name, png, strokes]. */
function validated(array $input): array
{
    $species = $input['species'] ?? '';
    if (!in_array($species, ['dog', 'cat'], true)) {
        fail(422, 'Pick a dog or a cat.');
    }

    $name = is_string($input['name'] ?? null) ? $input['name'] : '';
    $name = trim((string) preg_replace('/[\p{C}\p{Z}]+/u', ' ', $name));
    $length = preg_match_all('/./us', $name);
    if ($length < 1 || $length > MAX_NAME) {
        fail(422, 'Names are 1 to ' . MAX_NAME . ' characters.');
    }

    // The painting must be a real 32x32 PNG.
    $skin = is_string($input['skin'] ?? null) ? $input['skin'] : '';
    $prefix = 'data:image/png;base64,';
    if (!str_starts_with($skin, $prefix)) {
        fail(422, 'The painting is missing.');
    }
    $png = base64_decode(substr($skin, strlen($prefix)), true);
    if (
        $png === false ||
        strlen($png) < 45 ||
        strlen($png) > MAX_PNG_BYTES ||
        substr($png, 0, 8) !== "\x89PNG\r\n\x1a\n" ||
        substr($png, 12, 4) !== 'IHDR' ||
        unpack('N2', substr($png, 16, 8)) !== [1 => 32, 2 => 32]
    ) {
        fail(422, 'The painting must be a 32x32 PNG.');
    }
    // Where GD exists, redraw the image so only pixels survive.
    if (function_exists('imagecreatefromstring')) {
        $image = @imagecreatefromstring($png);
        if (!$image || imagesx($image) !== 32 || imagesy($image) !== 32) {
            fail(422, 'The painting must be a 32x32 PNG.');
        }
        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
    }

    // The signature is optional: a list of pen strokes [[[x, y], ...], ...].
    $strokes = [];
    $points = 0;
    $signature = $input['signature'] ?? [];
    if (!is_array($signature) || count($signature) > MAX_STROKES) {
        fail(422, 'That signature could not be read.');
    }
    foreach ($signature as $stroke) {
        if (!is_array($stroke)) {
            fail(422, 'That signature could not be read.');
        }
        $clean = [];
        foreach ($stroke as $point) {
            if (!is_array($point) || count($point) !== 2 || !is_numeric($point[0]) || !is_numeric($point[1])) {
                fail(422, 'That signature could not be read.');
            }
            $clean[] = [
                max(0, min(SIGNATURE_W, (int) round((float) $point[0]))),
                max(0, min(SIGNATURE_H, (int) round((float) $point[1]))),
            ];
        }
        if ($clean) {
            $strokes[] = $clean;
            $points += count($clean);
        }
    }
    if ($points > MAX_POINTS) {
        fail(422, 'That signature is too long.');
    }

    return [$species, $name, $png, $strokes];
}

/**
 * Rate limit by salted IP hash, so raw addresses are never stored.
 * Counts this request against $bucket and fails if the visitor is over.
 */
function limit(string $private, string $bucket, int $perHour, int $perDay): void
{
    $saltFile = $private . '/salt.txt';
    if (!is_file($saltFile)) {
        file_put_contents($saltFile, bin2hex(random_bytes(16)));
    }
    $who = $bucket . hash('sha256', file_get_contents($saltFile) . ($_SERVER['REMOTE_ADDR'] ?? ''));
    $now = time();
    $rates = [];
    foreach (read_json($private . '/rate.json') as $key => $times) {
        $recent = array_values(array_filter((array) $times, fn($t) => $t > $now - 86400));
        if ($recent) {
            $rates[$key] = $recent;
        }
    }
    $mine = $rates[$who] ?? [];
    $lastHour = count(array_filter($mine, fn($t) => $t > $now - 3600));
    if ($lastHour >= $perHour || count($mine) >= $perDay) {
        fail(429, 'That is a lot of pets! Please come back later.');
    }
    $rates[$who] = [...$mine, $now];
    write_json($private . '/rate.json', $rates);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method === 'GET') {
    respond(200, ['pets' => array_values(read_json($data . '/pets.json'))]);
}
if ($method !== 'POST') {
    fail(405, 'Method not allowed.');
}

// First write: create the folders and lock the private one away from the web.
if (!is_dir($private) && !@mkdir($private, 0755, true) && !is_dir($private)) {
    fail(500, 'The pet folder is not writable.');
}
if (!is_dir($data . '/pets')) {
    @mkdir($data . '/pets', 0755, true);
}
if (!is_file($private . '/.htaccess')) {
    file_put_contents($private . '/.htaccess', "Require all denied\n");
}
if (!is_file($data . '/.htaccess')) {
    file_put_contents(
        $data . '/.htaccess',
        "Options -Indexes\n<FilesMatch \"\\.(php\\d?|phtml|phar)$\">\n  Require all denied\n</FilesMatch>\n"
    );
}

$raw = file_get_contents('php://input', false, null, 0, 200000);
$input = json_decode($raw ?: '', true);
if (!is_array($input)) {
    fail(400, 'Bad request.');
}

// One request at a time touches the index.
$lock = fopen($private . '/lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) {
    fail(503, 'Busy. Please try again.');
}

$action = $input['action'] ?? 'create';
$index = $data . '/pets.json';
$tokensFile = $private . '/tokens.json'; // pet id => sha256 of its edit token
$id = (string) ($input['id'] ?? '');
$given = (string) ($input['token'] ?? '');
$skinFile = fn(array $pet) => preg_match('#^data/pets/[a-f0-9-]+\.png$#', $pet['skin'] ?? '')
    ? __DIR__ . '/' . $pet['skin']
    : null;

if ($action === 'delete' || $action === 'update') {
    if (!preg_match('/^[a-f0-9]{12}$/', $id)) {
        fail(400, 'Unknown pet.');
    }
}

if ($action === 'delete') {
    $token = trim((string) @file_get_contents($private . '/admin-token.txt'));
    if ($token === '' || !hash_equals($token, $given)) {
        fail(403, 'Not allowed.');
    }
    $pets = read_json($index);
    $kept = [];
    foreach ($pets as $pet) {
        if (($pet['id'] ?? '') !== $id) {
            $kept[] = $pet;
        } elseif ($file = $skinFile($pet)) {
            @unlink($file);
        }
    }
    write_json($index, $kept);
    @unlink("$data/pets/$id.json");
    $tokens = read_json($tokensFile);
    unset($tokens[$id]);
    write_json($tokensFile, $tokens);
    respond(200, ['deleted' => count($pets) - count($kept)]);
}

if ($action === 'update') {
    $pets = read_json($index);
    $at = null;
    foreach ($pets as $i => $pet) {
        if (($pet['id'] ?? '') === $id) {
            $at = $i;
        }
    }
    if ($at === null) {
        fail(404, 'That pet is no longer here.');
    }
    $tokens = read_json($tokensFile);
    if (isset($tokens[$id]) && !hash_equals($tokens[$id], hash('sha256', $given))) {
        fail(403, 'Only the visitor who made this pet can edit it.');
    }
    [$species, $name, $png, $strokes] = validated($input);
    limit($private, 'edit:', MAX_EDITS_PER_HOUR, MAX_EDITS_PER_HOUR * 3);

    // A new file name, because browsers cache the old painting for a year.
    $old = $skinFile($pets[$at]);
    $skin = "data/pets/$id-" . bin2hex(random_bytes(3)) . '.png';
    if (file_put_contents(__DIR__ . '/' . $skin, $png) === false) {
        fail(500, 'Could not save. Please try again later.');
    }
    $pet = array_merge($pets[$at], [
        'species' => $species,
        'name' => $name,
        'signature' => $strokes,
        'skin' => $skin,
        'updatedAt' => gmdate('c'),
    ]);
    $pets[$at] = $pet;
    write_json("$data/pets/$id.json", $pet);
    write_json($index, $pets);
    if ($old) {
        @unlink($old);
    }
    // A pet from before edit tokens is claimed now and gets one.
    if (!isset($tokens[$id])) {
        $given = bin2hex(random_bytes(16));
        $tokens[$id] = hash('sha256', $given);
        write_json($tokensFile, $tokens);
    }
    respond(200, ['pet' => $pet, 'token' => $given]);
}

if ($action !== 'create') {
    fail(400, 'Bad request.');
}

// Bots fill every field; people never see this one.
if (!empty($input['website'])) {
    fail(400, 'Bad request.');
}
[$species, $name, $png, $strokes] = validated($input);

$pets = read_json($index);
if (count($pets) >= MAX_PETS) {
    fail(507, 'The kennel is full right now.');
}
limit($private, '', MAX_PER_HOUR, MAX_PER_DAY);

$id = bin2hex(random_bytes(6));
$pet = [
    'id' => $id,
    'species' => $species,
    'name' => $name,
    'signature' => $strokes,
    'skin' => "data/pets/$id.png",
    'createdAt' => gmdate('c'),
];
if (file_put_contents("$data/pets/$id.png", $png) === false) {
    fail(500, 'Could not save. Please try again later.');
}
write_json("$data/pets/$id.json", $pet);
array_unshift($pets, $pet);
write_json($index, $pets);

$token = bin2hex(random_bytes(16));
$tokens = read_json($tokensFile);
$tokens[$id] = hash('sha256', $token);
write_json($tokensFile, $tokens);

respond(201, ['pet' => $pet, 'token' => $token]);
