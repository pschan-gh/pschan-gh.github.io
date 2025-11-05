const domparser = new DOMParser();
// const xsltProcessor = new XSLTProcessor();

function nsResolver(prefix) {
	let ns = {
		'lv': "http://www.math.cuhk.edu.hk/~pschan/cranach",
		'idx': "http://www.math.cuhk.edu.hk/~pschan/elephas_index",
		'xh': 'http://www.w3.org/1999/xhtml',
		'm': 'http://www.w3.org/1998/Math/MathML',
		'svg': 'http://www.w3.org/2000/svg'
	};
	return ns[prefix] || null;
}

function Cranach(url) {

	this.rootURL = url.match(/^(.*?)\/*(?:\?|$)/).length ? url.match(/^(.*?)\/*(?:\?|$)/)[1] : '';
	this.params = url.match(/\?(.*?)(#|$)/);

	this.attr = {
		'wbPath': 'content/default.wb',
		'xmlPath': null,
		'filepath': '',
		'index': 'index.xml',
		'dir': './content/',
		'rootURL': this.rootURL,
		'contentURLDir': this.rootURL,
		'contentURL': this.rootURL + '?wb=content/default.wb',
		'query': '',
		'outputID': 'output',
		'localName': 'untitled',
		/* Initial Presentation */
		'selectedItem': null,
		'selectedSection': null,
		'selectedSlide': null,
		'selectedKeyword': null,
		'present': false,
		'lectureMode': 0
	};

	this.hasXML = false;
	this.hasWb = false;

	this.preCranachDoc = null;
	this.cranachDoc = null;
	this.indexDoc = null;

	this.macrosString = '';
	// this.macros = '';
	this.bare = false;
	this.output = null;

	this.loadMacros = async function () {
		const response = await fetch(this.attr['dir'] + '/macros.tex');
		if (!response.ok) {
			this.macrosString = '';
			// let domparser = new DOMParser();
			// this.macros = domparser.parseFromString('<div>\\(\\)</div>', "text/xml");
			return this;
		}

		console.log('parsing macros');
		const macroString = await response.text();
		this.macrosString = macroString;

		// this.macros = domparser.parseFromString('<div>\(' + this.macrosString + '\)</div>', "text/html");
		return this;
	}

	this.loadIndex = async function () {
		const url = this.attr['dir'] + '/' + this.attr['index'] + '?version=' + Math.random().toString();
		const response = await fetch(url);
		if (!response.ok) {
			this.indexDoc = document.implementation.createDocument('http://www.math.cuhk.edu.hk/~pschan/elephas_index', 'index', null);
			return this;
		}
		const xmltext = await response.text();
		console.log('parsing index');
		this.indexDoc = domparser.parseFromString(xmltext, "text/xml");
		return this;
	}

	this.setup = function (options) {
		this.output = document.getElementById(this.attr['outputID']);

		if (this.params) {
			let params = this.params;
			let urlParams = new URLSearchParams(params[1]);
			report('URLPARAMS: ' + urlParams);

			if (urlParams.has('wb') || urlParams.has('xml')) {
				const isWb = urlParams.has('wb');
				const pathname = isWb ? urlParams.get('wb') : urlParams.get('xml');

				this.attr['filepath'] = pathname;
				this.attr['dir'] = pathname.match(/^(.*?)\/[^\/]+\.(?:wb|xml)/)?.[1] || '';
				this.hasWb = isWb;
				this.hasXML = !isWb;

				const paramType = isWb ? 'wb' : 'xml';
				this.attr[`${paramType}Path`] = pathname;
				this.attr['contentURL'] = `${this.attr['rootURL']}/?${paramType}=${pathname}`;
				this.attr['contentURLDir'] = `${this.attr['rootURL']}/?${paramType}=${this.attr['dir']}`;

				report(pathname);
				this.attr['localName'] = pathname.match(/(local|([^\/]+)\.(?:wb|xml))$/)[1];
			}

			const attrMap = {
				query: 'query',
				selectedSlide: 'slide',
				present: 'present',
				selectedItem: 'item',
				selectedSection: 'section',
				selectedKeyword: 'keyword',
				lectureMode: 'lecture',
				bare: 'bare'
			};

			// Assign values from URL parameters
			for (const [a, param] of Object.entries(attrMap)) {
				if (urlParams.has(param)) {
					this.attr[a] = param === 'present' ? true : urlParams.get(param);
				}
			}

			// Special cases with additional logic
			if (urlParams.has('query')) {
				report('HAS QUERY');
				report('QUERY: ' + this.attr['query']);
				this.hasQuery = true;
			}

			if (urlParams.has('lecture')) {
				this.attr['lectureMode'] = 1;
			}

			if (urlParams.has('bare')) {
				this.setBare();
				console.log(this.bare);
			}
		}

		if (options) {
			for (let key in options) {
				if (options.hasOwnProperty(key)) {
					this.attr[key] = options[key];
				}
			}
		}

		async function loadData() {
			console.log('in loadData');
			await this.loadMacros();
			await this.loadIndex();

			if (this.attr['xmlPath']) {
				this.attr['wbPath'] = null;

				const response = await fetch(`${this.attr['xmlPath']}?version=${Math.random()}`);
				if (!response.ok) {
					return this;
				}

				const xmltext = await response.text();

				console.log('parsing xml');
				this.cranachDoc = domparser.parseFromString(xmltext, "text/xml");
			} else if (this.attr['wbPath']) {
				const response = await fetch(this.attr['wbPath'] + '?version=' + Math.random());
				if (!response.ok) {
					this.cranachDoc = null;
					return this;
				}

				const wb = await response.text();
				// console.log(wb);
				// editor.setValue(wb, 1);
				this.preCranachDoc = domparser.parseFromString(generateXML(wb), "text/xml");
			}

			return this;
		}

		return loadData.call(this);

	}

	this.setBare = function () {
		this.bare = true;
		return this;
	}

	this.setOutput = function (output) {
		this.output = output;
		return this;
	}

	this.setCranachDoc = function (doc) {
		this.cranachDoc = doc;
		return this;
	}
	this.setPreCranachDoc = function (predoc) {
		this.preCranachDoc = predoc;
		return this;
	}
	this.setIndexDoc = function (index) {
		this.indexDoc = index;
		return this;
	}


	/* interact with Browser */

	this.preCranachDocToCranachDoc = async function () {

		const indexDom = this.indexDoc;
		const preCranachDoc = this.preCranachDoc;

		console.log(prettyPrintXML(preCranachDoc));
		if (indexDom.getElementsByTagName('index')[0]) {
			const index = indexDom.getElementsByTagNameNS("http://www.math.cuhk.edu.hk/~pschan/elephas_index", 'index')[0].cloneNode(true);
			preCranachDoc.getElementsByTagName('root')[0].appendChild(index);
		}

		const response = await fetch('xsl/cranach.xsl');
		const xsltext = await response.text();
		console.log('PRECRANACHTOCRANACH');
		let xsltProcessor = new XSLTProcessor();
		let xsltdoc = domparser.parseFromString(xsltext, "text/xml");
		// console.log(xsltdoc);
		xsltProcessor.importStylesheet(xsltdoc);
		this.cranachDoc = xsltProcessor.transformToDocument(preCranachDoc);

		return this;
	}

	this.displayPreCranachDocToHtml = async function () {
		// return this.preCranachDocToCranachDoc().then(renderer => {
		// 	return renderer.updateIndexAndRender();
		// });
		const renderer = await this.preCranachDocToCranachDoc();
		return await renderer.updateIndexAndRender();
	}

	this.displayCranachDocToHtml = async function () {
		report('IN DISPLAYCRANACHDOCTOHTML');
		const xsl = this.bare ? 'xsl/cranach2html_bare.xsl' : 'xsl/cranach2html.xsl';
		const output = this.output;

		const response = await fetch(xsl);
		const xsltext = await response.text();

		const xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(domparser.parseFromString(xsltext, "text/xml"));
		xsltProcessor.setParameter(null, "timestamp", new Date().getTime());
		xsltProcessor.setParameter(null, 'contenturl', this.attr['contentURL']);
		xsltProcessor.setParameter(null, 'contentdir', this.attr['dir']);

		const fragment = xsltProcessor.transformToFragment(this.cranachDoc, document);
		output.innerHTML = '';
		output.appendChild(fragment);

		return this;
	}

	this.xmlDocQueryAndRender = async function (output = null) {
		report('xmlDocQueryAndRender');
		if (output) {
			this.output = output;
		}
		// console.log(prettyPrintXML(this.cranachDoc));
		let cranachDoc = this.cranachDoc;
		let queryString = this.attr['query'];

		if (queryString != '') {

			let queries = cranachDoc.evaluate(queryString, cranachDoc, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

			let queryDom = document.implementation.createDocument("", "", null);
			let bare = queryDom.createElementNS("http://www.math.cuhk.edu.hk/~pschan/cranach", "root");
			bare.setAttribute('query', 1);

			for (let i = 0; i < queries.snapshotLength; i++) {
				bare.appendChild(queries.snapshotItem(i));
			}
			queryDom.appendChild(bare);

			this.preCranachDoc = queryDom;

			const cranach = await this.updateIndex();
			const renderer = await cranach.preCranachDocToCranachDoc();
			return await renderer.displayCranachDocToHtml();

			// return this.updateIndex().then(cranach => {
			// 	return cranach.preCranachDocToCranachDoc().then(renderer => {
			// 		return renderer.displayCranachDocToHtml();
			// 	});
			// });
		} else {
			return this.displayCranachDocToHtml();
		}
	}
	this.updateIndexAndRender = async function () {

		const cranach = await this.updateIndex();
		const renderer = await cranach.preCranachDocToCranachDoc();
		return await renderer.xmlDocQueryAndRender();

		// return this.updateIndex().then(cranach => {
		// 	return cranach.preCranachDocToCranachDoc().then(renderer => {
		// 		return renderer.xmlDocQueryAndRender();
		// 	});
		// });
	}
	this.updateIndex = async function () {
		let xmlDom = this.cranachDoc;
		const filename = this.attr['query'] == '' ? this.attr['localName'] : 'local';
		const contents = new XMLSerializer().serializeToString(xmlDom);
		const fileMD5 = base62md5(contents);

		const query = "//lv:keyword[@slide!='all']|//lv:statement|//lv:substatement|//lv:figure|//lv:ref|//lv:*[(lv:label) and (@type='Section')]";

		const indexDom = this.indexDoc;
		const newBranches = xmlDom.evaluate(
			query,
			xmlDom,
			nsResolver,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		if (indexDom.getElementsByTagName('index')[0]) {
			for (let i = 0; i < newBranches.snapshotLength; i++) {
				indexDom.getElementsByTagName('index')[0]
					.appendChild(
						newBranches.snapshotItem(i).cloneNode(true)
					);
			}
		} else {
			return this;
		}

		let response = await fetch('xsl/updateindex.xsl');
		const xsltext = await response.text();
		const xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(domparser.parseFromString(xsltext, "text/xml"));
		xsltProcessor.setParameter('', 'cranachmd5', fileMD5);
		xsltProcessor.setParameter('', 'cranachfilename', filename);
		xsltProcessor.setParameter('', 'cranachdoc', xmlDom);

		const preIndexDoc = xsltProcessor.transformToDocument(this.indexDoc);
		response = await fetch('xsl/akhawunti.xsl')
		const indexxsltext = await response.text();
		const indexXsltProcessor = new XSLTProcessor();

		indexXsltProcessor.importStylesheet(domparser.parseFromString(indexxsltext, "text/xml"));
		this.indexDoc = xsltProcessor.transformToDocument(preIndexDoc);
		return this;

	}

	this.displayIndexDocToHtml = async function (target) {
		const contentURLDir = this.attr['rootURL'] + '\/?xml=' + this.attr['dir']
		const indexDoc = this.indexDoc;

		if (target === null) {
			return this;
		}
		const response = await fetch('xsl/index2html.xsl');
		const xsltext = await response.text();
		const xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(domparser.parseFromString(xsltext, "text/xml"));
		xsltProcessor.setParameter(null, 'contenturldir', contentURLDir);
		fragment = xsltProcessor.transformToFragment(indexDoc, document);
		target.innerHTML = ''
		target.appendChild(fragment);
		return this;
	}

	this.renderWb = function (wbString, output) {
		if (output) {
			this.output = output;
		}
		this.bare = false;

		let xmlString = generateXML(wbString);
		// let domparser = new DOMParser();
		let preCranachDoc = domparser.parseFromString(xmlString, 'text/xml');
		this.preCranachDoc = preCranachDoc;
		// console.log(preCranachDoc);
		return this.displayPreCranachDocToHtml();
	}

	this.render = function (output) {
		if (output) {
			this.output = output;
		}

		if (this.cranachDoc) {
			return this.xmlDocQueryAndRender();
		} else {
			return this.displayPreCranachDocToHtml();
		}
	}

	this.openIndex = function (filePath) {
		let file = filePath.files[0];
		let reader = new FileReader();
		reader.addEventListener("load", function () {
			report(reader.result);
			document.getElementById('source_text').value = reader.result;
		}, false);
		reader.readAsText(file);
	}
}
