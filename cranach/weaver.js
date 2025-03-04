const xmlSerializer = new XMLSerializer();

// Function to convert hex MD5 to base62
function hexToBase62(hexString) {
	// Convert hex string to BigInt
	let num = BigInt('0x' + hexString);
	let result = '';
  
	// Convert to base62
	while (num > 0n) {
	  const remainder = Number(num % 62n);
	  result = BASE62[remainder] + result;
	  num = num / 62n;
	}
  
	// Pad with leading zeros if needed (to ensure consistent length)
	return result.padStart(22, '0');
  }

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function base62md5(text) {
	const md5 = window.md5(text);
	// console.log(md5);
	return hexToBase62(md5);
	// return CryptoJS.MD5(text);
}

function generateXML(source) {
	console.log('IN GENERATEXML');

	let wbMD5 = base62md5(source);

	secNums = {
		'chapter' : 1,
		'section' : 1,
		'subsection': 1,
		'subsubsection' : 1,
		'statement': 1,
		'figure': 1,
		'slide': 1
	}
	docNode = document.implementation.createDocument("", "", null);

	// LEGACY COMPATIBILITY
	let topicTags = source.match(/(@topic{.*?})/g);

	if (typeof topicTags != typeof undefined && topicTags != null) {
		for (let j = 0; j < topicTags.length; j++) {
			let topics = topicTags[j].match(/@topic{(.*?)}/)[1].split(/\<br\/*\>/);
			let topicString = "";
			if (topics.length > 1) {
				for (let i = 0; i < topics.length; i++) {
					topicString += "@topic{" + topics[i] + "}\n";
				}
				source = source.replace(topicTags[j], topicString);
			}
		}
	}
	
	// .replace(
	// 	/@sep/g, '@slide')
	// .replace(/@example/g, '@eg')
	// .replace(/@definition/g, '@defn')
	// .replace(/@def([^n]|$)/g, '@defn$1')
	// .replace(/@theorem/g, '@thm')
	// .replace(/@proposition/g, '@prop')
	// .replace(/@corollary/g, '@cor')
	// .replace(/@solution/g, '@sol')
	source = source.replace(/#(nstep|ref|label)/g, "@$1")
	.replace(/\<p\s*\>/g, '<p/>')
	.replace(/\<\/p\>/g, '')
	.replace(/%\n/g, '')
	.replace(/@slide\s*@(course|week|lecture|chapter|section|subsection|subsubsection)/g, "@$1")
	.replace(/@(section|subsection|subsubsection){((?:([^{}]*)|(?:{(?:([^{}]*)|(?:{(?:([^{}]*)|(?:{[^{}]*}))*}))*}))+)}/g, "@$1\n@title\n$2\n@endtitle")
	.replace(/__(.*?)__/g, "@keyword{$1}")
	.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

	// END LEGACY COMPATIBILITY

	let doc = document.implementation.createDocument('http://www.math.cuhk.edu.hk/~pschan/cranach', 'document', null);

	let root = new Stack(doc.createElementNS('http://www.math.cuhk.edu.hk/~pschan/cranach', 'root'), doc);
	root.node.setAttribute("xmlns:xh", 'http://www.w3.org/1999/xhtml');
	root.node.setAttribute("wbmd5", wbMD5);

	let child = root;

	// console.log(source);
	// child.words = source.match(mainTokensRe);
	child.tokens = tokenizeAndProcess(source);
	
	while (child.tokens.length) {
		child = child.weave();
	}
	console.log('END REACHED: ' + child.node.nodeName);
	child = child.closeTo(/root/i);
	console.log('END WEAVER');
	return new XMLSerializer().serializeToString(child.node);
}
