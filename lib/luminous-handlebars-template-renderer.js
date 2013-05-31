var Handlebars = require('handlebars'),
	_ = require('underscore'),
	async = require('async');

var handlebarsCallbackInfo;

Handlebars.registerHelper('array', function(object, index) {
	return new Handlebars.SafeString(object[index]);
});

Handlebars.registerHelper('render', function(metadata) {
	if (!metadata) return '';

	var options = _.first(_.rest(arguments), arguments.length - 2);
	var callbackIndex = handlebarsCallbackInfo.length;
	handlebarsCallbackInfo.push({
		metadata: metadata,
		options: options,
		renderFn: arguments[2].fn
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
		if (!options || !options.done) throw new Error('done handler not supplied to TemplateRenderer.render');

		if (!object) return options.done(new Error('Missing object to render for TemplateRenderer.render'));

		handlebarsCallbackInfo = [];

		var finalObject = _.clone(object);
		for(var i in options.templateOptions) finalObject[i] = options.templateOptions[i] ;

		var firstPassTemplate = _compiled(finalObject);

		if (options.templateOptions && options.templateOptions.renderFn) {
			finalObject.output = firstPassTemplate;
			firstPassTemplate = options.templateOptions.renderFn(finalObject);
		}

		var callbackInfo = handlebarsCallbackInfo;
		handlebarsCallbackInfo = null;
		async.map(callbackInfo, function(item, callback) {
			var templateOptions = _.clone(options.templateOptions) || {};
			templateOptions.renderFn = item.renderFn;
			updateOptions(templateOptions, item.options);

			options.render(item.metadata, templateOptions, callback);
		}, function(err, results) {
			if (err) return options.done(err);

			var result = Handlebars.compile(firstPassTemplate)(results);
			options.done(null, result);
		});

		return firstPassTemplate;
	};
}

module.exports = TemplateRenderer;