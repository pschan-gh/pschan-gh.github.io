const xh_prefix = '';
const xhtmlns = 'http://www.w3.org/1999/xhtml';

let chapterType = "Chapter";
let course = '';
let topic = '';
// let step = 0;

let secNums = {
	'chapter': 1,
	'section': 1,
	'subsection': 1,
	'subsubsection': 1,
	'statement': 1,
	'figure': 1,
	'slide': 1
}

const dictionary = {
	"thm": "Theorem",
	"prop": "Proposition",
	"lemma": "Lemma",
	"cor": "Corollary",
	"defn": "Definition",
	"claim": "Claim",
	"fact": "Fact",
	"remark": "Remark",
	"eg": "Example",
	"ex": "Exercise",
	"proof": "Proof",
	"ans": "Answer",
	"sol": "Solution",
	"notation": "Notation",
	"paragraphs": "Paragraphs",
	"col": "col",
	"newcol": "newcol"
};

const environs = [
	"statement",
	"substatement",
	"newcol",
	"col_ul",
	"col_ol",
	"enumerate",
	"itemize",
	"framebox",
	"center",
	"left",
	"right",
	"title",
	"figure",
	"steps",
	"nstep"
];

const htmlElements = /a|abbr|acronym|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|svg|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr|center|rect/;

const htmlOpenRe = /<([a-zA-Z][a-zA-Z0-9]*)(?:\s+([^>]*))?\s*(\/)?>\n*/i;
const htmlCloseRe = /<\/([a-zA-Z][a-zA-Z0-9]*)>/i;
const nested = /((?:(?:[^{}]*)|(?:{(?:(?:[^{}]*)|(?:{(?:(?:[^{}]*)|(?:{[^{}]*}))*}))*}))+)/;

const mainTokensRe = new RegExp(
	'(' + '<\\!\\-\\-' + ')' +           // Group 1: Comment open
	'|' +
	'(' + '\\-\\-\\>' + ')' +           // Group 2: Comment close
	'|' +
	'(' + '@@(\\w+)(?:{([^}]*)})?(\\[[^\\]]*\\])?' + ')' + // Group 3: atWord, 4: name, 5: nested, 6: bracket
	'|' +
	'(' + '@(?!md5|name)([a-zA-Z\\*]+)(?:{\\n*' + nested.source + '\\n*})?(\\[.*?\\])?' + ')' + // Group 7: Directive, 8: word, 9: nested, 10: bracket
	'|' +
	'(' + htmlOpenRe.source + ')' +     // Group 11: HTML open (12: tag, 13: attrs, 14: self-closing)
	'|' +
	'(' + htmlCloseRe.source + ')' +    // Group 15: HTML close (16: tag)
	'|' +
	'(' + '[ \\t]*(?:\\r*\\s*\\n\\s*){2,}[ \\t]*' + ')' + // Group 17: Newline (with optional spaces/tabs around it)
	'|' +
	'(' + '[ \\t]*((?!<\\/*(' + htmlElements.source + ')|@@\\w+|@(?!md5|name)|<\\!\\-\\-|\\-\\-\\>|(\\r*\\s*\\n\\s*){2,}).)+[ \\t]*' + ')' // Group 18: Text (19: content, no newlines)
	, 'gs'
);

const COUNTERED_TAGS = ["thm", "prop", "lemma", "cor", "defn", "claim", "fact", "remark", "eg", "ex", 'figure'];
const STATEMENT_TAGS = ["thm", "prop", "lemma", "cor", "defn", "claim", "fact", "remark", "eg", "ex"];
const SUBSTATEMENT_TAGS = ['proof', 'sol', 'ans', 'notation', 'remark'];
const verbatimTags = /^(script|textarea)$/i;
const createClosingTagRegex = tag => new RegExp(`</${tag}>`, 'i');
const sectionTypes = ['section', 'subsection', 'subsubsection'];
const chapterTypes = ['week', 'lecture', 'chapter'];
const STATEMENTLIKE_TAGS = ["thm", "prop", "lemma", "cor", "defn", "claim", "fact", "remark", "eg", "ex", 'proof', 'sol', 'ans', 'notation', 'remark', 'figure'];

const environmentTypes = {
	col: ['newcol', 'collapse', 'col'],
	html_list: ['ul', 'ol'],
	latex_list: ['enumerate', 'itemize', 'item'],
}

