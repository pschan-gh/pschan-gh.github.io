var eqStrings;
var global_valuess = new Array();
var range;
var eqIndex = 0;

//settings
var numSamples = 20;
var  basicPlotOptions, options, glOptions;

var nullDatas = [{nRows: numSamples, nCols: numSamples, formattedValues: null, scaleFactor: 1, colourGradient: [{rgb:{red:0, green:0, blue:0}, alpha:0}]}];
//end settings

class eqStruct {
    constructor(surfaceplot, eqInfo, isParam) {
        this.surfaceplot = surfaceplot;
        this.eqInfo = eqInfo;
        this.isParam = isParam;
        this.index = eqIndex;

        console.log(eqInfo + ' ' + isParam);

        var input = document.createElement("div");

        let container;
        let num_equations = 0;
        let num_params = 0;

        num_equations = document.getElementById("equations").childElementCount;
        if (document.getElementById("param_equations")!= null) {
            num_params = document.getElementById("param_equations").childElementCount;
        }
        this.index = eqIndex;
        if(!isParam) {
            container = document.getElementById("equations");
            input.className = "input"; // set the CSS class
            // this.index = num_equations;
            // input.id = "input" + this.index;
        } else {
            container = document.getElementById("param_equations");
            input.className = "param_input";
            // this.index = num_params;
            // input.id = "param_input" + this.index;
        }

        input.id = input.className + this.index;

        container.appendChild(input);

        let eqdiv = document.createElement("div");
        eqdiv.className = "eqdiv";

        let show = document.createElement("input");
        show.type = "checkbox";
        show.className = 'show large';
        show.value = "1";
        show.checked = "true";
        show.style.cssFloat = "left";
        show.style.marginLeft = '5px';
        show.style.marginTop = '2px';

        // let close = document.createElement("button");
        let close = document.createElement("span");
        // close.className = 'btn btn-outline-info btn-xs';
        close.className = 'material-icons';
        close.style.cssFloat = "left";
        // close.style.width = "2em";
        // close.style.height = "1em";
        close.style.border = 'solid 2px';
        close.style.margin = '2px';
        close.style.borderRadius = '5px';
        // close.style.fontSize = '0.75em';
        // close.style.textAlign = 'center';
        // close.innerHTML = '<span class="material-icons">close</span>';
        close.innerHTML = 'close';

;


        let equationinput = document.createElement("input");
        equationinput.className = "equationinput"; // set the CSS class
        if(!isParam) {
            equationinput.id = "equationinput" + this.index;
        } else {
            equationinput.id = "paramequationinput" + this.index;
        }
        equationinput.type = "text";

        equationinput.value = eqInfo == null ? "" : eqInfo.str;

        var color1 = document.createElement("input");

        color1.type = "color";
        color1.className = "color1 color";
        color1.style.cssFloat = "right";
        color1.style.height = "1.75em";
        color1.style.width = "2em";

        // let k = num_equations + num_params;
        // console.log(k);
        if(eqInfo.color == "") {
            var hue = (0.55 + eqIndex*0.37) % 1;
            var saturation = (hue > 0.45) && (hue < 0.6) ? 0.5 : 0.3;
            var color = HSVtoRGB(hue, saturation, 0.85);
            color1.value = "#" + rgbToHex(color);
        } else {
            color1.value = "#" + eqInfo.color;
        }
        this.color = color1.value;

        var alpha = document.createElement("input");
        alpha.type = "number";
        alpha.min = "0.5";
        alpha.max = "1";
        alpha.step = "0.2";
        alpha.style.width = "2.5em";
        alpha.style.color = "#888";
        alpha.style.cssFloat = "right";
        alpha.className = 'alpha'

        alpha.value = eqInfo.alpha == null ? "0.9":parseFloat(eqInfo.alpha);

        input.appendChild(close);
        input.appendChild(show);
        input.appendChild(eqdiv);
        input.appendChild(color1);
        input.appendChild(alpha);


        eqdiv.appendChild(equationinput);

        if(isParam) {
            color1.style.display="none";
            alpha.style.display="none";

            var properties = document.createElement("div");
            properties.className = "properties";

            var domainButton = document.createElement("button");
            domainButton.type="button";
            domainButton.className ="btn btn-outline-info btn-sm";
            domainButton.style.cssFloat = "right";
            domainButton.style.display = "inline-block";
            domainButton.style.marginRight = "0px";
            domainButton.style.marginLeft = "0px";

            domainButton.innerHTML = "More";
            domainButton.onclick = function() {eqdiv.style.paddingBottom = "4px";properties.style.display = "block";this.style.display = "none";color1.style.display="inline";alpha.style.display="inline";};
            input.appendChild(domainButton);


            let sdomain = document.createElement("div");
            let tdomain = document.createElement("div");

            sdomain.className = "domain";
            sdomain.style.clear="left";
            sdomain.style.cssFloat="left";
            sdomain.style.marginLeft="20px";
            tdomain.className = "domain"
            tdomain.style.cssFloat="left"
            tdomain.style.marginLeft="4px";

            sdomain.innerHTML = "<span>$s \\in$</span>";
            tdomain.innerHTML="<span>$t \\in$</span>";

            var sdomaininput = document.createElement("input");
            sdomaininput.type = "text";
            sdomaininput.value = eqInfo.domain.s;
            sdomaininput.style.width="3em";
            sdomaininput.className = "sdomain";

            var tdomaininput = document.createElement("input");
            tdomaininput.type = "text";
            tdomaininput.value = eqInfo.domain.t;
            tdomaininput.style.width="3em";
            tdomain.className = "domain";
            tdomaininput.className = "tdomain";

            sdomain.appendChild(sdomaininput);
            tdomain.appendChild(tdomaininput);

            var submit = document.createElement("button");
            submit.type = "button";
            submit.className ="btn btn-outline-info btn-sm";
            submit.style.cssFloat = "right";
            submit.innerHTML="Graph";
            submit.addEventListener("click", function() {
                console.log('graphing');
                color1.style.display="inline-block";
                alpha.style.display = "inline-block";
                eqStructs.singleUpdate(input);
                eqStructs.evaluate();
                setUp(surfaceplot, global_valuess);
                properties.style.display = "none";
            });

            properties.appendChild(sdomain);
            properties.appendChild(tdomain);
            properties.appendChild(submit);

            input.appendChild(properties);

            MathJax.Hub.Queue(["Typeset", MathJax.Hub, sdomain]);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, tdomain]);

