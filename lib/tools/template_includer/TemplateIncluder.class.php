<?php

define ('APP_PATH', realpath(dirname(__FILE__) . '/../../../') . '/');

/**
* TemplateIncluder
*/
class TemplateIncluder
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
	 * Parse the js file and replace text with html templates
	 *
	 * @return string
	 * @author Hadrien Lanneau (hadrien dot lanneau at wikiogroup dot com)
	 **/
	public function parse()
	{
		if (preg_match_all(
				'/\{\$(.*?)\}/',
				$this->_file_content,
				$m
			))
		{
			foreach ($m[1] as $k => $v)
			{
				$this->_file_content = str_replace(
					$m[0][$k],
					$this->_getTemplate($v),
					$this->_file_content
				);
			}
		}

		return $this->_file_content;
	}

	/**
	 * Get template and format it for js
	 *
	 * @return string
	 * @author Hadrien Lanneau (hadrien dot lanneau at wikiogroup dot com)
	 **/
	private function _getTemplate($file)
	{
		if (preg_match(
				'/(subviews)|(widgets)$/',
				realpath(dirname(APP_PATH . $this->_file))
			))
		{
			$tpl_path = realpath(dirname(APP_PATH . $this->_file) . '/../templates/');
		}
		else
		{
			$tpl_path = realpath(dirname(APP_PATH . $this->_file) . '/templates/');
		}
		$file = $tpl_path . '/' . $file . '.html';

		$compiled = file_get_contents(
			$file
		);

		/**
		 * Compilation
		 */

		/**
		 * Return as a javascript array joined
		 */
		$compiled = "['" . implode(
			"',\n'",
			explode(
				"\n",
				trim(addslashes($compiled))
			)
		) . "'].join('')";


		/**
		 * Replace {@key@} by localize function
		 */
		preg_match_all(
			'/\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/',
			$compiled,
			$m
		);
		foreach ($m[0] as $k => $gra)
		{
			$compiled = str_replace(
				$m[0][$k],
				"',__('" . $m[1][$k] . "', " . ($m[2][$k] ? stripslashes($m[2][$k]) : 'null') . ", true),'",
				$compiled
			);
		}

		return $compiled;
	}
}