const environmentSelfClosing = {
	caption: {},
	image: {
		action: (_child, argument, options) => {
			let child = _child;
			child = child.addChild('image');
			child.node.setAttribute("data-src", argument);
			return child;
		}
	},
	webwork: {
		action: (_child, argument, options) => {
			let child = _child;
			child = child.addChild('webwork');
			child.node.setAttribute("pg_file", argument);
			return child;
		}
	},
	wiki: {
		action: (_child, argument, options) => {
			let child = _child;
			child = child.addChild('wiki');
			child.node.textContent += argument;
			return child;
		}
	},
	newline: {
		action: (_child, argument, options) => {
			let child = closeChildIfParagraph(_child);
			child = child.addChild('newline');
			return child;
		}
	},
	caption: {
		action: (_child, argument, options) => {
			let child = closeChildIfParagraph(_child);
			child = child.addChild('caption');
			child.node.textContent += argument;
			return child;
		}
	},
	qed: {
		action: (_child, argument, options) => {
			return _child.addChild('qed');
		}
	},
	endproof: {
		action: (_child, argument, options) => {
			return child = _child.addChild('qed');
		}
	},
	ref: {
		action: (_child, argument, options = null) => {
			let child = closeChildIfParagraph(_child);
			child = child.addChild('ref');
			child.node.setAttribute('label', argument);
			child.loadOptions(options);
			return child;
		}
	},
	href: {
		action: (_child, argument = null, options = null) => {
			let child = _child;
			child = child.addChild('href');
			child.node.setAttribute('src', argument);
			child.node.setAttribute('name', options ? (options.name ? options.name : argument) : argument);
			child.node.setAttribute('argument', argument);
			return child;
		}
	},
	keyword: {
		action: (_child, argument, options = null) => {
			let child = closeChildIfParagraph(_child);
			child = child.addChild('inline_keyword');
			child.node.textContent += argument;
			return child;
		}
	},
	paragraphs: {
		action: (_child, argument, options = null) => {
			let child = closeChildIfParagraph(_child);
			if (child.node.nodeName.match(/col_ul|col_ol/i)) {
				return child;
			}
			if (!child.node.nodeName.match(/PARAGRAPHS/i)) {
				if (child.node.nodeName.match(/root|course|chapter|section/i)) {
					child = child.addChild('slides').addChild('slide');
					child.node.setAttribute("canon_num", secNums['slide']);
					secNums['slide']++;
				}
				if (!child.node.nodeName.match(/nstep|step/i)) {
					// console.log(argument);
					child = child.addChild("paragraphs");
					child.node.setAttribute("wbtag", "paragraphs");
				}
			}
			// if (!child.node.nodeName.match(/nstep|step/i)) {
			// 	console.log(argument);
			// 	child = child.addChild("paragraphs");
			// 	child.node.setAttribute("wbtag", "paragraphs");
			// 	child.node.textContent += argument;
			// 	return child;
			// }
			// console.log('commiting to textnode');
			// console.log(argument);
			child.node.textContent += argument;
			return child;
		}
	}

};

const procedural = {
	topic: {
		action: (_child, argument, options) => {
			let child = _child;
			child = child.addChild('topic');
			child.node.setAttribute("wbtag", 'topic');
			let ancestorNode = child.getParent(/lecture|week|chapter|course/i);
			if (!ancestorNode.node.nodeName.match(/lecture|week|chapter|course/i)) {
				return;
			}
			let topics = ancestorNode.node.getAttribute('topic');
			if (typeof topics != typeof undefined && topics != null && topics != '') {
				ancestorNode.node.setAttribute('topic', topics + ', ' + argument);
			} else {
				ancestorNode.node.setAttribute('topic', argument);
			}
			let aux = ancestorNode.addChild("topic");
			aux.node.setAttribute('scope', 'chapter');
			aux.node.textContent += argument;
			aux = aux.close();
		}
	},
	nstep: {
		action: (_child, argument, options) => {
			let child = _child;
			let insert = '\\class{steps}{\\cssId{step' + child.step + '}{' + argument + '}}';
			child.step++;
			child.node.textContent += insert;
		}
	},
	of: {
		action: (_child, argument, options) => {
			let child = _child;
			let parent = child.closeTo(/substatement/i);
			parent.node.setAttribute("of", argument);
		}
	},
	label: {
		action: (_child, argument, options) => {
			let child = _child;
			let parent = child.closeTo(/statement|course|chapter|section|subsection|subsubsection|figure/i);
			let label = parent.addChild("label");
			label.node.setAttribute('wbtag', 'label');
			label.node.setAttribute('name', argument);
			label.node.setAttribute('type', parent.node.getAttribute('type'));
			label.close();
		}
	},
	'keyword*': {
		action: (_child, argument, options = null) => {
			let slide = _child.getParent(/slide/i);
			let kw = slide.addChild("hc_keyword");
			kw.node.setAttribute("wbtag", "hc_keyword");
			kw.node.setAttribute("class", "hidden");
			kw.node.textContent += argument;
			kw.close();
		}
	},
	skip: {
		action: (_child, argument = null, options = null) => {
			_child.node.setAttribute("data-lecture-skip", "true");
		}
	},
	chapter_type: {
		action: (_child, argument = null, options = null) => {
			let parent = _child.closeTo(/chapter/i);
			parent.node.setAttribute("chapter_type", argument);
			chapterType = argument;
		}
	},
}