            equationinput.addEventListener("change", function() {
                try {
                    if(equationinput.value == "") {
                        submit.innerHTML = "Remove";
                    }
                } catch(a) {}
            },false);
            equationinput.addEventListener("keypress", function(e) {
                try {
                    if(e.keyCode == 13) {
                        domainButton.click();
                    }
                } catch(a){}
            },false);
        }

        if(!isParam) {
            equationinput.addEventListener("change",function(){
                try {
                    eqStructs.singleUpdate(input);
                    eqStructs.evaluate();
                    setUp(surfaceplot, global_valuess);
                } catch(a) {}
            },false);
            // equationinput.addEventListener("keypress", function(e) {
            //     try {
            //         if (e.keyCode == 13) {
            //             eqStructs.singleUpdate(input);
            //         }
            //     } catch(a) {}
            // },false);
        }
        alpha.addEventListener("change", function() {
            try {
                eqStructs.update();
                setUp(surfaceplot, global_valuess);
            } catch(a) {
                alert(a)
            }
        },false);
        color1.addEventListener("change", function() {
            try {
                eqStructs.update();
                setUp(surfaceplot, global_valuess);
            } catch(a) {
                alert(a)
            }
        },false);
        show.addEventListener("change", function() {
            try {
                eqStructs.update();
                setUp(surfaceplot, global_valuess);
            } catch(a) {
                alert(a)
            }
        },false);
        close.addEventListener("click", function() {
            let input = isParam ? $(this).closest('div.param_input').first()[0] : $(this).closest('div.input').first()[0];
            console.log('DELETE ' + input.id);
            delete eqStructs.eqStructArray[input.id];
            input.parentNode.removeChild(input);
            eqStructs.update();
            setUp(surfaceplot, global_valuess);
        });

        eqIndex++;
        input.dataset.isParam = this.isParam;
        this.inputDiv = input;
    }
}

