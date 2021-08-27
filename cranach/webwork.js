function updateMathQuill(el) {
	
	var MQ = MathQuill.getInterface(2);
	var answerQuills = {};

	// Avoid conflicts with bootstrap.
	// $.widget.bridge('uitooltip', $.ui.tooltip);

	$(el).find("[id^=MaThQuIlL_]").each(function() {
		var answerLabel = this.id.replace(/^MaThQuIlL_/, "");
		var input = $(el).find("#" + answerLabel);
		var inputType = input.attr('type');
		if (typeof(inputType) != 'string' || inputType.toLowerCase() !== "text" || !input.hasClass('codeshard')) return;

		var answerQuill = $("<span id='mq-answer-" + answerLabel + "'></span>");
		answerQuill.input = input;
		input.addClass('mq-edit');
		answerQuill.latexInput = $(this);

		input.after(answerQuill);

		// Default options.
		var cfgOptions = {
			spaceBehavesLikeTab: true,
			leftRightIntoCmdGoes: 'up',
			restrictMismatchedBrackets: true,
			sumStartsWithNEquals: true,
			supSubsRequireOperand: true,
			autoCommands: 'pi sqrt root vert inf union abs',
			rootsAreExponents: true,
			maxDepth: 10
		};

		// Merge options that are set by the problem.
		var optOverrides = answerQuill.latexInput.data("mq-opts");
		if (typeof(optOverrides) == 'object') $.extend(cfgOptions, optOverrides);

		// This is after the option merge to prevent handlers from being overridden.
		cfgOptions.handlers = {
			edit: function(mq) {
				if (mq.text() !== "") {
					answerQuill.input.val(mq.text().trim());
					answerQuill.latexInput
						.val(mq.latex().replace(/^(?:\\\s)*(.*?)(?:\\\s)*$/, '$1'));
				} else {
					answerQuill.input.val('');
					answerQuill.latexInput.val('');
				}
			},
			// Disable the toolbar when a text block is entered.
			textBlockEnter: function() {
				if (answerQuill.toolbar)
					answerQuill.toolbar.find("button").prop("disabled", true);
			},
			// Re-enable the toolbar when a text block is exited.
			textBlockExit: function() {
				if (answerQuill.toolbar)
					answerQuill.toolbar.find("button").prop("disabled", false);
			}
		};

		answerQuill.mathField = MQ.MathField(answerQuill[0], cfgOptions);

		answerQuill.textarea = answerQuill.find("textarea");

		answerQuill.hasFocus = false;

		answerQuill.buttons = [
			{ id: 'frac', latex: '/', tooltip: 'fraction (/)', icon: '\\frac{\\text{\ \ }}{\\text{\ \ }}' },
			{ id: 'abs', latex: '|', tooltip: 'absolute value (|)', icon: '|\\text{\ \ }|' },
			{ id: 'sqrt', latex: '\\sqrt', tooltip: 'square root (sqrt)', icon: '\\sqrt{\\text{\ \ }}' },
			{ id: 'nthroot', latex: '\\root', tooltip: 'nth root (root)', icon: '\\sqrt[\\text{\ \ }]{\\text{\ \ }}' },
			{ id: 'exponent', latex: '^', tooltip: 'exponent (^)', icon: '\\text{\ \ }^\\text{\ \ }' },
			{ id: 'infty', latex: '\\infty', tooltip: 'infinity (inf)', icon: '\\infty' },
			{ id: 'pi', latex: '\\pi', tooltip: 'pi (pi)', icon: '\\pi' },
			{ id: 'vert', latex: '\\vert', tooltip: 'such that (vert)', icon: '|' },
			{ id: 'cup', latex: '\\cup', tooltip: 'union (union)', icon: '\\cup' },
			// { id: 'leq', latex: '\\leq', tooltip: 'less than or equal (<=)', icon: '\\leq' },
			// { id: 'geq', latex: '\\geq', tooltip: 'greater than or equal (>=)', icon: '\\geq' },
			{ id: 'text', latex: '\\text', tooltip: 'text mode (")', icon: 'Tt' }
		];

		// Open the toolbar when the mathquill answer box gains focus.
		answerQuill.textarea.on('focusin', function() {
			answerQuill.hasFocus = true;
			// if (answerQuill.toolbar) return;
			// answerQuill.toolbar = $("<div class='quill-toolbar'>" +
			// 	answerQuill.buttons.reduce(
			// 		function(returnString, curButton) {
			// 			return returnString +
			// 				"<button id='" + curButton.id + "-" + answerQuill.attr('id') +
			// 				"' class='symbol-button btn' " +
			// 				"' data-latex='" + curButton.latex +
			// 				"' data-tooltip='" + curButton.tooltip + "'>" +
			// 				"<span id='icon-" + curButton.id + "-" + answerQuill.attr('id') + "'>"
			// 				+ curButton.icon +
			// 				"</span>" +
			// 				"</button>";
			// 		}, ""
			// 	) + "</div>");
			// answerQuill.toolbar.appendTo($(el));
			// 
			// answerQuill.toolbar.find(".symbol-button").each(function() {
			// 	MQ.StaticMath($("#icon-" + this.id)[0]);
			// });

			// $(el).find(".symbol-button").uitooltip( {
			// 	items: "[data-tooltip]",
			// 	position: {my: "right center", at: "left-5px center"},
			// 	show: {delay: 500, effect: "none"},
			// 	hide: {delay: 0, effect: "none"},
			// 	content: function() {
			// 		var element = $(this);
			// 		if (element.prop("disabled")) return;
			// 		if (element.is("[data-tooltip]")) { return element.attr("data-tooltip"); }
			// 	}
			// });

			$(el).find(".symbol-button").on("click", function() {
				answerQuill.hasFocus = true;
				answerQuill.mathField.cmd(this.getAttribute("data-latex"));
				answerQuill.textarea.focus();
			});
		});

		answerQuill.textarea.on('focusout', function() {
			answerQuill.hasFocus = false;
			setTimeout(function() {
				if (!answerQuill.hasFocus && answerQuill.toolbar)
				{
					answerQuill.toolbar.remove();
					delete answerQuill.toolbar;
				}
			}, 200);
		});

		// Trigger an answer preview when the enter key is pressed in an answer box.
		answerQuill.on('keypress.preview', function(e) {
			if (e.key == 'Enter' || e.which == 13 || e.keyCode == 13) {
				// For homework
				$("#previewAnswers_id").trigger('click');
				// For gateway quizzes
				$("input[name=previewAnswers]").trigger('click');
			}
		});

		answerQuill.mathField.latex(answerQuill.latexInput.val());
		answerQuill.mathField.moveToLeftEnd();
		answerQuill.mathField.blur();

		// Give the mathquill answer box the correct/incorrect colors.
		setTimeout(function() {
			if (answerQuill.input.hasClass('correct')) answerQuill.addClass('correct');
			else if (answerQuill.input.hasClass('incorrect')) answerQuill.addClass('incorrect');
		}, 300);

		// Replace the result table correct/incorrect javascript that gives focus
		// to the original input, with javascript that gives focus to the mathquill
		// answer box.
		// var resultsTableRows = jQuery("table.attemptResults tr:not(:first-child)");
		// if (resultsTableRows.length)
		// {
		// 	resultsTableRows.each(function()
		// 		{
		// 			var result = $(this).find("td > a");
		// 			var href = result.attr('href');
		// 			if (result.length && href !== undefined && href.indexOf(answerLabel) != -1)
		// 			{
		// 				// Set focus to the mathquill answer box if the correct/incorrect link is clicked.
		// 				result.attr('href',
		// 					"javascript:void(window.answerQuills['" + answerLabel + "'].textarea.focus())");
		// 			}
		// 		}
		// 	);
		// }

		answerQuills[answerLabel] = answerQuill;
	});	
}

