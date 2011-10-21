var sys = require('util'),
	fs = require('fs'),

	file = process.argv[2],
	m_compiler,
	compiler;

if (!file)
{
	sys.print("filepath must be given\n");
	return;
}

/**
 * Check file type
 */
if (file.match(/^locales\//))
{
	/**
	 * That's a locale file
	 */
	try
	{
		m_compiler = require('./l10n/compiler');
		compiler = new m_compiler.L10nCompiler({
			file: file
		});

		sys.print(
			compiler.parse()
		);
		return;
	}
	catch (e)
	{
		sys.print(e);
		throw e;
	}
}
else if (file.match(/^views\//))
{
	/**
	 * That's a templated file
	 */
	try
	{
		m_compiler = require('./templates/compiler');
		compiler = new m_compiler.TemplateCompiler({
			file: file
		});

		sys.print(
			compiler.parse()
		);
		return;
	}
	catch (e)
	{
		sys.print(e);
		throw e;
	}
}
else
{
	/**
	 * That's a simple js file, return it as it
	 */
	sys.print(
		fs.readFileSync(
			fs.realpathSync(__dirname+'/../../../')+'/'+file
		).toString()
	);
}