function init_settings(rotationMatrix, dimensions) {

    var background = '#f8f8f8';
    var axisForeColour = '#444444';
    var hideFloorPolygons = false;

    var zscale = document.getElementById("zscale");
    var domain = document.getElementById("domain");
    var xscale = document.getElementById("xscale");
    var yscale = document.getElementById("yscale");
    var numsamples = document.getElementById("numsamples");

    /*checkboxes*/
    var autozscale = document.getElementById("autozscale");
    autozscale.checked = autozscale.value == 1?true:false;
    var showaxes = document.getElementById("showaxes");
    showaxes.checked = showaxes.value == 1?true:false;
    var centeredaxes = document.getElementById("centeredaxes");
    centeredaxes.checked = centeredaxes.value == 1?true:false;

    var xmin = document.getElementById("xmin");
    var xmax = document.getElementById("xmax");
    var ymin = document.getElementById("ymin");
    var ymax = document.getElementById("ymax");
    var zmin = document.getElementById("zmin");
    var zmax = document.getElementById("zmax");

    var xticks = document.getElementById("xticks");
    var yticks = document.getElementById("yticks");
    var zticks = document.getElementById("zticks");

    numSamples = numsamples.value;

    range = {xmin: +(xmin.value), xmax: +(xmax.value), ymin: +(ymin.value), ymax: +(ymax.value), zmin: +(zmin.value), zmax: +(zmax.value)};

    options = {xPos: 0, yPos: 0, width: dimensions[0], height: dimensions[1], xTitle: "x", yTitle: "y", zTitle: "z", backColour: background, axisTextColour: axisForeColour, hideFlatMinPolygons: hideFloorPolygons, startXAngle: 300, startZAngle: 240, Range: range, centeredAxes: centeredaxes.value, rotationMatrix:rotationMatrix};

    basicPlotOptions = {fillPolygons: false, tooltips: null, renderPoints: false}

    glOptions = { chkControlId: "allowWebGL", autoCalcZScale: autozscale.value, showAxes: showaxes.value, animate: false, xTicksNum: xticks.value, yTicksNum: yticks.value, zTicksNum: zticks.value};

}

function getURL(surfaceplot, path) {
    var params = ['zscale', 'domain', 'numsamples', 'autozscale', 'showaxes', 'centeredaxes', 'xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax', 'xticks', 'yticks', 'zticks'];

    var url = path + "/index.php?sidebar=0&";

    for(var i = 0; i < params.length; i++) {
	if(i > 0)
	    url = url + "&";
	url = url + params[i] + "=" + document.getElementById(params[i]).value;
    }


    var eqsarray = eqStructs.eqStructArray;

    for (const i in eqsarray) {
	url = url + "&equations[" + i + "]='" + encodeURIComponent(eqsarray[i].str) + "'";
	if(eqsarray[i].isParam) {
	    url = url + "&sdomain[" + i + "]='" + eqsarray[i].domain.sMin + "," + eqsarray[i].domain.sMax + "'";
	    url = url + "&tdomain[" + i + "]='" + eqsarray[i].domain.tMin + "," + eqsarray[i].domain.tMax + "'";
	}

	url = url + "&colors[" + i + "]='" + rgbToHex(eqsarray[i].colourGradient[0].rgb) +"'";
	url = url + "&alphas[" + i + "]=" + eqsarray[i].colourGradient[0].alpha;
    }

    var rotMat = surfaceplot.surfacePlot.rotationMatrix;
    for (i = 0; i < rotMat.length; i++)
	rotMat[i] = Math.round(100*rotMat[i])/100;

    url = url + "&rotationMatrix=[" + rotMat +"]";

    return url;
}

function getJSON(surfaceplot, path) {
    var params = ['zscale', 'domain', 'numsamples', 'autozscale', 'showaxes', 'centeredaxes', 'xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax', 'xticks', 'yticks', 'zticks'];

    var data = {};

    data.sidebar = 0;

    params.forEach(param => {
        data[param] = document.getElementById(param).value;
    });

    var eqsarray = eqStructs.eqStructArray;
    data.equations = new Array();
    // data.colors = new Array();
    // data.alphas = new Array();
    // data.sdomain = new Array();
    // data.tdomain = new Array();

    let i = 0;
    for (const k in eqsarray) {
        data.equations[i] = {};
        data.equations[i].isParam = false;
        data.equations[i].formula = eqsarray[k].str;
        if(eqsarray[k].isParam) {
            data.equations[i].isParam = true;
            data.equations[i].domain =  {
                s : eqsarray[k].domain.sMin + ',' + eqsarray[k].domain.sMax,
                t : eqsarray[k].domain.tMin + ',' + eqsarray[k].domain.tMax
            }

        }
        data.equations[i].color= rgbToHex(eqsarray[k].colourGradient[0].rgb);
        data.equations[i].alpha= eqsarray[k].colourGradient[0].alpha;
        i++;
    }

    var rotMat = surfaceplot.surfacePlot.rotationMatrix;
    for (i = 0; i < rotMat.length; i++) {
        rotMat[i] = Math.round(100*rotMat[i])/100;
    }

    data.rotationMatrix = rotMat;
    console.log(data);
    return path + '?data=' + encodeURIComponent(JSON.stringify(data));
}