function updateWeBWorK(slide) {
	$(slide).find('.webwork').each(function() {
		if ($(this).hasClass('rendered')) {
			return 1;
		}
		$(this).find('.ww_credit').html('<small>powered by <a target="_blank" href="https://libretexts.org/">LibreTexts</a></small>');
	   let problemSeed = $(this).attr('problemSeed') ? $(this).attr('problemSeed') : Math.floor(Math.random() * 10000);
		$(this).attr('problemSeed', problemSeed);
		let data = {
			problemSeed : problemSeed,
			courseID : 'anonymous',
			userID : 'anonymous',
			course_password : 'anonymous',
			displayMode : 'MathJax',
			outputformat : 'json',
			sourceFilePath : $(this).attr('pg_file'),
		};
		// let data = {
		// 	problemSeed : problemSeed,
		// 	courseID : 'daemon',
		// 	userID : 'daemon',
		// 	course_password : 'daemon',
		// 	displayMode : 'MathJax',
		// 	outputformat : 'json',
		// 	sourceFilePath : $(this).attr('pg_file'),
		// };
		let el = this;
		console.log(data);
		$.ajax({
			// url: 'http://localhost/webwork2/html2xml',
			url: 'https://webwork.libretexts.org/webwork2/html2xml',
			data: data,
		}).done(function(result) {
			$(el).find('.ww').first().html(result['body_part530'] + result['body_part550'] + result['body_part590']);
			typeset([el]);
			let doc = MathJax.startup.document;
			for (const node of el.querySelectorAll('script[type^="math/tex"]')) {
		        const display = !!node.type.match(/; *mode=display/);
		        const math = new doc.options.MathItem(node.textContent, doc.inputJax[0], display);
		        const text = document.createTextNode('');
		        node.parentNode.replaceChild(text, node);
		        math.start = {node: text, delim: '', n: 0};
		        math.end = {node: text, delim: '', n: 0};
		        doc.math.push(math);					
		    }
			updateMathQuill(el);
			$(el).addClass('rendered');			
			$(el).find('.check_answer').off();
			$(el).find('.check_answer').click(function() {
				let submitData = {
					answersSubmitted : 1,
					WWsubmit : 1,
					preview : 1,
					...data,
				};
				$(el).find('input, select').each(function() {
					if($(this).attr('name').match(/AnSwEr/g)) {
						submitData[$(this).attr('name')] = $(this).val();
					}
				});
				$.ajax({
					url: 'http://localhost/webwork2/html2xml',
					data: submitData,
				}).done(function(result) {
					console.log(result);
					$(el).find('.results').first().html(result['body_part300']);
					$(el).find('.results').find('table').addClass('table table-striped table-light');
					$(el).find('.score').text(result['score']);
					typeset([el]);
					$(el).find('.ResultsWithError').addClass('text-danger');
					$(el).find('.ResultsWithoutError').addClass('text-success');
					$(el).find('.results').first()[0].scrollIntoView();
				});
			});
		});
	});
}

function updateWeBWorKCarousel() {
	updateWeBWorK($('.output.present:visible div.slide.active').first()[0]);
	
	$('.carousel').on('slid.bs.carousel', function () {
		let $slide = $('.output.present:visible div.slide.active').first();
		updateWeBWorK($slide[0]);
	});
}