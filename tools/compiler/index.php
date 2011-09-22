<?php

header('Content-type: text/javascript');

$nodescript = realpath(dirname(__FILE__)) . '/init.js';
$cmd = 'node '.$nodescript.' '.$_SERVER['QUERY_STRING'];
exec($cmd,$output,$status);

$response = implode("\n",$output);

if ($status !== 0)
{
	header ('HTTP/1.0 500 ' . $response);
}

echo $response;

exit();
