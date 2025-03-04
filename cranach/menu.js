function updateSlideSelector() {
	if (document.querySelector("#slide_sel") == null) {
		return 0;
	}
	let numOfSlides = 0;
	try {
		numOfSlides = document.querySelectorAll('#output div.slide').length;
	} catch (error) {
		return 0;
	}
	document.querySelector("#slide_sel").innerHTML = '';
	for (let i = 1; i <= numOfSlides; i++) {
		let o = new Option(i.toString(), i);
		document.querySelector("#slide_sel").appendChild(o);
	}
	document.querySelector('#slide_sel').addEventListener('change', event => {
		console.log('JUMPING TO SLIDE: ' + event.target.value);
		jumpToSlide(document.querySelector('#output'), document.getElementById(`s${event.target.value}`));
	});
}

function hide() {
	document.querySelector('#cover_half').style.display = 'block';
	document.querySelector('#container').style['height'] = '50%';
	document.querySelectorAll('.slide_button').forEach(e => e.classList.add('half'));

}

function unhide() {
	document.querySelector('#cover_half').style.display = 'none';
	document.querySelector('#container').style['position'] = '';
	document.querySelector('#container').style['height'] = '';
	document.querySelector('.slide_button').classList.remove('half');

}

function dim() {
	if (document.querySelector('#right_half').classList.contains('dimmed')) {
		document.querySelector('#right_half').classList.remove('dimmed');
		document.querySelector('#right_half').classList.add('carousel-dark');
	} else {
		document.querySelector('#right_half').classList.add('dimmed');
		document.querySelector('#right_half').classList.remove('carousel-dark');
	}
}

function resizeFont(multiplier, element = document.querySelector('#output')) {

	if (element.style.fontSize == "") {
		element.style.fontSize = "1.0em";
	}
	element.style.fontSize = parseFloat(element.style.fontSize) + 0.2 * (multiplier) + "em";

}


// https://stackoverflow.com/a/4819886
// https://creativecommons.org/licenses/by-sa/4.0/
function isTouchDevice() {
	return (('ontouchstart' in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0));
}


document.addEventListener('DOMContentLoaded', () => {
	updateSlideSelector();

	let menuObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.type == "attributes") {
				if (mutation.attributeName == 'data-content-url') {
					updateSlideSelector();
				}
			}
		});
	});

	menuObserver.observe(document.getElementById('output'), {
		attributes: true,
	});

	if (isTouchDevice() !== true) {
		let menu_timer = null;
		document.querySelectorAll('.controls').forEach(e => {
			e.addEventListener('mouseover', function (event) {
				clearTimeout(menu_timer);
				e.classList.remove('hidden');
			});
			e.addEventListener('mouseout', function (event) {
				clearTimeout(menu_timer);
			});
		});

		document.querySelector('#right_half').addEventListener('mousemove', function () {
			clearTimeout(menu_timer);
			document.querySelectorAll(".present .menu_container .navbar-nav, .controls, .present .slide_number").forEach(e => e.classList.remove('hidden'));
			menu_timer = setTimeout(function () {
				document.querySelectorAll(".present .menu_container .navbar-nav, .present .slide_number, .controls").forEach(e => e.classList.add('hidden'));
				// document.querySelectorAll(".controls").forEach(e => e.classList.add('hidden'));
			}, 1000);
		})
	}

	document.querySelector('input.lecture_mode').addEventListener('change', function () {
		if (this.checked) {
			document.querySelector('#container').classList.add('lecture_skip');
		} else {
			document.querySelector('#container').classList.remove('lecture_skip');
		}
	});

	document.querySelector('#latex_icon').addEventListener('click', function () {
		baseRenderer.then(cranach => {
			bootstrap.Modal.getOrCreateInstance(document.querySelector('#text_modal')).toggle();
			showLatex(cranach);
		});
	});
	document.querySelector('#beamer_icon').addEventListener('click', function () {
		baseRenderer.then(cranach => {
			bootstrap.Modal.getOrCreateInstance(document.querySelector('#text_modal')).toggle();
			showLatex(cranach, 'beamer');
		});
	});
	document.querySelector('#xml_icon').addEventListener('click', function () {
		baseRenderer.then(cranach => {
			bootstrap.Modal.getOrCreateInstance(document.querySelector('#text_modal')).toggle();
			showXML(cranach);
		});
	});

	document.querySelector('#xmlInput').addEventListener('change', function () {
		baseRenderer = openXML(baseRenderer, this);
	});

	document.querySelectorAll('.dropdown-item.persist').forEach(item => {
		item.addEventListener('click', function (e) {
			e.stopPropagation();
			e.preventDefault();
		});
	});

	document.querySelector('#latexMacrosInput').addEventListener('change', function () {
		const file = this.files[0];
		const reader = new FileReader();
		
		reader.addEventListener("load", async function () {
			const renderer = await baseRenderer;
			renderer.macrosString = reader.result;
			
			const domParser = new DOMParser();
			renderer.macros = domParser.parseFromString(`<div>\\(${renderer.macrosString}\\)</div>`, "text/xml");
			
			await renderer.render(document.getElementById('output'));
			await MathJax.startup.promise;
			await MathJax.tex2chtmlPromise(renderer.macrosString);
			
			postprocess(renderer);
			convertCranachDocToWb(renderer.cranachDoc, ace.edit("input"));
		  });

		// reader.addEventListener("load", function () {
		// 	baseRenderer.then(renderer => {
		// 		renderer.macrosString = reader.result;
		// 		const domparser = new DOMParser();
		// 		renderer.macros = domparser.parseFromString('<div>\\(' + this.macrosString + '\\)</div>', "text/xml");
		// 		return renderer.render(document.getElementById('output'));
		// 	})
		// 	.then(renderer => {
		// 		// MathJax.startup.defaultReady();
		// 		MathJax.startup.promise.then(() => {
		// 			// MathJax.startup.document.state(0);
		// 			// MathJax.texReset();
		// 			return MathJax.tex2chtmlPromise(renderer.macrosString);
		// 		}).then(() => {
		// 			postprocess(renderer);
		// 			convertCranachDocToWb(renderer.cranachDoc, ace.edit("input"));
		// 		});
		// 	});
		// });
		reader.readAsText(file);
	});

});