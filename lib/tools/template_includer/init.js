var sys = require('sys'),

	file = process.argv[2],
	template_compiler = require('./template_compiler'),
	compiler;

if (!file)
{
	sys.print("filepath must be given\n");
	return;
}
try
{
	compiler = new template_compiler.TemplateCompiler({
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