const environmentOpenings = {
	slide: {
		action: (_child, tagname) => {
			let child = _child.closeTo(/SLIDES|section|chapter|course|root/i);
			if (!child.node.nodeName.match(/SLIDES/i)) {
				child = child.addChild('slides');
			}
			// child = child.addChild('slide');
			// child.node.setAttribute("wbtag", tagname);						
			return { node: child, name: tagname };
		},
		post: (_child) => {
			let child = _child
			child.node.setAttribute("canon_num", secNums['slide']++);
			return child;
		},
	},
	latex_list: {
		action: (_child, tagname) => {
			let child = closeChildIfParagraph(_child);
			return { node: child, name: tagname };
		}
	},
	col: {
		action: (_child, tagname) => {
			let tname = tagname;
			let child = closeChildIfParagraph(_child);
			if ((tagname == 'newcol') || (child.getEnvironment() != 'newcol')) {
				tname = 'newcol';
			} else {
				tname = 'collapse';
			}
			return { node: child, name: tname };
		}
	},
	html_list: {
		action: (child, tagname) => {
			let tname = `col_${tagname}`;
			// console.log(tname);
			return { node: child, name: tname };
		}
	},
	li: {
		action: (_child, tagname) => {
			let child = _child.closeTo(/col_ul|col_ol/i);
			let tname = `col_${tagname}`;
			return { node: child, name: tname };
		}
	},
	framebox: { action: null },
	center: { action: null },
	left: { action: null },
	right: {
		action: (_child, tagname) => {
			let child = _child;
			if (child.getEnvironment().match(/left/i)) {
				child = child.closeTo(/left/i).close();
			}
			return { node: child, name: tagname };
		}
	},
	steps: {
		action: (_child, tagname) => {
			let child = _child;
			child.stepsID++;
			step = 0;
			child = closeChildIfParagraph(child);
			return { node: child, name: tagname };
		},
		post: (_child) => {
			let child = _child;
			// console.log(child.stepsID);
			child.node.setAttribute("stepsid", 'steps' + child.stepsID);
			return child;
		},
	},
};

