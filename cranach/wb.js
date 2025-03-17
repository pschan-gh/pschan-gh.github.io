async function commitWb(editor) {
	let body = showJaxSource('output').getElementsByTagName('body')[0];
	let response = await fetch('xsl/html2juengere.xsl');
	let xsl = await response.text();
	let xsltProcessor = new XSLTProcessor();
	// let domparser = new DOMParser();
	xsltProcessor.importStylesheet(domparser.parseFromString(xsl, 'text/xml'));
	let preCranachDoc = xsltProcessor.transformToDocument(body, document);

	console.log(prettyPrintXML(preCranachDoc));

	response = await fetch('xsl/cranach.xsl');
	xsl = await response.text();
	document.getElementById('source_text').value = '';
	xsltProcessor = new XSLTProcessor();
	// let domparser = new DOMParser();
	xsltProcessor.importStylesheet(domparser.parseFromString(xsl, 'text/xml'));
	console.log('HTML2PRELOVU');
	// console.log(preCranachDoc);
	let cranachDoc = xsltProcessor.transformToDocument(preCranachDoc, document);
	// console.log(cranachDoc);
	console.log(prettyPrintXML(cranachDoc));
	return convertCranachDocToWb(cranachDoc, editor);
}

async function convertCranachDocToWb(cranachDoc, editor = null) {
	if (typeof (editor) == 'undefined') {
		return 0;
	}

	const removeWhitespace = (str) =>
		str.replace(/\n\s*/g, "\n")
			.replace(/(\s*@newline\s*)+/g, "\n\n")
			.replace(/{\n+/g, '{')
			.replace(/\n+}/g, '}')
			.replace(/^\n/, '')
			.replace(/ *\n/g, "\n");

	const processNStep = (str) =>
		str.replace(/\\class{steps}{\\cssId{step\d+}{((?:([^{}]*)|(?:{(?:([^{}]*)|(?:{(?:([^{}]*)|(?:{[^{}]*}))*}))*}))+)}}/g, '@nstep{$1}');

	console.log('convertCranachDocToWb');
	// let nested = /((?:([^{}]*)|(?:{(?:([^{}]*)|(?:{(?:([^{}]*)|(?:{[^{}]*}))*}))*}))+)/;
	const response = await fetch('xsl/cranach2wb.xsl');
	const xsl = await response.text();
	const xsltProcessor = new XSLTProcessor();
	const domparser = new DOMParser();
	xsltProcessor.importStylesheet(domparser.parseFromString(xsl, 'text/xml'));
	fragment = xsltProcessor.transformToFragment(cranachDoc, document);
	fragmentStr = unescapeHtml(
		new XMLSerializer().serializeToString(fragment)
	);
	// console.log(fragmentStr);
	// .replace(/&lt;/g, '<')
	// .replace(/&gt;/g, '>')
	// .replace(/&amp;/g, '&')
	// .replace(/&apos;/g, "'")
	// .replace(/@slide(?:\s|\n)*@((course|lecture|week|chapter|section|subsection|subsubsection|topic){(?:.|\n)*?})/g, "@$1")
	editor.setValue(removeWhitespace(processNStep(fragmentStr)), 1);
	document.querySelectorAll('#output > div.slide').forEach(e => e.classList.add('tex2jax_ignore'));
	inlineEdit(false, editor);

	document.querySelectorAll('#output div.slide').forEach(slide => {
		renderTexSource(slide);
		slide.querySelectorAll('.latexSource').forEach(e => e.remove());
		slide.classList.add("tex2jax_ignore");
		if (isElementInViewport(slide)) {
			batchRender(slide);
		}
	});

	return 1;
}
