<?php

define ('APP_PATH', realpath(dirname(__FILE__) . '/../../../') . '/');

/**
* LocaleCompiler
*/
class LocaleCompiler
{
	protected $_file;
	protected $_file_content;

	function __construct($file = null)
	{
		if (!$content = @file_get_contents(APP_PATH . $file))
		{
			throw new Exception('$file is an invalid path. Must be a valid javascript file.');
		}

		$this->_file = $file;
		$this->_file_content = $content;
	}

	/**
	 * Compile the locale file into a YUI 3 module javascript
	 *
	 * @return string
	 * @author Hadrien Lanneau (hadrien dot lanneau at wikiogroup dot com)
	 **/
	public function compile()
	{
		/**
		 * Get class template
		 */
		$tpl = file_get_contents('l10nJSClassTemplate.tpl');

		/**
		 * Get module name
		 */
		if (!preg_match(
				'/([^\/]+)\/([^\/]+)\.l10n/',
				$this->_file,
				$m
			))
		{
			throw new Exception('File is not a l10n locale file');
		}
		$locale = $m[1];
		$file = $m[2];
		$module = 'l10n_' . $locale . '_' . $file;

		/**
		 * Transform translations file into json
		 */
		$json = array();
		$lines = preg_split(
			'/\n/',
			$this->_file_content
		);
		foreach ($lines as $l)
		{
			if (preg_match(
					'/^(.*?)\s?=\s?(.*?)$/',
					$l,
					$kv
				))
			{
				$json[$kv[1]] = $kv[2];
			}
		}

		$compiled = str_replace(
			array(
				'{$module}',
				'{$locale}',
				'{$file}',
				'{$content}'
			),
			array(
				$module,
				$locale,
				$file,
				json_encode($json)
			),
			$tpl
		);

		return $compiled;
	}
}
