const xh_prefix = '';

// const htmlElements = /pre|table|tbody|thead|th|tr|td|i|em|p|a|b|strong|u|h\d|div|img|center|script|iframe|blockquote|ol|ul|li|sup|code|hr|span|iframe|br|hr|textarea/;
// deepseek
const htmlElements = /a|abbr|acronym|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|svg|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr|center/;
// /deepseek

const htmlRe = new RegExp('\\<(?:' + htmlElements.source + ')(?:\\s+(?:.|\n)*?|)\\/*\\>', 'i');
const htmlCloseRe = new RegExp('\\<\\/(?:' + htmlElements.source + ')(?:\\s+.*?|)\\>', 'i');

const htmlTagRe = new RegExp('\\<(' + htmlElements.source + ')(\\s+(?:.|\n)*|)\\/*\\>', 'i');
const htmlTagCloseRe = new RegExp('\\<\\/(' + htmlElements.source + ')(\\s+.*?|)\\>', 'i');

const nested = /((?:([^{}]*)|(?:{(?:([^{}]*)|(?:{(?:([^{}]*)|(?:{[^{}]*}))*}))*}))+)/;

// const mainTokensRe = new RegExp('(\\<\\!\\-\\-)|(\\-\\-\\>)|(@@\\w+)|(@(?!md5|name)(?:[a-zA-Z\*]+)(?:{\\n*' + nested.source + '\\n*})?(?:\\[.*?\\])?)|(' + htmlRe.source + ')|(' + htmlCloseRe.source + ')|((?:\\s|\\n)*((?!\\<\\/*(' + htmlElements.source + ')|@(?!md5|name)|\\<\\!\\-\\-|\\-\\-\\>).|\\n)+)', 'g');
// deepseek
// Define modular parts of the regex
const commentStart = '(\\<\\!\\-\\-)';
const commentEnd = '(\\-\\-\\>)';
const atAtToken = '(@@\\w+)';
const atToken = '(@(?!md5|name)(?:[a-zA-Z\\*]+)(?:{\\n*' + nested.source + '\\n*})?(?:\\[.*?\\])?)';
const htmlTag = '(' + htmlRe.source + ')';
const htmlCloseTag = '(' + htmlCloseRe.source + ')';
const textContent = '((?:\\s|\\n)*((?!\\<\\/*(' + htmlElements.source + ')|@(?!md5|name)|\\<\\!\\-\\-|\\-\\-\\>).|\\n)+)';

// Combine all parts into the main regex
const mainTokensRe = new RegExp(
	`${commentStart}|${commentEnd}|${atAtToken}|${atToken}|${htmlTag}|${htmlCloseTag}|${textContent}`,
	'g'
);
// /deepseek

const dictionary = {
	"@thm": "Theorem",
	"@prop": "Proposition",
	"@lemma": "Lemma",
	"@cor": "Corollary",
	"@defn": "Definition",
	"@claim": "Claim",
	"@fact": "Fact",
	"@remark": "Remark",
	"@eg": "Example",
	"@ex": "Exercise",
	"@proof": "Proof",
	"@ans": "Answer",
	"@sol": "Solution",
	"@notation": "Notation",
	"@paragraphs": "Paragraphs",
	"@col": "col",
	"@newcol": "newcol"
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
	"figure"
];

let chapterType = "Chapter";
let course = '';
let topic = '';
let step = 0;

let secNums = {
	'chapter': 1,
	'section': 1,
	'subsection': 1,
	'subsubsection': 1,
	'statement': 1,
	'figure': 1,
	'slide': 1
}

function weaveHtml(child, word, htmlMatches) {
	const tagName = htmlMatches[1].toLowerCase(); // Normalize tag name to lowercase
	const parameters = htmlMatches.length > 2 ? htmlMatches[2] : ''; // Extract parameters if they exist

	// Log the HTML tag being processed
	report(`HTML TAG: ${tagName}`);

	// Handle special cases for <li> tags
	if (tagName === 'li') {
		child = child.closeTo(/ol|ul/i); // Close up to the nearest <ol> or <ul>
	}

	// Generate the DOM string based on the tag type
	let domString;
	switch (tagName) {
		case 'tr':
		case 'tbody':
		case 'thead':
			domString = `<table><${tagName}${parameters}></${tagName}></table>`;
			break;
		case 'td':
		case 'th':
			domString = `<table><tr><${tagName}${parameters}></${tagName}></tr></table>`;
			break;
		default:
			domString = `<${xh_prefix}${tagName}${parameters}></${xh_prefix}${tagName}>`;
			break;
	}

	// Parse the DOM string into an HTML node
	const htmlDom = new DOMParser().parseFromString(domString, 'text/html');
	const node = htmlDom.getElementsByTagName(`${xh_prefix}${tagName}`)[0];

	// Add the node to the child
	child = child.addNode(node);

	// Handle self-closing tags (e.g., <img />, <br />) or tags that end with />
	if (word.endsWith('/>') || ['img', 'hr', 'br'].includes(tagName)) {
		child = child.close(); // Close the tag if it's self-closing
	}

	return child;
}
// /deepseek