const environmentClosures = {
	endtitle: {
		targets: /title|slide/i,
		action: (child) => {
			if (!environs.includes(child.getEnvironment())) {
				return;
			}
			const parent = child.getParent(/statement|substatement|chapter|section|subsection|subsubsection/i);
			parent.node.setAttribute("title", child.node.textContent.replace(/[^a-zÀ-ÿ0-9\s\-\']/ig, '').trim());

			// const title = parent.addChild('title');
			// title.node.textContent = child.node.textContent;
			// title.close();
		}
	},
	endcol: { targets: /newcol|slide/i },
	endul: { targets: /col_ul|col_ol|slide/i },
	endol: { targets: /col_ol|col_ul|slide/i },
	endenumerate: { targets: /enumerate|slide/i },
	enditemize: { targets: /itemize|slide/i },
	endcenter: { targets: /center|slide/i },
	endfigure: { targets: /figure/i },
	endright: { targets: /right|slide/i },
	endleft: { targets: /left|slide/i },
	end: { targets: /statement|substatement|enumerate|itemize|center|left|right|slide|framebox|figure/i },
	endsteps: { targets: /steps/i },
};

const closeChildIfParagraph = (child) => {
	while (child.node.nodeName.match(/PARAGRAPHS/i)) { // changed if to while
		// console.log(child.node.nodeName);
		child = child.close();
	}
	return child;
};

const handleVerbatimNode = function (child, token) {
	const tokenValue = token.type == 'newline' ? "\n\n" :
		token.value || ''; // Ensure value exists
	// console.log(tokenValue);
	// console.log(child.node.nodeName);
	// Check for closing tag to exit verbatim mode
	if (createClosingTagRegex(child.node.nodeName).test(tokenValue)) {
		return child.close(); // Signal to handle closing tag normally
	}

	if (token.type == 'at_word') {
		child.node.textContent += '@' + token.tagname;
	} else {
		child.node.textContent += tokenValue;
	}
	return child; // Signal that token was handled
};

const handleHtmlToken = (child, token) => {
	if (token.type === 'html_open' || token.type === 'html_self_closing') {
		return weaveHtml(child, token);
	}

	if (token.type === 'html_close') {
		const tagName = token.tag.toLowerCase();
		// const prefixedTagRe = new RegExp(`${xh_prefix || ''}${tagName}`, 'i');
		const prefixedTagRe = new RegExp(`\\b${tagName}\\b`, 'i');
		console.log(prefixedTagRe);
		child = child.closeTo(prefixedTagRe);
		// console.log(`TAG CLOSED: ${tagName}`);
		child = child.close();
		return child;
	}

	// If not an HTML token, return unchanged (could be handled elsewhere)
	return child;
};

const processDirectiveToken = (token) => {
	let tagname = token.name || '';
	let argument = '';
	let options = null;

	if (token.type === 'directive') {
		if (token.nested.length > 0) {
			// Take the first nested content as argument (adjust if multiple needed)
			argument = token.nested[0].value.trim();
		}
		if (token.bracket) {
			const bracketContent = token.bracket.slice(1, -1).trim(); // Remove [ and ]
			try {
				// Attempt to parse as JSON, converting single quotes to double quotes
				options = JSON.parse('{' + bracketContent.replace(/'/g, '"') + '}');
			} catch (e) {
				// Fallback to a simple name object if JSON parsing fails
				options = { name: bracketContent };
			}
		}
	} else if (token.type === 'html_open') {
		options = token.attributes;
	}
	// console.log(tagname);
	tagname = tagname == 'sep' ? 'slide'
		: tagname == 'example' ? 'eg'
		: (tagname == 'definition') || (tagname == 'def') ? 'defn'
		: tagname == 'theorem' ? 'thm'
		: tagname == 'proprosition' ? 'prop'
		: tagname == 'corollary' ? 'cor'
		: tagname == 'solution' ? 'sol'
		: tagname;

	return { tagname, argument, options }; // Return structured result
};

const isSubstatement = (tagname) => SUBSTATEMENT_TAGS.some(tag =>
	typeof (tagname) === 'undefined' ? null :
		tagname.match(new RegExp(tag, 'i'))
);
const isStatement = (tagname) => STATEMENT_TAGS.some(tag =>
	typeof (tagname) === 'undefined' ? null :
		tagname.match(new RegExp(tag, 'i'))
);
const counteredTokenType = (tagname) => isSubstatement(tagname) ? 'substatement' :
	isStatement(tagname) ? 'statement' :
		tagname == 'figure' ? 'figure' : undefined;

const statementHandler = (child, token, tagname) => {
	const statementType = counteredTokenType(tagname);

	if (typeof (statementType) === undefined) { return; }
	// console.log(token);
	child = closeChildIfParagraph(child);
	parent = child;
	child = parent.addChild(statementType);

	child.node.setAttribute('type', dictionary[tagname.toLowerCase().trim()]);
	child.node.setAttribute('wbtag', tagname);

	if (!isSubstatement(tagname)) {
		child.node.setAttribute('num', secNums[counteredTokenType(tagname)]++);
	}
	return child;
}

function tokenizeAndProcess(input) {
	const tokens = [];
	let match;
	while ((match = mainTokensRe.exec(input)) !== null) {
		const [
			fullMatch,
			commentOpen,       // 1
			commentClose,      // 2
			atWord,           // 3
			atWordName,		// 4
			atWordNested,	// 5
			atWordBracket,	// 6
			directiveFull,     // 7
			directiveWord,     // 8
			nestedContent,     // 9
			directiveBracket,    // 10
			htmlOpenFull,      // 11
			tagNameOpen,       // 12
			attributes,        // 13
			selfClosing,       // 14
			htmlCloseFull,     // 15
			tagNameClose,      // 16
			newline,		// 17
			plainTextFull,     // 18
			plainText          // 19
		] = match;
		// console.log(match);

		if (commentOpen) {
			tokens.push({ type: 'comment_open', value: commentOpen });
		}
		else if (commentClose) {
			tokens.push({ type: 'comment_close', value: commentClose });
		}
		else if (atWord) {
			tokens.push({
				type: 'at_word',
				name: 'escaped',           // Captured word after @@				
				tagname: atWordName,
				value: atWord,	           // Full match for reference
			});
		}
		else if (directiveFull) {
			const parsedNested = nestedContent ? parseNestedBraces(nestedContent) : [];
			tokens.push({
				type: 'directive',
				name: directiveWord,
				nested: parsedNested,
				bracket: directiveBracket || null,
				value: directiveFull
			});
		}
		else if (htmlOpenFull) {
			tokens.push({
				type: selfClosing ? 'html_self_closing' : 'html_open',
				tag: tagNameOpen,
				attributes: attributes ? parseAttributes(attributes) : {},
				value: htmlOpenFull,
				// attributes: attributes
			});
		}
		else if (htmlCloseFull) {
			tokens.push({
				type: 'html_close',
				tag: tagNameClose,
				value: htmlCloseFull
			});
		}
		else if (newline) {
			tokens.push({ type: 'newline', value: '@newline' });
		}
		else if (plainTextFull) {
			tokens.push({ type: 'text', value: plainTextFull });
		}
	}

	return tokens;
}

function parseNestedBraces(content) {
	let stack = [];
	let current = '';
	let results = [{ type: 'nested', value: content }];

	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		if (char === '{') {
			stack.push(i);
			current += char;
		}
		else if (char === '}') {
			if (stack.length === 0) {
				results.push({ type: 'error', value: 'Unmatched closing brace' });
				return results;
			}
			stack.pop();
			current += char;
			if (stack.length === 0) {
				results.push({ type: 'nested', value: current });
				current = '';
			}
		}
		else if (stack.length > 0 || char) {
			current += char;
		}
	}

	if (stack.length > 0) {
		results.push({ type: 'error', value: 'Unmatched opening brace' });
	}
	else if (current.trim()) {
		results.push({ type: 'text', value: current });
	}

	return results;
}

function parseAttributes(attributeString) {
	const attributes = {};

	// Return empty object if string is empty or not provided
	if (!attributeString || typeof attributeString !== 'string') {
		return attributes;
	}

	// Split the string into individual attribute assignments
	// This regex handles spaces and maintains quoted values
	const attrArray = attributeString.match(/([^\s=]+)=(?:"([^"]*)"|'([^']*)'|([^>\s]*))/g) || [];

	attrArray.forEach(attr => {
		// Split each attribute into name and value
		const [name, ...valueParts] = attr.split('=');
		let value = valueParts.join('=').replace(/^"|"$/g, '').replace(/^'|'$/g, '');

		// Handle boolean attributes (if value is empty, set to true)
		if (value === '' && attributeString.includes(`${name} `) || attributeString.trim() === name) {
			value = true;
		}

		attributes[name] = value;
	});

	return attributes;
}

function weaveHtml(child, token) {
	const tagName = token.tag;
	const parameters = typeof (token.attributes) === 'undefined' ? '' : token.attributes;
	const isSelfClosing = token.value.trim().endsWith('/>') ||
		['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
			.includes(tagName);
	const wrappingTags = {
		li: [/ol|ul/i, `<ul><li ${parameters}></li></ul>`],
		tr: [/tbody|table/i, `<table><tr ${parameters}></tr></table>`],
		td: [/tr/i, `<table><tr><td ${parameters}></td></tr></table>`],
		th: [/tr/i, `<table><tr><th ${parameters}></th></tr></table>`],
		tbody: [/table/i, `<table><tbody ${parameters}></tbody></table>`],
		thead: [/table/i, `<table><thead ${parameters}></thead></table>`],
	};

	let node;
	if (wrappingTags[tagName]) {
		const [closeToPattern, domTemplate] = wrappingTags[tagName];
		child = child.closeTo(closeToPattern); // Close up to matching parent
	}

	if ((['svg', 'rect'].includes(tagName))) {
		child = child.addChild(tagName, nsResolver('svg'));
	} else {
		child = child.addChild(tagName, nsResolver('xh'));
	}
	
	if (parameters) {
		Object.entries(parameters).forEach(([name, value]) => {
			// Convert boolean true to empty string (HTML convention for boolean attributes)
			if (value === true) {
				child.node.setAttribute(name, '');
			} else {
				child.node.setAttribute(name, value);
			}
		});
	}

	// Close self-closing tags immediately
	if (isSelfClosing) {
		child = child.close();
	}

	return child;
}

function addSection(sectionType, _title, child, options) {
	
	let stackName = ['lecture', 'week'].includes(sectionType) ? 'chapter' : sectionType;
	chapterType = sectionType == 'week' ? 'Week' : sectionType == 'Lecture' ? 'Lecture' : '';

	switch (sectionType) {
		case 'subsubsection':
			child = child.closeTo(RegExp('^(subsection|section|chapter|course|root)$', 'i'));
			if (!(child.node.nodeName.match(/^subsection$/i))) {
				child = addSection('subsection', '', child, options).closeTo(RegExp('^subsection$', 'i'));
			}
			break;
		case 'subsection':
			child = child.closeTo(RegExp('^(section|chapter|course|root)$', 'i'));
			if (!(child.node.nodeName.match(/^section$/i))) {
				child = addSection('section', '', child, options).closeTo(RegExp('^section$', 'i'));
			}
			break;
		case 'section':
			child = child.closeTo(RegExp('^(chapter|course|root)$', 'i'));
			if (!(child.node.nodeName.match(/^chapter$/i))) {
				child = addSection('chapter', '', child, options).closeTo(RegExp('^chapter$', 'i'));
			}
			break;
		case 'week':
			// chapterType = 'Week';
		case 'lecture':
			// chapterType = 'Lecture';
		case 'chapter':
			child = child.closeTo(RegExp('course|root', 'i'));
			if (!(child.node.nodeName.match(/course/i))) {
				child = addSection('course', '', child, options).closeTo(RegExp('course', 'i'));
			}
			stackName = 'chapter';
			break;
		case 'course':
			child = child.closeTo(/root/i);
			break;
	}
	
	child = child.addChild(stackName);
	if (!stackName.match(/section/i)) {
		child.node.setAttribute('type', stackName.charAt(0).toUpperCase() + stackName.slice(1));
	} else {
		child.node.setAttribute('type', 'Section');
	}
	if (sectionType.match(/chapter|week|lecture/i)) {
		child.node.setAttribute('chapter_type', sectionType.charAt(0).toUpperCase() + sectionType.slice(1));
	}
	
	child.node.setAttribute("wbtag", sectionType);

	const title = _title == null || _title.trim() == '' ? secNums['chapter'].toString() : _title.trim();

	if (stackName.match(/week|lecture|chapter/)) {
		if(!isNaN(title) && title != '') { // title is integer
			secNums[stackName] = title;
		}
		secNums['statement'] = 1;
		child.node.setAttribute("num", secNums['chapter']++);
	}

	// if (typeof(title) !== 'undefined' && title != null && title != '') {
		child.node.setAttribute("title", title.replace(/[^a-zÀ-ÿ0-9\s\-]/ig, '').trim());
		
		child = child.addChild('title');
		
		// if(!['Week', 'Lecture'].includes(chapterType)) {
		if (isNaN(title)) {
			child.node.textContent = title;
		}
		child.node.setAttribute("wbtag", sectionType);
		child.node.setAttribute("scope", stackName);
		child = child.closeTo(RegExp(stackName, 'i'));
	// }
	
	// if (((typeof title != 'undefined') && title.trim() != '' && title != null) || stackName.match(/chapter|course/i)) {
	// 	child.node.setAttribute("title", title.replace(/[^a-zÀ-ÿ0-9\s\-]/ig,'').trim());
	// 	child = child.addChild('title');
	// 	child.node.textContent = title;
	// 	child.node.setAttribute("wbtag", sectionType);
	// 	child.node.setAttribute("scope", stackName);
	// 	child = child.closeTo(RegExp(stackName, 'i'));
	// }

	child.loadOptions(options);
	child = child.addChild('slides').addChild('slide');
	child.node.setAttribute("canon_num", secNums['slide']);
	child.node.setAttribute("scope", sectionType);
	secNums['slide']++;
	return child;
}

function Stack(node, doc) {
	this.doc = doc;
	this.parent = null;
	this.node = node;
	// report(node);
	try {
		this.node.setAttribute("environment", "");
	} catch (err) { }
	this.node.textContent = "";
	this.tokens = [];
	this.is_comment = false;
	this.html_environments = [];
	this.stepsID = 0;
	this.course = '';
	this.chapterType = '';
	this.step = 0;
	// this.wwID = 0;

	this.addChild = function (name, namespace = 'http://www.math.cuhk.edu.hk/~pschan/cranach') {
		let parent = this;
		while (parent.node.nodeName.match(/PARAGRAPHS/i)) {
			parent = parent.close();
		}
		let child = new Stack(this.doc.createElementNS(namespace, name));
		if (environs.includes(name)) {
			child.node.setAttribute("environment", name);
		} else {
			child.node.setAttribute("environment", parent.getEnvironment());
		}

		child.doc = parent.doc;
		child.tokens = parent.tokens;
		child.html_environments = parent.html_environments;
		child.stepsID = parent.stepsID;
		child.is_comment = parent.is_comment;
		child.course = parent.course;
		child.chapterType = parent.chapterType;
		child.parent = parent;

		child.node.setAttribute('chapter_type', child.chapterType);

		return child;
	}

	this.addNode = function (node) {
		let parent = this;
		while (parent.node.nodeName.match(/PARAGRAPHS/i)) {
			parent = parent.close();
		}
		let child = new Stack(node);
		let name = node.nodeName;
		if (environs.includes(name)) {
			child.node.setAttribute("environment", name);
		} else {
			child.node.setAttribute("environment", parent.getEnvironment());
		}

		child.doc = parent.doc;
		child.tokens = parent.tokens;
		child.html_environments = parent.html_environments;
		child.stepsID = parent.stepsID;
		child.is_comment = parent.is_comment;
		child.course = parent.course;
		child.chapterType = parent.chapterType;
		child.parent = parent;

		return child;
	}

	this.loadOptions = function (options) {
		for (let key in options) {
			if (options.hasOwnProperty(key)) {
				report('SETATTRIBUTE: ' + key + " -> " + options[key]);
				this.node.setAttribute(key, options[key]);
			}
		}
	}

	this.addComment = function (text) {
		let parent = this;
		let child = new Stack(parent.doc.createComment(text));

		child.doc = parent.doc;
		child.tokens = parent.tokens;
		child.html_environments = parent.html_environments;
		child.stepsID = parent.stepsID;
		child.is_comment = parent.is_comment;
		child.course = parent.course;
		child.chapterType = parent.chapterType;
		child.parent = parent;

		return child;
	}

	this.close = function () {
		if (this.parent != null) {
			if (this.node.nodeName.match(/statement|substatement|figure/i)) {
				let strippedText = this.node.textContent.replace(/[^a-zA-Z0-9]/g, '')
				if (strippedText != '') {
					let textMD5 = base62md5(strippedText);
					this.node.setAttribute('md5', textMD5);
				} else {
					let serialized = xmlSerializer.serializeToString(this.node);
					this.node.setAttribute('md5', base62md5(serialized));
				}
			}
			this.parent.node.appendChild(this.node);
			this.parent.tokens = this.tokens;
			this.parent.html_environments = this.html_environments;
			this.parent.stepsID = this.stepsID;
			this.parent.is_comment = this.is_comment;
			this.parent.course = this.course;
			this.parent.chapterType = this.chapterType;
			return this.parent;
		} else {
			return this;
		}
	}

	this.hasParent = function (regex) {
		let failsafe = 0;
		let aux = this;
		while ((!aux.node.nodeName.match(regex)) && !(aux.node.nodeName.match(/root/i)) && (failsafe < 50)) {
			aux = aux.parent;
			failsafe++;
		}
		return aux.node.nodeName.match(regex);
	}

	this.getParent = function (regex) {
		let failsafe = 0;
		let aux = this;
		while ((!aux.node.nodeName.match(regex)) && !(aux.node.nodeName.match(/root/i)) && (failsafe < 50)) {
			aux = aux.parent;
			failsafe++;
		}
		return aux;
	}

	this.closeTo = function (regex) {
		let failsafe = 0;
		let aux = this;
		while ((!aux.node.nodeName.match(/root/i)) && (failsafe < 100) && !aux.node.nodeName.match(regex)) {
			failsafe++;
			aux = aux.close();
		}
		return aux;
	}

	this.setAttribute = function (attr, value) {
		this.node.setAttribute(attr, value);
		return this;
	}

	this.getEnvironment = function () {
		return this.node.getAttribute("environment");
	}

	this.getNode = function () {
		return this.node;
	}

	this.weaveNonHtml = function (_child, token) {
		const sectionHandlers = {
			course: (child, argument, options) => {
				const normalizedArg = argument.trim().toLowerCase();
				const normalizedCourse = this.course.trim().toLowerCase();
				if (normalizedArg !== normalizedCourse) {
					secNums['chapter'] = 1;
					child = addSection('course', argument, child, options);
					child.node.setAttribute('course', argument);
					child.node.setAttribute('title', argument);
					child.course = argument;
				}
				return child;
			},
			setchapter: (child, argument, options) => {
				secNums['chapter'] = argument;
				console.log(secNums['chapter']);
				child = child.addChild('setchapter');
				child.node.setAttribute('wbtag', tagname);
				child.node.setAttribute('argument', argument);
				return child.close();
			},
			defaultChapter: (child, argument, options) => addSection(token.name, argument, child, options),
			defaultSection: (child, argument, options) => addSection(token.name, argument, child, options)
		};

		// console.log(token);
		let { tagname, argument, options } = processDirectiveToken(token);

		// console.log(tagname + ' ' + argument + ' ' + options);

		const sectionHandler = sectionHandlers[token.name]
			|| (sectionTypes.includes(token.name) ? sectionHandlers.defaultSection : null)
			|| (chapterTypes.includes(token.name) ? sectionHandlers.defaultChapter : null);

		let child = _child;
		if (sectionHandler) {
			return sectionHandler(child, argument, options);
		} else if (token.type == 'directive' && STATEMENTLIKE_TAGS.includes(tagname)) {
			return statementHandler(child, token, tagname);
		} else if (environmentClosures[tagname]) { // && environs.includes(child.getEnvironment())
			const { targets, action } = environmentClosures[token.name];
			if (action) action(child);
			return child.closeTo(targets).close();
		} else if (tagname in environmentSelfClosing) {
			const action = environmentSelfClosing[tagname].action;
			if (action) {
				child = action(child, argument, options);
			}
			child.node.setAttribute("wbtag", tagname);
			return child.close();
		} else if (tagname in procedural) {
			const action = procedural[tagname].action;
			if (action) {
				// console.log(tagname + ' ' + argument);
				action(child, argument, options);
			}
			return child;
		} else if (token.name == 'escaped') {
			if (!child.node.nodeName.match(/script|textarea/i)) {
				child = child.addChild('escaped');
				if (token.type == 'at_word') {
					child.node.setAttribute('wbtag', 'escaped');
					child.node.setAttribute('argument', token.tagname);
				} else if (token.type == 'directive') {
					child.node.setAttribute('wbtag', 'escaped');
					child.node.setAttribute('argument', argument);
				}
				return child = child.close();
			} else {
				return environmentSelfClosing.paragraphs.action(child, token.verbatim);
			}
		} else if (token.name == 'title') {
			// child = closeChildIfParagraph(_child);
			if (child.node.nodeName.match(/paragraphs/i)) {
				child = child.close();
			}
			if (argument.trim() != '') {
				child.node.setAttribute("title", argument.replace(/[^a-zÀ-ÿ0-9\s\-\']/ig, ''));
				let title = child.addChild("title");
				title.node.textContent += argument.trim();
				title.node.setAttribute('wbtag', child.node.nodeName);
				title.close();
			} else if (token.value != '@title{}'){
				// console.log('standalone title');
				child = child.addChild("title");
				child.node.setAttribute('wbtag', child.node.nodeName);
			}
			return child;
		} else {
			let type = Object.keys(environmentTypes).find(key =>
				environmentTypes[key].includes(tagname)) || null;
			let environmentHandler = type ? environmentOpenings[type]
				: (tagname in environmentOpenings) ? environmentOpenings[tagname] : null;
			if (environmentHandler) {
				const action = environmentHandler.action;
				let output = { node: child, name: tagname };
				if (action) {
					output = action(child, tagname);
				}
				child = output.node;
				tagname = output.name;
				// console.log(tagname);
				child = child.addChild(tagname);
				child.node.setAttribute("wbtag", tagname);
				const post = environmentHandler.post;
				if (post) {
					post(child);
				}
				return child;
			}
			return environmentSelfClosing.paragraphs.action(child, token.value);
		}

	}

	this.weave = function () {
		const originaltoken = this.tokens.shift();
		let token = originaltoken;

		let child;

		child = this;
		// console.log(token);

		const verbatimMatch = child.node.nodeName.match(verbatimTags);

		if (token.type == 'comment_open') {
			while (child.node.nodeName.match(/PARAGRAPHS/i)) {
				child = child.close();
			}
			child = child.addChild("comment");
			child.is_comment = true;
			return child;
		} else if (token.type == 'comment_close') {
			child = child.close();
			child.is_comment = false;
			return child;
		} else if (child.is_comment) {
			child.node.textContent += token.value;
			return child;
		} else if (verbatimMatch) {
			return handleVerbatimNode(child, token);
		} else if (token.type == 'newline') {
			// console.log('adding newline');
			return child.addChild('newline').close();
		} else if (token.type.startsWith('html_')) { // HTML section
			return handleHtmlToken(child, token);
		} else {
			return this.weaveNonHtml(child, token);
		}
	}

}
