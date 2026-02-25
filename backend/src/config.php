<?php
declare(strict_types=1);

return [
	'db_host' => getenv('DB_HOST') ?: 'localhost',
	'db_name' => getenv('DB_NAME') ?: 'cse442_2026_spring_team_c_db',
	'db_user' => getenv('DB_USER') ?: 'nbpratt',
	'db_pass' => getenv('DB_PASS') ?: '50448176',
];
