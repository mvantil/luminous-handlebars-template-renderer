var Luminous = require('Luminous');
var luminous = new Luminous();

describe("Luminous File jsdom Loader suite", function() {
	it("must be able to execute templates", function(done) {
		var renderer = new luminous.TemplateRenderer('{{testElement}}');
		renderer.render({
			testElement: 'expectedOutput'
		}, {
			done: function(err, result) {
				expect(result).toBe('expectedOutput');
				done();
			}
		})
	});

	it("must be able to render nested templates", function(done) {
		var renderer = new luminous.TemplateRenderer('{{render fields}}');
		var data = {
			fields: [{
				testElement: 'expectedOutput'
			}]
		};

		renderer.render(data, {
			templateOptions: 'templateOptions',
			render: function(fields, templateOptions, callback) {
				expect(templateOptions).toBe('templateOptions');
				expect(fields).toBe(data.fields);

				callback(null, '{{doNotParse}}');
			},
			done: function(err, result) {
				expect(result).toBe('{{doNotParse}}');
				done();
			}
		});
	});
});