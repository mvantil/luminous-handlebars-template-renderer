var Handlebars = require('handlebars'),
	_ = require('underscore'),
	async = require('async');

var handlebarsCallbackInfo;

Handlebars.registerHelper('array', function(object, index) {
	return new Handlebars.SafeString(object[index]);
});

Handlebars.registerHelper('render', function(metadata) {
	var options = _.first(_.rest(arguments), arguments.length - 2);
	var callbackIndex = handlebarsCallbackInfo.length;
	handlebarsCallbackInfo.push({
		metadata: metadata,
		options: options
	});
	return '{{array this ' + callbackIndex + '}}';
});

function TemplateRenderer(templateBody) {
	var _compiled = Handlebars.compile(templateBody);

	function updateOptions(options, updateArray) {
		_.each(updateArray, function(update) {
			var parts = update.split(':');
			options[parts[0]] = parts[1];
		});
	}

	this.render = function(object, options) {
		handlebarsCallbackInfo = [];

		var finalObject = _.clone(object);
		for(var i in options.templateOptions) finalObject[i] = options.templateOptions[i] ;

		var firstPassTemplate = _compiled(finalObject);

		var callbackInfo = handlebarsCallbackInfo;
		handlebarsCallbackInfo = null;
		async.map(callbackInfo, function(item, callback) {
			var templateOptions = _.clone(options.templateOptions);
			updateOptions(templateOptions, item.options);
			options.render(item.metadata, templateOptions, callback);
		}, function(err, results) {
			var result = Handlebars.compile(firstPassTemplate)(results);
			options.done(null, result);
		});

		return firstPassTemplate;
	};
}

module.exports = TemplateRenderer;