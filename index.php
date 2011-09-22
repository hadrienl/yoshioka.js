<?php

$index = file_get_contents(dirname(__FILE__).'/../index.html');
preg_match(
	'/(.*?)\/lib\/index\.php$/',
	$_SERVER['SCRIPT_NAME'],
	$m
);
$basepath = $m[1];

$index = str_replace(
	array(
		'{$basepath}'
	),
	array(
		$basepath
	),
	$index
);

echo $index;
die();
