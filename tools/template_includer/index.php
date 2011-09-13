<?php

header('Content-type: text/javascript');

include('TemplateIncluder.class.php');

try
{
	$tpli = new TemplateIncluder(
		$_SERVER['QUERY_STRING']
	);

	echo $tpli->parse();
}
catch (Exception $e)
{
	header ('HTTP/1.0 500 ' . $e->getMessage());
	echo $e->getMessage();
}