function shareURL(surfaceplot, path) {

    // shareOverlay = document.getElementById('share-overlay');
    //
    // shareOverlay.display = 'block';

    // url = getURL(surfaceplot, path);
    url = getJSON(surfaceplot, path);

    $('.share').val(url);
    $('.embed').val("<iframe style=\"width:100%;height:500px\" frameBorder=\"0\" src=\"" + url + "&dimensions=[480,480]\"></iframe>");
}

function add_equation(surfaceplot, eqInfo, isParam) {
    let eqstruct = new eqStruct(surfaceplot, eqInfo, isParam); // testing
    console.log(eqstruct);
}

function latexfy (parent, str) { /* parent should be of eqdiv class */
    var eqs = str.split(",");
    var mathDiv = document.createElement("div");
    mathDiv.className = "mathdiv";
    mathDiv.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();

    mathDiv.style.textAlign = eqs.length == 1?"center":"left";

    mathDiv.style.overflow = "hidden";
    mathDiv.style.width = "100%";

//    alert(parent.id);
    parent.childNodes[0].style.display = "none";
    parent.appendChild(mathDiv);

    if(eqs.length == 1) {
	mathDiv.innerHTML = "$\\displaystyle z = " + math.parse(eqs[0]).toTex() + "$";
    }
    else {
	mathDiv.innerHTML = "<ul><li>$x = " + math.parse(eqs[0]).toTex() + "$<li> $y = "+ math.parse(eqs[1]).toTex() + "$<li>$z = " + math.parse(eqs[2]).toTex() + "$</ul>";
    }

    MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathDiv]);

    if ( eqs.length > 1 ){
        parent.parentNode.childNodes[5].style.display = "none";
        parent.parentNode.childNodes[3].style.display = "block";
        parent.parentNode.childNodes[4].style.display = "block";
    }

    mathDiv.onclick = function() {
        parent.removeChild(mathDiv);
        parent.childNodes[0].style.display = "block";
        if (eqs.length > 1) {
            parent.parentNode.childNodes[5].style.display = "block";
            parent.parentNode.childNodes[3].style.display = "none"; parent.parentNode.childNodes[4].style.display = "none";
        }
    };
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
    return componentToHex(color.red) + componentToHex(color.green) + componentToHex(color.blue);
}


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
    } : null;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        red: Math.round(r * 255),
        green: Math.round(g * 255),
        blue: Math.round(b * 255)
    };
}

