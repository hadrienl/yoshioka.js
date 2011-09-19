<?php

header('Content-type: text/javascript');

include('LocaleCompiler.class.php');

try
{
	$filepath = preg_replace(
		'/\.js$/',
		'',
		$_SERVER['QUERY_STRING']
	);
	$l10nfile = new LocaleCompiler(
		$filepath
	);

	echo $l10nfile->compile();
}
catch (Exception $e)
{
	header ('HTTP/1.0 500 ' . $e->getMessage());
	echo $e->getMessage();
}
