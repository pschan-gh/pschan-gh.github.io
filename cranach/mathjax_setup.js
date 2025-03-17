MathJax = {
	startup: {
		typeset: false,
		ready() {
			// typeset = function (doms) {
			// 	MathJax.startup.promise = MathJax.startup.promise
			// 		.then(() => { return MathJax.typesetPromise(doms) })
			// 		.catch((err) => console.log('Typeset failed: ' + err.message));
			// 	return MathJax.startup.promise;
			// };
			typeset = async function (doms) {
				try {
					await MathJax.startup.promise;
					return await MathJax.typesetPromise(doms);
				} catch (err) {
					console.log('Typeset failed: ' + err.message);
					throw err;
				}
			};
			MathJax.getAllJax = function (name) {
				const list = Array.from(MathJax.startup.document.math);
				if (!name) return list;
				const container = document.getElementById(name);
				if (!container) return list;
				const filtered = list.filter((node) => container.contains(node.start.node));
				return filtered;
			};

			const Configuration = MathJax._.input.tex.Configuration.Configuration;
			const CommandMap = MathJax._.input.tex.SymbolMap.CommandMap;
			const Label = MathJax._.input.tex.Tags.Label;
			const BaseMethods = MathJax._.input.tex.base.BaseMethods.default;
			const NodeUtil = MathJax._.input.tex.NodeUtil.default;

			//
			//  Create a command map to override \ref and \eqref
			//
			new CommandMap('knowl', {
				href: ['HandleRef', true]
			}, {
				HandleRef(parser, name) {
					const url = parser.GetArgument(name);
					const arg = parser.ParseArg(name);
					const mrow = parser.create('node', 'mrow');
					NodeUtil.copyChildren(arg, mrow);
					NodeUtil.copyAttributes(arg, mrow);

					NodeUtil.setAttribute(mrow, 'lcref', url);
					parser.Push(mrow);
				}
			});
			//
			//  Create the package for the overridden macros
			//
			Configuration.create('knowl', {
				handler: { macro: ['knowl'] }
			});

			document.querySelectorAll('.icon.latex, .icon.xml').forEach(el => el.classList.add('hidden'));
			const body = document.querySelector('body');
			(async () => {
				try {
					// First stage: render cranach
					const cranach = await baseRenderer;
					const output = cranach.bare ? body : document.getElementById('output');
					const renderer = await cranach.render(output);

					// Second stage: handle index display
					if (!renderer.bare) {
						await renderer.displayIndexDocToHtml(document.getElementById('index'));
					}

					// Third stage: enable buttons if not bare
					if (!renderer.bare) {
						document.querySelectorAll('#render_sel').forEach(el => el.disabled = false);
						document.querySelectorAll('#wb_button').forEach(el => el.disabled = false);
					}

					// Fourth stage: MathJax processing
					MathJax.startup.defaultReady();
					await MathJax.startup.promise;
					MathJax.startup.document.state(0);
					MathJax.texReset();
					await MathJax.tex2chtmlPromise(renderer.macrosString);

					// Final processing
					postprocess(renderer);
					convertCranachDocToWb(renderer.cranachDoc, ace.edit("input"));
				} catch (error) {
					console.error('Error in renderer processing:', error);
					throw error;
				}
			})();
		}
	},
	loader: {
		load: ['output/svg', '[tex]/ams', '[tex]/newcommand', '[tex]/html', '[tex]/extpfeil', '[tex]/color', '[tex]/mathtools']
		// 'ui/lazy'
	},
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']],
		processEnvironments: true,
		processEscapes: true,
		processRefs: true,
		tags: "ams",
		packages: ['base', 'ams', 'newcommand', 'html', 'extpfeil', 'color', 'mathtools', 'knowl']
	},
	options: {
		ignoreHtmlClass: "tex2jax_ignore",
		skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'],
	},
	svg: {
		scale: 1,                      // global scaling factor for all expressions
		minScale: .5,                  // smallest scaling factor to use
		mtextInheritFont: false,       // true to make mtext elements use surrounding font
		merrorInheritFont: true,       // true to make merror text use surrounding font
		mathmlSpacing: false,          // true for MathML spacing rules, false for TeX rules
		skipAttributes: {},            // RFDa and other attributes NOT to copy to the output
		exFactor: .5,                  // default size of ex in em units
		displayAlign: 'center',        // default for indentalign when set to 'auto'
		displayIndent: '0',            // default for indentshift when set to 'auto'
		fontCache: 'local',            // or 'global' or 'none'
		localID: null,                 // ID to use for local font cache (for single equation processing)
		internalSpeechTitles: true,    // insert <title> tags with speech content
		titleID: 0                     // initial id number to use for aria-labeledby titles
	}
};