eqStructs = function() {

    this.inputList = document.getElementsByClassName("input");
    this.eqstrings = new Array();
    this.eqList = document.getElementsByClassName("equationinput");
    this.eqStructArray = new Object();

    this.cleanup = function() {
	var show_new_equation = 1;

	for (var k = this.eqList.length - 1; k >= 0 ; k--) {
	    var element = this.eqList.item(k);
	    if(element.value == "") {
		show_new_equation = 0;
		element.parentNode.parentNode.parentNode.removeChild(element.parentNode.parentNode);
	    }
	}

	this.inputList = document.getElementsByClassName("input");

	for(var k = 0; k < this.inputList.length; k++) {
	    this.inputList.item(k).id = "input" + k;
	}

	this.eqList = document.getElementsByClassName("equationinput");

	for( k = 0; k < this.eqList.length; k++) {
	    this.eqList.item(k).id = "equationinput" + k;
	}

	var mathDivs = document.getElementsByClassName("mathdiv");
	while(mathDivs.length > 0) {
	    mathDivs[0].parentNode.removeChild(mathDivs[0]);
	}
    }

    this.singleUpdate = function(inputDiv) {

        var color = hexToRgb($(inputDiv).find('.color').first().val());
        var alpha = $(inputDiv).find('.alpha').first().val();
        var colourGradient = [{rgb:color, alpha:alpha}];

        console.log(inputDiv);
        if (inputDiv.dataset.isParam == 'false') {
            this.constructArray({
                id : inputDiv.id,
                str : $(inputDiv).find('.equationinput').first().val(),
                colourGradient : colourGradient,
                show : $(inputDiv).find('.show').first()[0].checked,
                isParam : false,
                colourGradient : colourGradient
            });
        } else {
            let sdomain = $(inputDiv).find('.sdomain').first().val().split(',');
            let tdomain = $(inputDiv).find('.tdomain').first().val().split(',');
            this.constructArray({
                id : inputDiv.id,
                str : $(inputDiv).find('.equationinput').first().val(),
                colourGradient : colourGradient,
                show : $(inputDiv).find('.show').first()[0].checked,
                domain : {
                    sMin:parseFloat(sdomain[0]),
                    sMax:parseFloat(sdomain[1]),
                    tMin : parseFloat(tdomain[0]),
                    tMax:parseFloat(tdomain[1])
                },
                isParam:true,
                colourGradient : colourGradient
            });
        }

        latexfy($(inputDiv).find('.eqdiv').first()[0], $(inputDiv).find('.equationinput').first().val());
        document.getElementById("new_equation").style.display="block";
    	document.getElementById("new_param").style.display="block";
    }

    this.update = function() {
        this.cleanup();
        this.eqStructArray = new Object();

        this.inputList = document.getElementsByClassName("input");
        for(var k = 0; k < this.inputList.length; k++) {
            this.singleUpdate(this.inputList.item(k));
        }

        this.inputList = document.getElementsByClassName("param_input");

        for(var k = 0; k < this.inputList.length; k++) {
            this.singleUpdate(this.inputList.item(k));
        }
        //document.getElementById("share-div").style.display="none";
        this.evaluate();
    }

    this.constructArray = function(eqStruct) {
        // this.eqStructArray.push(eqStruct);
        this.eqStructArray[eqStruct['id']] = eqStruct;
    }

    this.evaluate = function() {
        global_valuess = values_gen(this.eqStructArray);
    }

}