function Stack(node, doc) {
	this.doc = doc;
	this.parent = null;
	this.node = node;
	// report(node);
	try {
		this.node.setAttribute("environment", "");
	} catch (err) { }
	this.node.textContent = "";
	this.words = [];
	this.is_comment = false;
	this.html_environments = [];
	this.stepsID = 0;
	this.course = '';
	this.chapterType = '';
	// this.wwID = 0;

	this.addChild = function (name) {
		let namespace = 'http://www.math.cuhk.edu.hk/~pschan/cranach';
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
		child.words = parent.words;
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
		child.words = parent.words;
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
		child.words = parent.words;
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
					let textMD5 = md5(strippedText);
					this.node.setAttribute('md5', textMD5);
				} else {
					let serialized = xmlSerializer.serializeToString(this.node);
					this.node.setAttribute('md5', md5(serialized));
				}
			}
			this.parent.node.appendChild(this.node);
			this.parent.words = this.words;
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

	this.weave = function () {
		let originalWord = this.words.shift();
		const word = originalWord.trim();
		let verbatim = this.node.nodeName.match(/(script|textarea)/i);
		let parent, child;

		child = this;

		if (verbatim) {
			report('DEFAULT: ' + originalWord);
			if (!originalWord.match(new RegExp('</' + verbatim[1] + '>', 'i'))) {
				originalWord = originalWord.replace(/@@(\w+)/g, "@$1");
				this.node.textContent += originalWord;
				return this;
			}
		} else {
			if (originalWord.match(/^\n$/)) {
				return this;
			}
			originalWord = originalWord.replace(/@@(\w+)/g, "@escaped{$1}");
		}

		report('WEAVING: ' + originalWord);


		if (word.match(/^\<\!\-\-/)) {
			while (child.node.nodeName.match(/PARAGRAPHS/i)) {
				child = child.close();
			}
			child = child.addChild("comment");
			child.is_comment = true;
			return child;
		}

		if (word.match(/\-\-\>/)) {
			child = child.close();
			child.is_comment = false;
			return child;
		} else if (child.is_comment) {
			child.node.textContent += originalWord;
			return child;
		}

		// HTML section
		let htmlMatches = word.match(htmlTagRe);
		if (htmlMatches) {
			return weaveHtml(child, word, htmlMatches);
		} else {
			htmlMatches = word.match(htmlTagCloseRe);
			if (htmlMatches) {
				let re = new RegExp(xh_prefix + htmlMatches[1], 'i');
				child = child.closeTo(re);
				report('TAG CLOSED');
				child = child.close();
				return child;
			}
		}
		// END HTML section

		return this.weaveNonHtml(child, originalWord);

	}

	this.weaveNonHtml = function (child, originalWord) {
		const STATEMENT_TYPES = {
			STATEMENT: 'statement',
			SUBSTATEMENT: 'substatement',
		};

		const SUBSTATEMENT_TAGS = ['@proof', '@sol', '@ans', '@notation', '@remark'];

		// Helper function to determine if a word is a substatement
		const isSubstatement = (word) => SUBSTATEMENT_TAGS.some(tag => word.match(new RegExp(tag, 'i')));

		// Helper function to close the child node if it matches PARAGRAPHS
		const closeChildIfParagraph = (child) => {
			while (child.node.nodeName.match(/PARAGRAPHS/i)) { // changed if to while
				child = child.close();
			}
			return child;
		};

		let word = originalWord.trim();
		let tagname = '';
		let argument = '';
		let options = null;
		let matches;

		matches = word.match(/^(@[a-zA-Z\*]+)(?:{((?:.|\n)*?)})?(?:\[(.*?)\])?$/);
		if (matches) {
			word = matches[1];
			tagname = word.substr(1);
			if (matches[2]) {
				argument = matches[2].trim();
			}
			if (matches[3]) {
				try {
					options = JSON.parse('{' + matches[3].trim().replace(/'/g, '"') + '}');
				} catch (e) {
					options = JSON.parse('{"name":"' + matches[3].trim() + '"}');
				}
			}
		}
		switch (word) {
			case "@course":
				if (argument.trim().toLowerCase() != this.course.trim().toLowerCase()) {
					secNums['chapter'] = 1;
					child = addSection('course', argument, child, options);
					child.node.setAttribute('course', argument);
					child.node.setAttribute('title', argument);
					child.course = argument;
				}
				break;
			case '@setchapter':
				secNums['chapter'] = argument;
				child = child.addChild('setchapter');
				child.node.setAttribute('wbtag', tagname);
				child.node.setAttribute('argument', argument);
				child = child.close();
				break;
			case '@chapter':
			case '@section':
			case '@subsection':
			case '@subsubsection':
				child = addSection(tagname, argument, child, options);
				break;
			case '@week':
				chapterType = "Week";
				secNums['chapter'] = +argument;
				child = addSection('week', '', child, options);
				break;
			case '@lecture':
				chapterType = "Lecture";
				secNums['chapter'] = +argument;
				child = addSection('lecture', '', child, options);
				break;
			case '@chapter_type':
				parent = child.closeTo(/chapter/i);
				parent.node.setAttribute("chapter_type", argument);
				chapterType = argument;
				break;
			case '@skip':
				child.node.setAttribute("data-lecture-skip", "true");
				break;
			case '@slide':
				child = child.closeTo(/SLIDES|section|chapter|course|root/i);
				if (!child.node.nodeName.match(/SLIDES/i)) {
					child = child.addChild('slides');
				}
				child = child.addChild('slide');
				child.node.setAttribute("wbtag", tagname);
				child.node.setAttribute("canon_num", secNums['slide']);
				secNums['slide']++;
				break;
			case '@enumerate':
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild(tagname);
				child.node.setAttribute("wbtag", tagname);
				break;
			case '@itemize':
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild(tagname);
				child.node.setAttribute("wbtag", tagname);
				break;
			case "@item":
				child = child.closeTo(/enumerate|itemize|slide/i);
				child = child.addChild(tagname);
				child.node.setAttribute("wbtag", tagname);
				break;
			case '@newcol':
			case '@collapse':
			case '@col':
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				if ((word == '@newcol') || (child.getEnvironment() != 'newcol')) {
					tagname = 'newcol';
				} else {
					tagname = 'collapse';
				}
				child = child.addChild(tagname);
				child.node.setAttribute("wbtag", tagname);
				break;
			case '@endcol':
				child = child.closeTo(/newcol/i).close();
				break;
			case "@ul":
			case "@ol":
				child = child.addChild('col_' + tagname);
				child.node.setAttribute("wbtag", 'col_' + tagname);
				break;
			case "@li":
				child = child.closeTo(/col_ul|col_ol/i);
				child = child.addChild('col_' + tagname);
				child.node.setAttribute("wbtag", 'col_' + tagname);
				break;
			case "@endul":
			case "@endol":
				child = child.closeTo(/col_ul|col_ol/i).close();
				break;
			case '@ex':
			case '@eg':
			case '@fact':
			case '@defn':
			case '@thm':
			case '@prop':
			case '@cor':
			case '@lemma':
			case '@claim':
			case '@remark':
			case '@proof':
			case '@sol':
			case '@ans':
			case '@notation':
				const statementType = isSubstatement(word) ? STATEMENT_TYPES.SUBSTATEMENT : STATEMENT_TYPES.STATEMENT;

				child = closeChildIfParagraph(child);
				parent = child;
				child = parent.addChild(statementType);

				child.node.setAttribute('type', dictionary[word.trim()]);
				child.node.setAttribute('wbtag', tagname);

				if (!isSubstatement(word)) {
					child.node.setAttribute('num', secNums['statement']++);
				}
				break;
			case "@figure":
				child = closeChildIfParagraph(child);
				parent = child;
				child = parent.addChild('figure');
				child.node.setAttribute("wbtag", tagname);
				child.node.setAttribute("type", 'Figure');
				child.node.setAttribute("num", secNums['figure']++);
				break;
			case "@endfigure":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/figure/i).close();
				break;
			case "@of":
				let match = originalWord.trim().match(/@of{(.*?)}/)[1];
				parent = child.closeTo(/substatement/i);
				parent.node.setAttribute("of", match);
				break;
			case "@title":
				child = closeChildIfParagraph(child);
				if (argument) {
					child.node.setAttribute("title", argument.replace(/[^a-zÀ-ÿ0-9\s\-\']/ig, ''));
					let title = child.addChild("title");
					title.node.textContent += argument.trim();
					// title.node.setAttribute('scope', parent.node.nodeName);
					title.node.setAttribute('wbtag', child.node.nodeName);
					title.close();
				} else {
					child = child.addChild("title");
					child.node.setAttribute('wbtag', child.node.nodeName);
				}
				break;
			case "@endtitle":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				parent = child.getParent(/statement|substatement|chapter|section|subsection|subsubsection/i);
				parent.node.setAttribute("title", child.node.textContent.replace(/[^a-zÀ-ÿ0-9\s\-\']/ig, ''));
				child = child.closeTo(/title|slide/i).close();
				break;
			case "@caption":
				child = closeChildIfParagraph(child);
				child = child.addChild("caption");
				child.node.textContent += argument;
				child = child.close();
				break;
			case "@framebox":
				child = child.addChild("framebox");
				child.node.setAttribute("wbtag", "framebox");
				break;
			case "@endenumerate":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/enumerate|slide/i).close();
				break;
			case "@enditemize":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/itemize|slide/i).close();
				break;
			case "@end":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				// let re = new RegExp(child.getEnvironment(), 'i');
				child = child.closeTo(/statement|substatement|enumerate|itemize|center|left|right|slide|framebox|figure/i).close();
				break;
			case "@center":
				child = child.addChild("center");
				child.node.setAttribute("wbtag", "center");
				break;
			case "@endcenter":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/center|slide/i).close();
				break;
			case "@left":
				child = child.addChild("left");
				child.node.setAttribute("wbtag", "left");
				break;
			case "@endleft":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/left|slide/i).close();
				break;
			case "@right":
				if (child.getEnvironment().match(/left/i)) {
					child = child.closeTo(/left/i).close();
				}
				child = child.addChild("right");
				child.node.setAttribute("wbtag", "right");
				break;
			case "@endright":
				if (!environs.includes(child.getEnvironment())) {
					break;
				}
				child = child.closeTo(/right|slide/i).close();
				break;
			case "@image":
				child = child.addChild("image");
				child.node.setAttribute("data-src", argument);
				child.node.setAttribute("wbtag", "image");
				child = child.close();
				break;
			case "@webwork":
				child = child.addChild("webwork");
				child.node.setAttribute("wbtag", "webwork");
				child.node.setAttribute("pg_file", argument);
				child = child.close();
				break;
			case "@wiki":
				child = child.addChild("wiki");
				child.node.setAttribute("wbtag", tagname);
				child.node.textContent += argument;
				child = child.close();
				break;
			case "@topic":
				let ancestorNode = child.getParent(/chapter|course/i);
				if (!ancestorNode.node.nodeName.match(/chapter|course/i)) {
					break;
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
				break;
			case "@steps":
				child.stepsID++;
				step = 0;
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild("steps");
				child.node.setAttribute('wbtag', 'steps');
				child.node.setAttribute("stepsid", 'steps' + child.stepsID);
				break;
			case "@nstep":
				let insert = '\\class{steps}{\\cssId{step' + step + '}{' + argument + '}}';
				step++;
				child.node.textContent += insert;
				break;
			case "@endsteps":
				child = child.closeTo(/steps/i).close();
				break;
			case "@endproof":
			case "@qed":
				child = child.addChild("qed");
				child = child.close();
				break;
			case "@break":
				break;
			case "@newline":
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild("newline");
				child = child.close();
				break;
			case "@para":
				child = child.addChild("para");
				child.node.setAttribute("wbtag", tagname);
				break;
			case "@label":
				parent = child.closeTo(/statement|course|chapter|section|subsection|subsubsection|figure/i);
				let label = parent.addChild("label");
				label.node.setAttribute('wbtag', tagname);
				label.node.setAttribute('name', argument);
				label.node.setAttribute('type', parent.node.getAttribute('type'));
				label.close();
				break;
			case "@ref":
				while (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild("ref");
				matches = originalWord.match(/@ref{(.*?)}(\[(.*?)\])*/);
				if (matches) {
					if (matches[1]) {
						child.node.setAttribute('label', matches[1]);
					}
					if (options != null) {
						child.loadOptions(options);
					}
				}
				child.node.setAttribute('wbtag', 'ref');
				child = child.close();
				break;
			case "@href":
				child = child.addChild("href");
				matches = originalWord.match(/@href{(.*?)}(\[(.*?)\])*/);
				if (matches) {
					if (matches[1]) {
						child.node.setAttribute('src', matches[1]);
					}
					if (matches[2]) {
						child.node.setAttribute('name', matches[2]);
					} else {
						child.node.setAttribute('name', matches[1]);
					}
				}
				child.node.setAttribute('wbtag', 'href');
				child.node.setAttribute('argument', argument);
				child = child.close();
				break;
			case "@keyword":
				if (child.node.nodeName.match(/PARAGRAPHS/i)) {
					child = child.close();
				}
				child = child.addChild('inline_keyword');
				child.node.textContent += argument;
				child = child.close();
				break;
			case "@keyword*":
				let slide = child.getParent(/slide/i);
				let kw = slide.addChild("hc_keyword");
				kw.node.setAttribute("wbtag", "hc_keyword");
				kw.node.setAttribute("class", "hidden");
				kw.node.textContent += argument;
				kw.close();
				break;
			case "@escaped":
				if (!child.node.nodeName.match(/script|textarea/i)) {
					child = child.addChild('escaped');
					child.node.setAttribute('wbtag', 'escaped');
					child.node.setAttribute('argument', argument);
					child = child.close();
					break;
				} else {
					originalWord = '@' + argument;
				}
			default:
				report('DEFAULT: ' + originalWord);
				if (originalWord.match(/@@\w+/)) {
					originalWord = originalWord.replace(/@@/, '@');
				}
				if (!child.node.nodeName.match(/^(script|textarea|steps|table|tbody)$/i)) {
					let chunks = originalWord.split(/(?:\s*\n\s*)(?:\s*\n\s*)+/);
					report(chunks);
					let chunk;
					if (originalWord.match(/^\s*\n\s*\n\s*/)) {
						child = child.addChild('newline').close();
					}
					for (let i = 0; i < chunks.length; i++) {
						if (!child.node.nodeName.match(/title/i)) {
							chunk = chunks[i].replace(/(^\n+)|(\n+$)/g, ' ');
						} else {
							chunk = chunks[i].replace(/(^\n+)|(\n+$)/g, '');
						}
						if (chunk != '') {
							report('CHUNK: ' + chunk);
							if (!child.node.nodeName.match(/PARAGRAPHS/i)) {
								if (child.node.nodeName.match(/root|course|chapter|section/i)) {
									child = child.addChild('slides').addChild('slide');
									child.node.setAttribute("canon_num", secNums['slide']);
									secNums['slide']++;
								}
								child = child.addChild("paragraphs");
								child.node.setAttribute("wbtag", "paragraphs");
							}
							child.node.textContent += chunk;
							child = child.close();
							if (i < chunks.length - 1) {
								child = child.addChild('newline').close();
							} else if (originalWord.match(/\n\s*\n\s*$/)) {
								child = child.addChild('newline').close();
							}
						}
					}
				} else {
					if (!child.node.nodeName.match(/^(table|tbody)$/i)) {
						child.node.textContent += originalWord;
					}
				}
				break;
		}
		return child;

	}
}


function addSection(sectionType, title, child, options) {
	let stackName = sectionType;
	let chapterType = '';

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
		case 'lecture':
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
	if (stackName.match(/week|lecture|chapter/)) {
		secNums['statement'] = 1;
		child.node.setAttribute("num", secNums[stackName]++);
	}

	if (((typeof title != typeof undefined) && title != '' && title != null) || stackName.match(/chapter|course/i)) {
		child.node.setAttribute("title", title.replace(/[^a-zÀ-ÿ0-9\s\-]/ig, ''));
		child = child.addChild('title');
		child.node.textContent = title;
		child.node.setAttribute("wbtag", sectionType);
		child.node.setAttribute("scope", stackName);
		child = child.closeTo(RegExp(stackName, 'i'));
	}

	child.loadOptions(options);
	child = child.addChild('slides').addChild('slide');
	child.node.setAttribute("canon_num", secNums['slide']);
	child.node.setAttribute("scope", sectionType);
	secNums['slide']++;
	return child;
}