function listen(surfaceplot) {

    var zscale = document.getElementById("zscale");
    var domain = document.getElementById("domain");
    var xscale = document.getElementById("xscale");
    var yscale = document.getElementById("yscale");
    var numsamples = document.getElementById("numsamples");

    var autozscale = document.getElementById("autozscale");
    var showaxes = document.getElementById("showaxes");
    var centeredaxes = document.getElementById("centeredaxes");

    var zmin = document.getElementById("zmin");
    var zmax = document.getElementById("zmax");

    var xticks = document.getElementById("xticks");
    var yticks = document.getElementById("yticks");
    var zticks = document.getElementById("zticks");

    var num_equations = document.getElementById("equations").childElementCount;

    xticks.addEventListener("change",function(){try{glOptions.xTicksNum=parseInt(this.value);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);
    yticks.addEventListener("change",function(){try{glOptions.yTicksNum=parseInt(this.value);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);
    zticks.addEventListener("change",function(){try{glOptions.zTicksNum=parseInt(this.value);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);

    autozscale.addEventListener("change",function(){try{this.value = this.checked ? 1 : 0;glOptions.autoCalcZScale = this.value;setUp(surfaceplot, global_valuess);document.getElementById("zscale-div").style.display=this.checked?"block":"none";document.getElementById("zrange").style.display=this.checked?"none":"block"}catch(a){}},false);
    showaxes.addEventListener("change",function(){try{this.value = this.checked ?1:0;glOptions.showAxes = this.value;setUp(surfaceplot, global_valuess)}catch(a){}},false);
    centeredaxes.addEventListener("change",function(){try{this.value = this.checked?1:0;options.centeredAxes=this.value;setUp(surfaceplot, global_valuess)}catch(a){}},false);

    zscale.addEventListener("change",function(){try{setUp(surfaceplot, global_valuess)}catch(a){}},false);

    numsamples.addEventListener("change",function(){try{numSamples=this.value;global_valuess = values_gen(eqStructs.eqStructArray);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}}, false);

    domain.addEventListener("change",function(){try{range.xmin=-parseInt(this.value);range.xmax=parseInt(this.value);range.ymin=-parseInt(this.value);range.ymax=parseInt(this.value);document.getElementById("xmin").value = range.xmin;document.getElementById("xmax").value = range.xmax;document.getElementById("ymin").value = range.ymin;document.getElementById("ymax").value = range.ymax;eqStructs.update();eqStructs.evaluate();setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);


    zmin.addEventListener("change",function(){try{range.zmin=parseInt(this.value);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);
    zmax.addEventListener("change",function(){try{range.zmax=parseInt(this.value);setUp(surfaceplot, global_valuess)}catch(a){alert(a)}},false);

}

function parametric_gen(paramFunc) {

    var numRows = numSamples;
    var numCols = numSamples;

    var domain;
    var exp;

    if (paramFunc.isParam) {
        domain = paramFunc.domain;
        exps = paramFunc.str.split(",");
        exp = {x:exps[0], y:exps[1], z:exps[2]};
    } else {
        domain = {sMin:range.xmin, sMax:range.xmax, tMin:range.ymin, tMax:range.ymax};
        exp = {x:"x", y:"y", z:paramFunc.str};
    }

    var sRange = domain.sMax - domain.sMin;
    var tRange = domain.tMax - domain.tMin;

    var values = null;
    values = new Array();

    var s = 0;
    var t = 0;
    if(exp.x != "") {
        for (var i = 0; i < numRows; i++)  {
            values[i] = new Array();

            for (var j = 0; j < numCols; j++) {
                s = (i+0.5)*sRange/numRows + domain.sMin;
                t = (j+0.5)*tRange/numCols + domain.tMin;

                if (paramFunc.isParam) {
                    values[i][j] = {
                        x:math.eval(exp.x, {s:s, t:t}),
                        y:math.eval(exp.y, {s:s, t:t}),
                        z:math.eval(exp.z, {s:s, t:t})
                    };
                } else {
                    values[i][j] = {
                        x:math.eval(exp.x, {x:s, y:t}),
                        y:math.eval(exp.y, {x:s, y:t}),
                        z:math.eval(exp.z, {x:s, y:t})
                    };
                }
            }
        }
    } else {
        values = null;
    }
    return values;
}

function values_gen(paramFuncs)
{
    var numRows = numSamples;
    var numCols = numSamples;

    var domain;

    var valuess = new Object();
    console.log(paramFuncs);
    for(const k in paramFuncs) {
        valuess[k] = parametric_gen(paramFuncs[k]);
    }
    console.log(valuess);
    return valuess;
}

function setUp(surfaceplot, valuess) {

    options.Range=range;

    var temp_valuess = null;
    // temp_valuess = valuess.map(function(arr) {
    //     if ( arr!=null ) {
    //         return arr.slice();
    //     } else {
    //         return null;
    //     }
    // });
    temp_valuess = valuess;

    var datas = null;
    datas = new Array();

    var scaleFactor = 1/Math.pow(2, document.getElementById("zscale").value);

    // for(k = 0; k < eqStructs.eqStructArray.length; k++) {
    for(const k in eqStructs.eqStructArray) {
        if(temp_valuess[k] != null && eqStructs.eqStructArray[k].show) {
            datas.push({nRows: numSamples, nCols: numSamples, formattedValues: temp_valuess[k], scaleFactor: scaleFactor, colourGradient:eqStructs.eqStructArray[k].colourGradient});
        }
    }

    if(datas.length == 0)
	datas[0] = {nRows: numSamples, nCols: numSamples, formattedValues: null, scaleFactor: scaleFactor, colourGradient: [{rgb:{red:0,green:0,blue:0},alpha:0}]};

    surfaceplot.newContext(datas, options, basicPlotOptions, glOptions);

    surfaceplot.draw(datas, glOptions, options);

    // var url = getURL(surfacePlot, path);
    var url = getJSON(surfacePlot, path);

    $('#brand').html('<a style="color:#ddd" onmouseover="this.style.color=\'SteelBlue\'" onmouseout="this.style.color=\'#ddd\'" href="' + url +'" target="_blank">WebGL<br>Surface Grapher</a>');
}
