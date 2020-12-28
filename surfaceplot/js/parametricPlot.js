/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Much of the code is "borrowed" from the webgl-surface-plot (https://github.com/gregross/webgl-surface-plot) project by Greg Ross.

Aside from mostly cosmetic modifications, the main change is that the renderer can now:
1. Render multiple graphs.
2. Render graphs of parametric functions.
3. Provide some touchscreen functionalities.

Borrower: Ping-Shun Chan
*/

/*
 * SurfacePlot.js
 *
 *
 * Written by Greg Ross
 *
 * Copyright 2012 ngmoco, LLC.  Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0.  Unless required by applicable
 * law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the
 * License.
 *
 */
/*
 * This is the main class and entry point of the tool
 * and represents the Google viz API.
 * ***************************************************
 */

SurfacePlot = function(container){
    this.containerElement = container;
    
};

SurfacePlot.prototype.newContext = function(datas, options, basicPlotOptions, glOptions){
    
    var xPos = options.xPos;
    var yPos = options.yPos;
    var w = options.width;
    var h = options.height;

    var colourGradients = new Array();
    for (var k = 0; k < datas.length; k++)
	colourGradients[k] = datas[k].colourGradient;
    
    var fillPolygons = basicPlotOptions.fillPolygons;
    var tooltips = basicPlotOptions.tooltips;
    var renderPoints = basicPlotOptions.renderPoints;
    
    var xTitle = options.xTitle;
    var yTitle = options.yTitle;
    var zTitle = options.zTitle;
    var backColour = options.backColour;
    var axisTextColour = options.axisTextColour;
    var hideFlatMinPolygons = options.hideFlatMinPolygons;
    var tooltipColour = options.tooltipColour;
    var origin = options.origin;
    var startXAngle_canvas = options.startXAngle;
    var startZAngle_canvas = options.startZAngle;
    var zAxisTextPosition = options.zAxisTextPosition;
    var rotationMatrix = options.rotationMatrix;


    if (this.surfacePlot) {
  	var isOpenGL = function() {
  	    var openGLSelected = true;
  	    if (glOptions.chkControlId && document.getElementById(glOptions.chkControlId)) 
                openGLSelected = document.getElementById(glOptions.chkControlId).checked;
  	    
  	    return openGLSelected;
  	}
  	
  	this.surfacePlot.cleanUp();
  	this.containerElement.innerHTML = "";
	
	startXAngle_canvas = this.surfacePlot.currentXAngle_canvas;
	startZAngle_canvas = this.surfacePlot.currentZAngle_canvas;

	var rotationMatrix = this.surfacePlot.rotationMatrix;
	
    } else {
	rotationMatrix = options.rotationMatrix;
    }
    
    
    this.surfacePlot = new JSSurfacePlot(xPos, yPos, w, h, colourGradients, this.containerElement, fillPolygons, tooltips, xTitle, yTitle, zTitle, renderPoints, backColour, axisTextColour,  hideFlatMinPolygons, tooltipColour, origin, startXAngle_canvas, startZAngle_canvas, rotationMatrix, zAxisTextPosition, glOptions, datas, options);
    
};

SurfacePlot.prototype.draw = function(datas, glOptions, options){
 
    this.surfacePlot.datas = datas;

    this.numXPoints = 0;
    this.numYPoints = 0;
    this.datas = null;
    this.colourGradientObjects = null;
    this.glSurfaces = null;
    this.glAxes = null;
    this.shaderProgram = null;
    this.shaderTextureProgram = null;
    this.shaderAxesProgram = null;
    this.mvMatrix = null;
    this.mvMatrixStack = null;
    this.pMatrix = null;

    if(datas[0].formattedValues == null)
	return;

    if(this.surfacePlot.anim_id != null) {
	try{cancelAnimationFrame(this.surfacePlot.anim_id)}
	    catch(a){alert(a)};;
    }

    this.surfacePlot.reRender(datas, glOptions, options);
};

Array.prototype.clone = function() {
    var arr = this.slice(0);
    for( var i = 0; i < this.length; i++ ) {
        if( this[i].clone ) {
            arr[i] = this[i].clone();
        }
    }
    return arr;
}



SurfacePlot.prototype.cleanUp = function(){
    if (this.surfacePlot == null) 
        return;
    
    this.surfacePlot.cleanUp();
    this.surfacePlot = null;
}

/*
 * This class does most of the work.
 * *********************************
 */
JSSurfacePlot = function(x, y, width, height, colourGradients, targetElement, fillRegions, tooltips, xTitle, yTitle, zTitle, renderPoints, backColour, axisTextColour, hideFlatMinPolygons, tooltipColour, origin, startXAngle_canvas, startZAngle_canvas, rotationMatrix, zAxisTextPosition, glOptions, datas, options) {
    this.xTitle = xTitle;
    this.yTitle = yTitle;
    this.zTitle = zTitle;
    this.backColour = backColour;
    this.axisTextColour = axisTextColour;
    this.glOptions = glOptions;
    
    this.xMin = parseInt(options.Range.xmin);
    this.xMax = parseInt(options.Range.xmax);
    this.yMin = parseInt(options.Range.ymin);
    this.yMax = parseInt(options.Range.ymax);
    this.zMin = parseInt(options.Range.zmin);
    this.zMax = parseInt(options.Range.zmax);

    this.minXValue = null;
    this.maxXValue = null;
    this.minYValue = null;
    this.maxYValue = null;
    this.minZValue = null;
    this.maxZValue = null;

    this.pos_offset = {x: 0, y: 0, z: 0};

    this.rel_scaleFactor = 1;

    var targetDiv;
    var id;
    var canvas;
    var canvasContext = null;
    this.context2D = null;
    var scale = JSSurfacePlot.DEFAULT_SCALE;
    var zTextPosition = 0;
    
    if (startXAngle_canvas != null && startXAngle_canvas != void 0) 
        this.currentXAngle_canvas = startXAngle_canvas;
    else
	this.currentXAngle_canvas = JSSurfacePlot.DEFAULT_X_ANGLE_CANVAS;
    
    if (startZAngle_canvas != null && startZAngle_canvas != void 0) 
        this.currentZAngle_canvas = startZAngle_canvas;
    else
        this.currentZAngle_canvas = JSSurfacePlot.DEFAULT_Z_ANGLE_CANVAS;
    
    if (rotationMatrix != null && rotationMatrix != void 0) 
	this.rotationMatrix = rotationMatrix;
    else { 
	this.rotationMatrix = mat4.create();
	mat4.identity(this.rotationMatrix);
	mat4.rotate(this.rotationMatrix, degToRad(this.currentXAngle_canvas), [1, 0, 0]);
	mat4.rotate(this.rotationMatrix, degToRad(this.currentZAngle_canvas), [0, 0, 1]);
    }
    
    if (zAxisTextPosition != null && zAxisTextPosition != void 0) 
        zTextPosition = zAxisTextPosition;
    
    this.datas = datas;
    var data3dss = null;
    var displayValues = null;
    this.numXPoints = 0;
    this.numYPoints = 0;
    var transformation;
    var cameraPosition;
    var colourGradients;
    
    var mouseDown1 = false;
    var mouseDown3 = false;
    var mousePosX = null;
    var mousePosY = null;
    var lastMousePos = new Point(0, 0);
    var mouseButton1Up = null;
    var mouseButton3Up = null;
    var mouseButton1Down = new Point(0, 0);
    var mouseButton3Down = new Point(0, 0);
    var closestPointToMouse = null;
    var xAxisHeader = "";
    var yAxisHeader = "";
    var zAxisHeader = "";
    var xAxisTitleLabel = new Tooltip(true);
    var yAxisTitleLabel = new Tooltip(true);
    var zAxisTitleLabel = new Tooltip(true);
    var tTip = new Tooltip(false, tooltipColour);
    
    this.anim_id = null;
    
    this.glSurface = null;
    this.glAxes = null;
    this.glSurfaces = null;
    this.glAxes2 = null;
    this.useWebGL = false;
    this.gl = null;
    this.shaderProgram = null;
    this.shaderTextureProgram = null;
    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();

    var mouseWheel = true;
    var mouseDown = false;
    var gestureStart = false;
    
    var lastScale = null;
    var lastMouseX = null;
    var lastMouseY = null;
    var lastXAngle = 315;
    var lastZAngle = 240;
    var canvas_support_checked = false;
    var canvas_supported = true;
    
    this.reRender = function(datas, glOptions, options) {

	this.xMin = options.Range.xmin;
	this.xMax = options.Range.xmax;
	this.yMin = options.Range.ymin;
	this.yMax = options.Range.ymax;
	this.zMin = options.Range.zmin;
	this.zMax = options.Range.zmax;
	
	this.pos_offset = {x: 0, y: 0, z: 0};
	
	this.bail = true;
	this.glOptions = glOptions;
	this.datas = datas;
	this.dataToRenders = null;
	this.dataToRenders = new Array();

	this.centeredAxes = options.centeredAxes;

	for (var k = 0; k < this.datas.length; k++) {
	    if(this.datas[k].formattedValues != null){
		this.dataToRenders[k] = new Array();
		for (var i = 0; i < this.datas[k].formattedValues.length; i++) {
		    this.dataToRenders[k][i] = new Array();
		    for (var j = 0; j < this.datas[k].formattedValues[i].length; j++) {
			this.dataToRenders[k][i][j] = {
			    x:this.datas[k].formattedValues[i][j].x,
			    y:this.datas[k].formattedValues[i][j].y,
			    z:this.datas[k].formattedValues[i][j].z
			}
		    }
		}
	    }
	}

	this.glOptions.xTicksNum = this.glOptions.xTicksNum;
        this.glOptions.yTicksNum = this.glOptions.yTicksNum;

	this.calculateZScale(this.glOptions.autoCalcZScale);

        
	var cGradients = new Array();
	for (var k = 0; k < this.datas.length; k++)
	    cGradients.push(this.datas[k].colourGradient);

	this.colourGradientObjects = new Array();

	for(k = 0; k < cGradients.length; k++)
            this.colourGradientObjects.push(new ColourGradient(this.minZValue, this.maxZValue, cGradients[k]));

        
        var canvasWidth = width;
        var canvasHeight = height;
        
        var minMargin = 20;
        var drawingDim = canvasWidth - minMargin * 2;
        var marginX = minMargin;
        var marginY = minMargin;
        
        if (canvasWidth > canvasHeight) {
            drawingDim = canvasHeight - minMargin * 2;
            marginX = (canvasWidth - drawingDim) / 2;
        }
        else 
            if (canvasWidth < canvasHeight) {
                drawingDim = canvasWidth - minMargin * 2;
                marginY = (canvasHeight - drawingDim) / 2;
            }
        
        var xDivision = 1 / (this.numXPoints - 1);
        var yDivision = 1 / (this.numYPoints - 1);
        var xPos, yPos;
        var i, j, k;
        var numPoints = this.numXPoints * this.numYPoints;

        data3dss = new Array();
	
        for(k = 0; k < this.dataToRenders.length; k++) {
	    data3dss[k] = new Array();
	    var index = 0;
            var colIndex;
            for (i = 0, xPos = -0.5; i < this.numXPoints; i++, xPos += xDivision) {
		for (j = 0, yPos = 0.5; j < this.numYPoints; j++, yPos -= yDivision) {
                    var s = xPos;
                    var t = yPos;
                    
                    if (this.useWebGL) 
			colIndex = this.numYPoints - 1 - j;
                    else 
			colIndex = j;


		    if(this.dataToRenders[k]!=null) {
			x = this.dataToRenders[k][i][colIndex].x;
			y = this.dataToRenders[k][i][colIndex].y;
			z = this.dataToRenders[k][i][colIndex].z;
			data3dss[k][index] = new Point3D(x, y, z);
		    }
		    index++;
		}
            }
	}
	
	var r = hexToR(this.backColour) / 255;
        var g = hexToG(this.backColour) / 255;
        var b = hexToB(this.backColour) / 255;
     
        this.initWorldObjects(data3dss);
	
	this.gl.clearColor(r, g, b, 1); // Set the background colour.


//	this.allFramesRendered = false;
	this.bail = false;
	this.tick();
	
    }
    
    function getInternetExplorerVersion() // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    {
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) 
                rv = parseFloat(RegExp.$1);
        }
        return rv;
    }
    
    function supports_canvas(){
        if (canvas_support_checked) 
            return canvas_supported;
        
        canvas_support_checked = true;
        canvas_supported = !!document.createElement('canvas').getContext;
        return canvas_supported;
    }
    
    this.init = function(){
	
        if (id) 
            targetElement.removeChild(targetDiv);
        
        id = this.allocateId();
        
//        transformation = new Th3dtran();
        
        this.createTargetDiv();
        
        if (!targetDiv) 
            return;
	
	this.dataToRenders = null;
	this.dataToRenders = new Array();
        
        
	this.createCanvas();
        
    };
    
    this.determineMinMaxZValues = function(){
	this.numXPoints = this.datas[0].formattedValues.length;
	this.numYPoints = this.datas[0].formattedValues[0].length;
        this.minZValue = Number.MAX_VALUE;
        this.maxZValue = -Number.MAX_VALUE;
        
	var arrayZMin = new Array();
	var arrayXMin = new Array();
	var arrayYMin = new Array();
	
	var arrayZMax = new Array();
	var arrayXMax = new Array();
	var arrayYMax = new Array();
	
	var valueX = new Array();
	var valueY = new Array();
	var valueZ = new Array();

	for (var k = 0; k < this.datas.length; k++) {
	    if (this.datas[k]!=null) {
		for (var i = 0; i < this.numXPoints; i++) {
		    valueX[i] = new Array();
		    valueY[i] = new Array();
		    valueZ[i] = new Array();
		    for (var j = 0; j < this.numYPoints; j++) {
			valueX[i].push(this.datas[k].formattedValues[i][j].x);
			valueY[i].push(this.datas[k].formattedValues[i][j].y);
			valueZ[i].push(this.datas[k].formattedValues[i][j].z);
		    }
		}
	    }
	    arrayXMin.push(math.min(valueX));
	    arrayYMin.push(math.min(valueY));
	    arrayZMin.push(math.min(valueZ));

	    arrayXMax.push(math.max(valueX));
	    arrayYMax.push(math.max(valueY));
	    arrayZMax.push(math.max(valueZ));

	}

	this.minXValue = math.min(arrayXMin);
	this.maxXValue = math.max(arrayXMax);
	
	this.minYValue = math.min(arrayYMin);
	this.maxYValue = math.max(arrayYMax);

	this.minZValue = math.min(arrayZMin);
	this.maxZValue = math.max(arrayZMax);

    }
    
    this.cleanUp = function(){
        this.gl = null;
        
        canvas.onmousedown = null;
        document.onmouseup = null;
        document.onmousemove = null;

	document.ontouchstart = null;
	document.ontouchmove = null;
	document.ontouchend = null;
        
        this.numXPoints = 0;
        this.numYPoints = 0;
        canvas = null;
        canvasContext = null;
        this.datas = null;
        this.colourGradientObjects = null;
        this.glSurfaces = null;
        this.glAxes = null;
        this.shaderProgram = null;
        this.shaderTextureProgram = null;
        this.shaderAxesProgram = null;
        this.mvMatrix = null;
        this.mvMatrixStack = null;
        this.pMatrix = null;
    }
    
    function hideTooltip(){
        tTip.hide();
    }
    
    function displayTooltip(e){
        var position = new Point(e.x, e.y);
        tTip.show(tooltips[closestPointToMouse], 200);
    }
    
    
    this.allocateId = function(){
        var count = 0;
        var name = "surfacePlot";
        
        do {
            count++;
        }
        while (document.getElementById(name + count))
        return name + count;
    };

    
    this.createTargetDiv = function(){
        targetDiv = document.createElement("div");
        targetDiv.id = id;
        targetDiv.className = "surfaceplot";
        targetDiv.style.position = 'absolute';
        
        if (!targetElement) 
            return; 
        else {
            targetDiv.style.position = 'relative';
            targetElement.appendChild(targetDiv);
        }
        
        targetDiv.style.left = x + "px";
        targetDiv.style.top = y + "px";
    };
 
    this.getShader = function(id){
        var shaderScript = document.getElementById(id);
        
        if (!shaderScript) {
            return null;
        }
        
        var str = "";
        var k = shaderScript.firstChild;
        
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            
            k = k.nextSibling;
        }
        
        var shader;
        
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        }
        else 
            if (shaderScript.type == "x-shader/x-vertex") {
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
            }
        else {
            return null;
        }
        
        this.gl.shaderSource(shader, str);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            return null;
        }
        
        return shader;
    };
    
    this.createProgram = function(fragmentShaderID, vertexShaderID){
        if (this.gl == null) 
            return null;
        
        var fragmentShader = this.getShader(fragmentShaderID);
        var vertexShader = this.getShader(vertexShaderID);
        
        if (fragmentShader == null || vertexShader == null) 
            return null;
        
        var program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        program.pMatrixUniform = this.gl.getUniformLocation(program, "uPMatrix");
        program.mvMatrixUniform = this.gl.getUniformLocation(program, "uMVMatrix");
        
        program.nMatrixUniform = this.gl.getUniformLocation(program, "uNMatrix");
        program.axesColour = this.gl.getUniformLocation(program, "uAxesColour");
        program.ambientColorUniform = this.gl.getUniformLocation(program, "uAmbientColor");
        program.lightingDirectionUniform = this.gl.getUniformLocation(program, "uLightingDirection");
        program.directionalColorUniform = this.gl.getUniformLocation(program, "uDirectionalColor");
        
        return program;
    };
    
    
    this.initShaders = function(){
        if (this.gl == null) 
            return false;
        
        // Non-texture shaders
        this.shaderProgram = this.createProgram("shader-fs", "shader-vs");
        
        // Texture shaders
        this.shaderTextureProgram = this.createProgram("texture-shader-fs", "texture-shader-vs");
        
        // Axes shaders
        this.shaderAxesProgram = this.createProgram("axes-shader-fs", "axes-shader-vs");
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            return false;
        }
        
        return true;
    };
    
    this.mvPushMatrix = function(surfacePlot){
        var copy = mat4.create();
        mat4.set(surfacePlot.mvMatrix, copy);
        surfacePlot.mvMatrixStack.push(copy);
    };
    
    this.mvPopMatrix = function(surfacePlot){
        if (surfacePlot.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        
        surfacePlot.mvMatrix = surfacePlot.mvMatrixStack.pop();
    };
    
    this.setMatrixUniforms = function(program, pMatrix, mvMatrix){
        this.gl.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);
        
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        this.gl.uniformMatrix3fv(program.nMatrixUniform, false, normalMatrix);
    };

    
    this.initWorldObjects = function(data3Ds){
	this.glSurfaces = new Array();
	
	if(this.glOptions.showAxes == 1)
	    this.glAxes = new GLAxes(data3Ds[0], this);

	for(var k = 0; k < data3Ds.length; k++) {
            glSurface = new GLSurface(data3Ds[k], this, this.colourGradientObjects[k]);
	    this.glSurfaces.push(glSurface);
	}
    };
    
    // WebGL mouse handlers:
    var shiftPressed = false;
    
    this.handleMouseUp = function(event){
        mouseDown = false;
    };
    
    this.drawScene = function(){
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.gl.enable(this.gl.BLEND);
	this.gl.enable(this.gl.DEPTH_TEST);

        this.mvPushMatrix(this);
        this.gl.useProgram(this.shaderProgram);
        
        // Enable the vertex arrays for the current shader.
        this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
        this.shaderProgram.vertexNormalAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexNormal");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);
        this.shaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        mat4.perspective(5, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
        mat4.identity(this.mvMatrix);
        
        mat4.translate(this.mvMatrix, [0.0, 0, -20]);
        
        mat4.multiply(this.mvMatrix, this.rotationMatrix);
        
        var useLighting = true;
        
        if (useLighting) {
            this.gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
            
	    var lightingDirection = [1, 1, 1];
	    
            var adjustedLD = vec3.create();
            vec3.normalize(lightingDirection, adjustedLD);
	    vec3.scale(adjustedLD, -1);

	    	    
            this.gl.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);
	               
	    var lightIntensity = 0.8*(Math.pow(mat4.determinant(this.rotationMatrix),0.333));

            this.gl.uniform3f(this.shaderProgram.directionalColorUniform, lightIntensity, lightIntensity, lightIntensity);
        }
        
        // Disable the vertex arrays for the current shader.
        this.gl.disableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgram.vertexColorAttribute);


	
	if(this.glOptions.showAxes == 1)
            this.glAxes.draw();
	

        for(var k = 0; k < this.glSurfaces.length; k++) {
	    if(this.datas[k].formattedValues!=null)
		this.glSurfaces[k].draw();
	}
	

        this.mvPopMatrix(this);
    };
    
    var lastTime = 0;
    var elapsed = 0;
    
    this.tick = function(){

        var self = this;

        if (this.gl == null) {
            return;
	}
        
	firstPass = true;

        var animator = function(){
            if (self.gl == null || self.bail) {
                return;
	    }
            
	    if(mouseDown || mouseWheel || firstPass || gestureStart) {
		self.drawScene();
		mouseWheel = false;
		firstPass = false;
	    }
            requestAnimFrame(animator);
        };
        
        this.anim_id = requestAnimationFrame(animator);
    };
    
    this.isWebGlEnabled = function(){
        var enabled = true;
        
        if (this.glOptions.chkControlId && document.getElementById(this.glOptions.chkControlId)) 
            enabled = document.getElementById(this.glOptions.chkControlId).checked;
        
        return enabled && this.initShaders();
    };
    
    this.rotate = function(deltaX, deltaY){
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix);
    }
    
    this.handleMouseMove = function(event, context){
	
        if (!mouseDown) {
            return;
        }
        
        var newX = event.clientX;
        var newY = event.clientY;
        
        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        if (shiftPressed) // scale
        {
            var s = deltaY < 0 ? 1.05 : 0.95;
            mat4.scale(newRotationMatrix, [s, s, s]);
	    
            mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix);
        }
        else // rotate
        {
            mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
            mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
            mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix);
	    
            this.otherPlots = null;
            if (this.otherPlots) {
                var numPlots = this.otherPlots.length;
                for (var i = 0; i < numPlots; i++) {
                    this.otherPlots[i].rotate(deltaX, deltaY);
                }
            }
        }
        
        lastMouseX = newX;
        lastMouseY = newY;
    };

    this.handleTouchMove = function(event, context){
	
	event.stopPropagation();
	event.preventDefault();
	

	if (!mouseDown) {
	    return;
	}

        var newX = event.touches[0].pageX;
        var newY = event.touches[0].pageY;
        
        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix);
	    
        lastMouseX = newX;
        lastMouseY = newY;

    };
    
    this.handleMouseWheel = function(event, context){
	
	mouseWheel = true;

        var deltaY = -1*event.wheelDeltaY;
	
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        var s = deltaY < 0 ? 1.2 : 0.8;
        mat4.scale(newRotationMatrix, [s, s, s]);
	    
        try{mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix)}catch(a){alert(a)};
        
    };


    this.handleGestureChange = function(event, context){
	event.stopPropagation();

	var s = 0.1*event.scale + 0.9;

	var newRotationMatrix = mat4.create();
	mat4.identity(newRotationMatrix);
	
	try{mat4.scale(newRotationMatrix, [s, s, s])}catch(a){alert(a)};
	
	try{mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix)}catch(a){alert(a)};
		
    };
    


    this.handleRotSlider = function(newValue, context, orientation){

	var newXAngle = lastXAngle;
	var newZAngle = lastZAngle;

	var deltaXAngle = 0;
	var deltaZAngle = 0;

	if(orientation == "x")
	    newXAngle = newValue;
	else 
            newZAngle = newValue;

	deltaXAngle = newXAngle - lastXAngle;
	deltaZAngle = newZAngle - lastZAngle;
	
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        mat4.rotate(newRotationMatrix, degToRad(deltaXAngle), [0, 1, 0]);
        mat4.rotate(newRotationMatrix, degToRad(deltaZAngle), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, this.rotationMatrix, this.rotationMatrix);
	
	lastXAngle = newXAngle;
	lastZAngle = newZAngle;
	    
    };

    this.initGL = function(canvas){
        var canUseWebGL = false;
        
        try {
            this.gl = canvas.getContext("webgl", {
                alpha: true
            });

            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
        } 
        catch (e) {
        }
        
        if (this.gl) {
            canUseWebGL = this.isWebGlEnabled();
            var self = this;
            
            var handleMouseDown = function(event){
                shiftPressed = isShiftPressed(event);
                
                mouseDown = true;
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
                
                canvas.onmouseup = self.handleMouseUp;
                canvas.onmousemove = function(event){
                    self.handleMouseMove(event, self)
                };

            };	    

	    var handleTouchStart = function(event){
                
		event.stopPropagation();

		mouseDown = true;

                lastMouseX = event.touches[0].pageX;
                lastMouseY = event.touches[0].pageY;
                
                canvas.ontouchend = self.handleMouseUp;


		if(event.touches.length == 1) {
		    canvas.ontouchmove = function(event){
			self.handleTouchMove(event, self)
                    };
		}	
	    }
            
	    var handleGestureStart = function(event){	
		event.stopPropagation();
		gestureStart = true;
		mouseDown = false;

		canvas.ongesturechange=function(event){
		    self.handleGestureChange(event, self)
		}

	    }
	    
	    var handleGestureEnd = function(event){	
		gestureStart = false;
	    }

            canvas.onmousedown = handleMouseDown;
	    canvas.ontouchstart = handleTouchStart;

	    canvas.ongesturestart = handleGestureStart;
	    canvas.ongesturestend = handleGestureEnd;
	    
	    canvas.onmousewheel=function(event){
		self.handleMouseWheel(event, self)
	    }

        }
        
        return canUseWebGL;
    };
    
    this.initCanvas = function(){
        canvas.className = "surfacePlotCanvas";
        canvas.setAttribute('width', width);
	canvas.setAttribute('height', height);
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        
        targetDiv.appendChild(canvas);
    };
    
    this.scaleAndNormalise = function(rel_scaleFactor, zmax, zmin, offset){
	
        var numRows = this.datas[0].formattedValues.length;
        var numCols = this.datas[0].formattedValues[0].length;

	this.xRange = Math.round(this.maxXValue - this.minXValue == 0 ? 1:this.maxXValue - this.minXValue);
	this.yRange = Math.round(this.maxYValue - this.minYValue == 0 ? 1:this.maxYValue - this.minYValue);

	this.xMean = (this.maxXValue + this.minXValue)/2;
	this.yMean = (this.maxYValue + this.minYValue)/2;

	this.hScale = Math.round(Math.max(this.xRange, this.yRange));

	var xoffset = -(this.xMean)/(this.hScale);
	var yoffset = -(this.yMean)/(this.hScale);

	
	this.pos_offset = {x: xoffset, y: yoffset, z: rel_scaleFactor*offset};

	
        for (var k = 0; k < this.datas.length; k++) {
            for (var i = 0; i < numRows; i++) {
		for (var j = 0; j < numCols; j++)  {
		    if(this.dataToRenders[k]!= null) {
			this.dataToRenders[k][i][j].z = (this.datas[k].formattedValues[i][j].z + offset) * rel_scaleFactor;
			this.dataToRenders[k][i][j].x = (this.datas[k].formattedValues[i][j].x)/this.hScale + xoffset;
			this.dataToRenders[k][i][j].y = (this.datas[k].formattedValues[i][j].y)/this.hScale + yoffset;
		    }
		}
	    }
	}
	this.rel_scaleFactor = rel_scaleFactor;

    }
    
    this.log = function(base, value){
        return Math.log(value) / Math.log(base);
    }
    
    this.nice_num = function(x, round){
        var exp = Math.floor(log(10, x));
        var f = x / Math.pow(10, exp);
        var nf;
        
        if (round) {
            if (f < 1.5) 
                nf = 1;
            else 
                if (f < 3) 
                    nf = 2;
            else 
                if (f < 7) 
                    nf = 5;
            else 
                nf = 10;
        }
        else {
            if (f <= 1) 
                nf = 1;
            else 
                if (f <= 2) 
                    nf = 2;
            else 
                if (f <= 5) 
                    nf = 5;
            else 
                nf = 10;
        }
        
        return nf * Math.pow(10, exp);
    }
    
    this.calculateZScale = function(autoCalcZScale){
	var scaleFactor = this.datas[0].scaleFactor;
	

	this.determineMinMaxZValues();

	if(autoCalcZScale == 0) {
            this.scaleAndNormalise(1/(this.zMax - this.zMin), this.zMax, this.zMin, -(this.zMax + this.zMin)/2);
	}
	else {
	    this.zRange = this.maxZValue - this.minZValue != 0 ? this.maxZValue - this.minZValue : Math.max(1, this.maxZValue*3);

	    rel_scaleFactor = scaleFactor/(this.zRange);
	    this.scaleAndNormalise(rel_scaleFactor, this.maxZValue, this.minZValue, -(this.maxZValue + this.minZValue)/2);
	}

    }
    
    this.createCanvas = function(){
        canvas = document.createElement("canvas");
        
        if (!supports_canvas()) {
            G_vmlCanvasManager.initElement(canvas);
            canvas.style.width = width;
            canvas.style.height = height;
        }
        else {
            this.initCanvas();
	    if(!this.gl) {
		this.useWebGL = this.initGL(canvas);
	    }
	    else 
		this.useWebGL = true;
        }
        
            this.createHiddenCanvasForGLText();
    };
    
    this.createHiddenCanvasForGLText = function(){
        var hiddenCanvas = document.createElement("canvas");
	hiddenCanvas.setAttribute("width", 512);
        hiddenCanvas.setAttribute("height", 512);
        this.context2D = hiddenCanvas.getContext('2d');
        hiddenCanvas.style.display = 'none';
        targetDiv.appendChild(hiddenCanvas);
    };
    
    function isShiftPressed(e){
        var shiftPressed = 0;
        
        if (parseInt(navigator.appVersion) > 3) {
            var evt = navigator.appName == "Netscape" ? e : event;
            
            if (navigator.appName == "Netscape" && parseInt(navigator.appVersion) == 4) {
                // NETSCAPE 4 CODE
                var mString = (e.modifiers + 32).toString(2).substring(3, 6);
                shiftPressed = (mString.charAt(0) == "1");
            }
            else {
                // NEWER BROWSERS [CROSS-PLATFORM]
                shiftPressed = evt.shiftKey;
            }
            
            if (shiftPressed) 
                return true;
        }
        
        return false;
    }
    

    this.init();
}; //end of JSSurfacePlot;

GLText = function(data3D, text, pos, angle, surfacePlot, axis, align){
    this.shaderTextureProgram = surfacePlot.shaderTextureProgram;
    this.currenShader = null;
    this.gl = surfacePlot.gl;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    
    this.vertexTextureCoordBuffer = null;
    this.textureVertexPositionBuffer = null;
    this.textureVertexIndexBuffer = null;
    this.context2D = surfacePlot.context2D;
    this.mvPushMatrix = surfacePlot.mvPushMatrix;
    this.mvPopMatrix = surfacePlot.mvPopMatrix;
    this.texture;
    this.text = text;
    this.angle = angle;
    this.pos = pos;
    this.surfacePlot = surfacePlot;
    this.textMetrics = null;
    this.axis = axis;
    this.align = align;
    
    this.setUpTextArea = function(){
        this.context2D.font = 'Italic 24px Times';
        this.context2D.fillStyle = 'rgba(255,255,255,0)';
        this.context2D.fillRect(0, 0, 512, 512);
        this.context2D.lineWidth = 3;
        this.context2D.textAlign = 'left';
        this.context2D.textBaseline = 'top';
    };
    
    this.writeTextToCanvas = function(text, idx){
        this.context2D.save();
        this.context2D.clearRect(0, 0, 512, 512);
        this.context2D.fillStyle = 'rgba(255, 255, 255, 0)';
        this.context2D.fillRect(0, 0, 512, 512);
        
        var r = hexToR(this.surfacePlot.axisTextColour);
        var g = hexToG(this.surfacePlot.axisTextColour);
        var b = hexToB(this.surfacePlot.axisTextColour);
        
        this.context2D.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 255)'; // Set the axis label colour.
        this.textMetrics = this.context2D.measureText(text);
        
        this.context2D.fillText(text, 512 - this.textMetrics.width, 0);
        
        this.setTextureFromCanvas(this.context2D.canvas, this.texture, 0);
        
        this.context2D.restore();
    };
    
    this.setTextureFromCanvas = function(canvas, textTexture, idx){
        this.gl.activeTexture(this.gl.TEXTURE0 + idx);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textTexture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        
        if (isPowerOfTwo(canvas.width) && isPowerOfTwo(canvas.height)) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        }
        else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, textTexture);
    };
    
    function isPowerOfTwo(value){
        return ((value & (value - 1)) == 0);
    }
    
    this.initTextBuffers = function(){
	
        // Text texture vertices
        this.textureVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
        this.textureVertexPositionBuffer.itemSize = 3;
        this.textureVertexPositionBuffer.numItems = 4;
        this.shaderTextureProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderTextureProgram, "aTextureCoord");
        this.gl.vertexAttribPointer(this.shaderTextureProgram.textureCoordAttribute, this.textureVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
        
        // Where we render the text.
	var texturePositionCoords = [-1, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0];
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texturePositionCoords), this.gl.STATIC_DRAW);
        
        // Texture index buffer.
        this.textureVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.textureVertexIndexBuffer);
        
        var textureVertexIndices = [0, 1, 2, 0, 2, 3];
        
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(textureVertexIndices), this.gl.STATIC_DRAW);
        this.textureVertexIndexBuffer.itemSize = 1;
        this.textureVertexIndexBuffer.numItems = 6;
        
        // Text textures
        this.vertexTextureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = 4;
        this.gl.vertexAttribPointer(this.shaderTextureProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        
        var textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    };
    
    this.initTextBuffers();
    this.setUpTextArea();
    
    this.texture = this.gl.createTexture();
    this.writeTextToCanvas(this.text, this.idx);
};

GLText.prototype.draw = function(){
    this.mvPushMatrix(this.surfacePlot);
    
    var rotationMatrix = mat4.create();
    var inverseMatrix = mat4.create();

    mat4.identity(rotationMatrix);
    try{mat4.inverse(this.surfacePlot.rotationMatrix, inverseMatrix)}catch(a){alert(a)};
        mat4.translate(rotationMatrix, [this.pos.x, this.pos.y, this.pos.z]);
	mat4.multiply(rotationMatrix, inverseMatrix);

    mat4.multiply(this.surfacePlot.mvMatrix, rotationMatrix);
    
    // Enable blending for transparency.
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    
    // Text
    this.currentShader = this.shaderTextureProgram;
    this.gl.useProgram(this.currentShader);
    
    // Enable the vertex arrays for the current shader.
    this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    this.currentShader.textureCoordAttribute = this.gl.getAttribLocation(this.currentShader, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.currentShader.textureCoordAttribute);
    
    this.shaderTextureProgram.samplerUniform = this.gl.getUniformLocation(this.shaderTextureProgram, "uSampler");
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.textureVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
    this.gl.vertexAttribPointer(this.currentShader.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.currentShader.samplerUniform, 0);
    
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.textureVertexIndexBuffer);
    
    this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
    
    this.gl.drawElements(this.gl.TRIANGLES, this.textureVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    
    // Disable blending for transparency.
    this.gl.disable(this.gl.BLEND);
    this.gl.enable(this.gl.DEPTH_TEST);
    
    // Disable the vertex arrays for the current shader.
    this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    this.gl.disableVertexAttribArray(this.currentShader.textureCoordAttribute);
    
    this.mvPopMatrix(this.surfacePlot);
};

/*
 * This class represents the axes for the webGL plot.
 */
GLAxes = function(data3D, surfacePlot){
    this.shaderProgram = surfacePlot.shaderAxesProgram;
    this.currenShader = null;
    this.gl = surfacePlot.gl;
    this.numXPoints = surfacePlot.numXPoints;
    this.numYPoints = surfacePlot.numYPoints;
    this.data3D = data3D;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    this.axesVertexPositionBuffer = null;
    this.axesMinorVertexPositionBuffer = null;
    this.surfaceVertexColorBuffer = null;
    this.surfacePlot = surfacePlot;
    
    this.labels = [];
    
    this.initAxesBuffers = function(){
        var vertices = [];
        var minorVertices = [];
        var axisExtent = 0.75;

	var xRange = this.surfacePlot.xRange;
	var yRange = this.surfacePlot.yRange;
	var hScale = this.surfacePlot.hScale;

	var xMin = surfacePlot.xMin;
	var xMax = surfacePlot.xMax;
	var yMin = surfacePlot.yMin;
	var yMax = surfacePlot.yMax;


	var offset = {x: this.surfacePlot.pos_offset.x, y: this.surfacePlot.pos_offset.y, z: this.surfacePlot.pos_offset.z};

	if (this.surfacePlot.centeredAxes == 0) {
	    offset.x = 0;
	    offset.y = 0;
	    if (this.surfacePlot.glOptions.autoCalcZScale == 1)
		offset.z = -this.surfacePlot.zRange*this.surfacePlot.rel_scaleFactor/2;
	    else
		offset.z = -0.5;
	}
	
	if(this.surfacePlot.glOptions.autoCalcZScale == 1) {
	    var minZ = this.surfacePlot.minZValue*this.surfacePlot.rel_scaleFactor;
	}
	else {
	    var minZ = this.surfacePlot.zMin*this.surfacePlot.rel_scaleFactor;
	}
	var axisOrigin = [offset.x,  offset.y,  offset.z];
	
	if (this.surfacePlot.centeredAxes == 1) {
	    var axisExtent = 0.75;
	    axisOrigin = [offset.x,  offset.y,  offset.z];
            var xAxisEndPoint = [axisExtent, 0 + offset.y, offset.z];
            var yAxisEndPoint = [0 + offset.x , axisExtent, offset.z];
	    var zAxisEndPoint = [0 + offset.x, 0 + offset.y, -0.9];
//            var zAxisEndPoint = [0 + offset.x, 0 + offset.y, offset.z + minZ - 0.5];
            
            var xAxisEndPoint2 = [-axisExtent, 0 + offset.y, offset.z];
	    var yAxisEndPoint2 = [0 + offset.x, -axisExtent, offset.z];
	    var zAxisEndPoint2 = [0 + offset.x, 0 + offset.y, 0.9];
//            var zAxisEndPoint2 = [0 + offset.x, 0 + offset.y, offset.z + minZ + 1.25];
        } else {
	    var axisExtent = 0.5;
	    if(this.surfacePlot.glOptions.autoCalcZScale == 1)
		axisOrigin = [offset.x, offset.y, offset.z];
	   
            var xAxisEndPoint = [axisExtent + offset.x, 0 + offset.y, offset.z];
	    var xAxisEndPoint2 = [-axisExtent + offset.x, 0 + offset.y, offset.z];
	    
            var yAxisEndPoint = [0 + offset.x, axisExtent + offset.y,  offset.z];
	    var yAxisEndPoint2 = [0 + offset.x, -axisExtent + offset.y, offset.z];
	    
            var zAxisEndPoint = [0.5 + offset.x, -0.5 + offset.y, axisExtent + offset.z];
            var zAxisEndPoint2 = [0.5 + offset.x, -0.5 + offset.y, offset.z];
	}
        // X
        vertices = vertices.concat(xAxisEndPoint);
        vertices = vertices.concat(xAxisEndPoint2);
        
        // Y
        vertices = vertices.concat(yAxisEndPoint);
        vertices = vertices.concat(yAxisEndPoint2);
        
        // Z2
        vertices = vertices.concat(zAxisEndPoint);
        vertices = vertices.concat(zAxisEndPoint2);
        
        // Major axis lines.
        this.axesVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesVertexPositionBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
        this.axesVertexPositionBuffer.itemSize = 3;
        this.axesVertexPositionBuffer.numItems = vertices.length / 3;
        
        // Minor axis lines

        var lineIntervalX =  xRange/(hScale*(this.surfacePlot.glOptions.xTicksNum - 1));
        var lineIntervalY =  yRange/(hScale*(this.surfacePlot.glOptions.yTicksNum - 1));

        var lineIntervalZ = 1 / (this.surfacePlot.glOptions.zTicksNum - 1);

	if (this.surfacePlot.glOptions.autoCalcZScale == 1)
	    var axisHeight = this.surfacePlot.rel_scaleFactor*this.surfacePlot.zRange + lineIntervalZ; 
	else 
	    var axisHeight = 1 + lineIntervalZ;

        var roundXScale = Math.floor(Math.log10(this.surfacePlot.xRange/(this.surfacePlot.glOptions.xTicksNum - 1)));
	var roundYScale = Math.floor(Math.log10(this.surfacePlot.yRange/(this.surfacePlot.glOptions.yTicksNum - 1)));
	var roundZScale = Math.floor(Math.log10(lineIntervalZ*this.surfacePlot.zRange));

        // X-axis division lines
	 var labels = new Array;
	    for (var j = 0; j < this.surfacePlot.glOptions.xTicksNum; j++) {
		if(j%2 == 0) {
		    labels.push((this.surfacePlot.minXValue  + ((xRange)/(this.surfacePlot.glOptions.xTicksNum - 1))*j).toFixed(Math.max(0, -roundXScale)));
		} else
		    labels.push("");
	    }
	var i = 0
        for (var count = 0; count < this.surfacePlot.glOptions.xTicksNum; i +=lineIntervalX, count++) {
            // X-axis labels.
            var label = labels[count];
            
	    if(this.surfacePlot.centeredAxes == 1) {
		labelPos = {
//		    x: axisOrigin[0] - 0.5*(xMax - xMin)/xRange + i,
		    x: axisOrigin[0] - 0.5*(xRange/hScale) + i - offset.x,
                    y: axisOrigin[1],
                    z: axisOrigin[2]
		};
	    } else {
		labelPos = {
		    x: yAxisEndPoint[0] -0.5*(xRange/hScale) + i,
                    y: yAxisEndPoint[1] + 0.05,
                    z: yAxisEndPoint[2]
		    
		}
	    }
            glText = new GLText(data3D, label, labelPos, 0, surfacePlot, "x");
            this.labels.push(glText);

	    var tickHeight = count % 2 == 0? 0.02:0.01; 
            
            // X-axis divisions.
	    minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z - tickHeight]);
            minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z + tickHeight]);
            
            // back wall x-axis divisions.
	    if(this.surfacePlot.centeredAxes == 0) {
		minorVertices = minorVertices.concat([labelPos.x, labelPos.y -0.05 - 1, labelPos.z]);
		minorVertices = minorVertices.concat([labelPos.x, labelPos.y -0.05 - 1, labelPos.z +  axisHeight]);

		minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z]);
		minorVertices = minorVertices.concat([labelPos.x, labelPos.y -0.05 - 1, labelPos.z]);
            }
	} 

	var labels = new Array;
	for ( j = 0; j < this.surfacePlot.glOptions.yTicksNum; j++) {
	    if(j%2 == 0)
		labels.push((this.surfacePlot.minYValue  + ((yRange)/(this.surfacePlot.glOptions.yTicksNum - 1))*j).toFixed(Math.max(0, -roundYScale)));
	    else
		labels.push("");
	}
        
        i = 0;
        
        // Y-axis division lines
        for (var count = 0; count < this.surfacePlot.glOptions.yTicksNum; i += lineIntervalY, count++) {
            // Y-axis labels.
            var label = labels[count];

            if(this.surfacePlot.centeredAxes == 1) {
		labelPos = {
		    x: axisOrigin[0] ,
                    // y: axisOrigin[1] -0.5*(yMax - yMin)/yRange + i,
		    y: axisOrigin[1] -0.5*(yRange/hScale) + i - offset.y,
                    z: axisOrigin[2]
		};
	    } else {
		labelPos = {
		    x: xAxisEndPoint[0] + 0.05,
		    y: xAxisEndPoint[1] -0.5*(yRange/hScale) + i,
                    z: xAxisEndPoint[2]
		    
		}
	    }
            glText = new GLText(data3D, label, labelPos, 0, surfacePlot, "y");
            this.labels.push(glText);
            
            // y-axis divisions
	    
	    var tickHeight = count%2 == 0? 0.02:0.01; 
	    
	    minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z - tickHeight]);
            minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z + tickHeight]);
            // back wall y-axis divisions.
	    if(this.surfacePlot.centeredAxes == 0) {
		minorVertices = minorVertices.concat([labelPos.x -0.05 - 1, labelPos.y, labelPos.z]);
		minorVertices = minorVertices.concat([labelPos.x -0.05 - 1, labelPos.y, labelPos.z + axisHeight]);

		minorVertices = minorVertices.concat([labelPos.x, labelPos.y, labelPos.z]);
		minorVertices = minorVertices.concat([labelPos.x -0.05 - 1, labelPos.y, labelPos.z]);
	    }
        }
        
        
        // Z-axis division lines
	
	var labels = new Array;
	for ( j = 0; j < this.surfacePlot.glOptions.zTicksNum; j++) {
	    if(j%2 == 0){
		if(this.surfacePlot.glOptions.autoCalcZScale == 1) { 
		    labels.push((this.surfacePlot.minZValue  + (this.surfacePlot.zRange/(this.surfacePlot.glOptions.zTicksNum - 1))*j).toFixed(Math.max(0, -roundZScale)));
		} else {
		    labels.push((this.surfacePlot.zMin + ((this.surfacePlot.zMax-this.surfacePlot.zMin)/(this.surfacePlot.glOptions.zTicksNum - 1))*j).toFixed(Math.max(0, -roundZScale)));
		}
	    } else
		labels.push("");
	}
	    
	i = 0;
        for (var count = 0; count < this.surfacePlot.glOptions.zTicksNum; i += lineIntervalZ, count++) {
		// Z-axis labels.
	    var label = labels[count];
	    if(this.surfacePlot.centeredAxes == 1) {
		if(this.surfacePlot.glOptions.autoCalcZScale == 1) {
		    labelPos = {
			x: axisOrigin[0],
			y: axisOrigin[1],
			z: axisOrigin[2]  + minZ +  i*this.surfacePlot.rel_scaleFactor*this.surfacePlot.zRange
		    };
		} else {
		    labelPos = {
			x: axisOrigin[0],
			y: axisOrigin[1],
			z: axisOrigin[2]  + i + minZ
		    };
		}
	    } else {
		if(this.surfacePlot.glOptions.autoCalcZScale == 0) {
		    labelPos = {
			x: xAxisEndPoint[0],
			y: yAxisEndPoint2[1],
			z: axisOrigin[2] + i
		    }
		} else {
		    labelPos = {
			x: xAxisEndPoint[0],
			y: yAxisEndPoint2[1],
			z: axisOrigin[2] + i*this.surfacePlot.rel_scaleFactor*this.surfacePlot.zRange
		    }
		}
	    }
            var glText = new GLText(data3D, label, labelPos, 0, surfacePlot, "z");
            this.labels.push(glText);
            
            // Z-axis divisions
	    minorVertices = minorVertices.concat([labelPos.x - 0.01, labelPos.y, labelPos.z]);
	    minorVertices = minorVertices.concat([labelPos.x + 0.01, labelPos.y, labelPos.z]);
	    
            // back wall z-axis divisions
	    if(this.surfacePlot.centeredAxes == 0) {
		minorVertices = minorVertices.concat([xAxisEndPoint2[0], yAxisEndPoint[1], labelPos.z]);
		minorVertices = minorVertices.concat([xAxisEndPoint2[0], yAxisEndPoint2[1], labelPos.z]);
		
		minorVertices = minorVertices.concat([xAxisEndPoint[0], yAxisEndPoint2[1], labelPos.z]);
		minorVertices = minorVertices.concat([xAxisEndPoint2[0], yAxisEndPoint2[1], labelPos.z]);
	    }
        }
        // Set up the main X-axis label.
	if(this.surfacePlot.centeredAxes == 1) {
            var labelPos = {
		x: xAxisEndPoint[0] + 0.1, 
		y: xAxisEndPoint[1],
		z: xAxisEndPoint[2]
            };
	} else {
	    var labelPos = {
		x: yAxisEndPoint[0], 
		y: yAxisEndPoint[1] + 0.1,
		z: yAxisEndPoint[2]
            };
	}
        var glText = new GLText(data3D, this.surfacePlot.xTitle, labelPos, 0, surfacePlot, "x", "left");
        this.labels.push(glText);
        
        // Set up the main Y-axis label.
	if(this.surfacePlot.centeredAxes == 1) {
	    labelPos = {
		x: yAxisEndPoint[0], 
		y: yAxisEndPoint[1] + 0.1,
		z: yAxisEndPoint[2]
            };
	} else {
            labelPos = {
		x: xAxisEndPoint[0] + 0.1, 
		y: xAxisEndPoint[1],
		z: xAxisEndPoint[2]
            };
	}
        glText = new GLText(data3D, this.surfacePlot.yTitle, labelPos, 0, surfacePlot, "y", "left");
        this.labels.push(glText);
        
        // Set up the main Z-axis label.
	if(this.surfacePlot.centeredAxes == 1) {
	    labelPos = {
		x: zAxisEndPoint2[0],
		y: zAxisEndPoint2[1] - 0.05,
		z: zAxisEndPoint2[2] - 0.05
            };
	} else {
	    labelPos = {
		x: xAxisEndPoint[0], 
		y: xAxisEndPoint[1] -0.55,
		z: xAxisEndPoint[2] + 0.5
            };
	}
        glText = new GLText(data3D, this.surfacePlot.zTitle, labelPos, 0, surfacePlot, "z", "left");
        this.labels.push(glText);
        
        // Set up the minor axis grid lines.
        this.axesMinorVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesMinorVertexPositionBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(minorVertices), this.gl.DYNAMIC_DRAW);
        this.axesMinorVertexPositionBuffer.itemSize = 3;
        this.axesMinorVertexPositionBuffer.numItems = minorVertices.length / 3;
    };
    
    this.initAxesBuffers();
};

GLAxes.prototype.draw = function(){
    this.currentShader = this.shaderProgram;
    this.gl.useProgram(this.currentShader);
    
    // Enable the vertex array for the current shader.
    this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    
    this.gl.uniform3f(this.currentShader.axesColour, 0.5, 0.5, 0.5); // Set the colour of the Major axis lines.
    // Major axis lines
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.axesVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.lineWidth(2);
    this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.axesVertexPositionBuffer.numItems);
    
    // Minor axis lines
    this.gl.uniform3f(this.currentShader.axesColour, 0.5, 0.5, 0.5); // Set the colour of the minor axis grid lines.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesMinorVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.axesMinorVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.lineWidth(1);
    this.gl.drawArrays(this.gl.LINES, 0, this.axesMinorVertexPositionBuffer.numItems);
    
    // Render the axis labels.
    var numLabels = this.labels.length;
    
    // Enable the vertex array for the current shader.
    this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    
    for (var i = 0; i < numLabels; i++) 
        this.labels[i].draw();
};

/*
 * A webGL surface without axes nor any other decoration.
 */
GLSurface = function(data3D, surfacePlot, colourGradientObject){
    this.shaderProgram = surfacePlot.shaderProgram;
    this.currentShader = null;
    this.gl = surfacePlot.gl;
    this.numXPoints = surfacePlot.numXPoints;
    this.numYPoints = surfacePlot.numYPoints;
    this.data3D = data3D;
    this.colourGradientObject = colourGradientObject;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    
    this.surfaceVertexPositionBuffer = null;
    this.surfaceVertexColorBuffer = null;
    this.surfaceVertexNormalBuffer = null;
    this.surfaceVertexIndexBuffer = null;
    this.surfacePlot = surfacePlot;
    
    this.initSurfaceBuffers = function(){
        var i;
        var j;
        var vertices = [];
        var colors = [];
        var vertexNormals = [];
	var vertexNormals1 = [];
        
        for (i = 0; i < this.numXPoints - 1; i++) {
            for (j = 0; j < this.numYPoints - 1; j++) {
                // Create surface vertices.
                var rawP1 = this.data3D[j + (i * this.numYPoints)];
                var rawP2 = this.data3D[j + (i * this.numYPoints) + this.numYPoints];
                var rawP3 = this.data3D[j + (i * this.numYPoints) + this.numYPoints + 1];
                var rawP4 = this.data3D[j + (i * this.numYPoints) + 1];
                
                vertices.push(rawP1.ax);
                vertices.push(rawP1.ay);
                vertices.push(rawP1.az);
                
                vertices.push(rawP2.ax);
                vertices.push(rawP2.ay);
                vertices.push(rawP2.az);
                
                vertices.push(rawP3.ax);
                vertices.push(rawP3.ay);
                vertices.push(rawP3.az);
                
                vertices.push(rawP4.ax);
                vertices.push(rawP4.ay);
                vertices.push(rawP4.az);
                
                // Surface colours.
                var rgb1 = this.colourGradientObject.getColour(rawP1.lz * 1.0).rgb;
                var rgb2 = this.colourGradientObject.getColour(rawP2.lz * 1.0).rgb;
                var rgb3 = this.colourGradientObject.getColour(rawP3.lz * 1.0).rgb;
                var rgb4 = this.colourGradientObject.getColour(rawP4.lz * 1.0).rgb;

		var alpha = this.colourGradientObject.getColour(rawP1.lz * 1.0).alpha;

                colors.push(rgb1.red / 255);
                colors.push(rgb1.green / 255);
                colors.push(rgb1.blue / 255, alpha);
                colors.push(rgb2.red / 255);
                colors.push(rgb2.green / 255);
                colors.push(rgb2.blue / 255, alpha);
                colors.push(rgb3.red / 255);
                colors.push(rgb3.green / 255);
                colors.push(rgb3.blue / 255, alpha);
                colors.push(rgb4.red / 255);
                colors.push(rgb4.green / 255);
                colors.push(rgb4.blue / 255, alpha);
                
                // Normal of triangle 1.
                var v1 = [rawP2.ax - rawP1.ax, rawP2.ay - rawP1.ay, rawP2.az - rawP1.az];
                var v2 = [rawP3.ax - rawP1.ax, rawP3.ay - rawP1.ay, rawP3.az - rawP1.az];
                var cp1 = vec3.create();
                cp1 = vec3.cross(v1, v2);
                cp1 = vec3.normalize(v1, v2);
              
                // Normal of triangle 2.
                v1 = [rawP3.ax - rawP1.ax, rawP3.ay - rawP1.ay, rawP3.az - rawP1.az];
                v2 = [rawP4.ax - rawP1.ax, rawP4.ay - rawP1.ay, rawP4.az - rawP1.az];
                var cp2 = vec3.create();
                cp2 = vec3.cross(v1, v2);
                cp2 = vec3.normalize(v1, v2);

                // Store normals for lighting.
                vertexNormals.push(cp1[0]);
                vertexNormals.push(cp1[1]);
                vertexNormals.push(cp1[2]);
                vertexNormals.push(cp1[0]);
                vertexNormals.push(cp1[1]);
                vertexNormals.push(cp1[2]);
                
		vertexNormals.push(cp2[0]);
                vertexNormals.push(cp2[1]);
                vertexNormals.push(cp2[2]);
		vertexNormals.push(cp2[0]);
                vertexNormals.push(cp2[1]);
                vertexNormals.push(cp2[2])

            }
        }

        this.surfaceVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexPositionBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
        this.surfaceVertexPositionBuffer.itemSize = 3;
        this.surfaceVertexPositionBuffer.numItems = vertices.length / 3;
        
        this.surfaceVertexNormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexNormalBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.DYNAMIC_DRAW);
        this.surfaceVertexNormalBuffer.itemSize = 3;
        this.surfaceVertexNormalBuffer.numItems = vertices.length / 3;
        
        this.surfaceVertexColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexColorBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.surfaceVertexColorBuffer.itemSize = 4;
        this.surfaceVertexColorBuffer.numItems = vertices.length / 3;
        
        this.surfaceVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.surfaceVertexIndexBuffer);
        
        var numQuads = ((this.numXPoints - 1) * (this.numYPoints - 1)) / 2;
        var surfaceVertexIndices = [];
        
        for (var i = 0; i < (numQuads * 8); i += 4) {
            surfaceVertexIndices.push(i);
            surfaceVertexIndices.push(i + 1);
            surfaceVertexIndices.push(i + 2);
            surfaceVertexIndices.push(i);
            surfaceVertexIndices.push(i + 2);
            surfaceVertexIndices.push(i + 3);
        }
        
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceVertexIndices), this.gl.DYNAMIC_DRAW);

        this.surfaceVertexIndexBuffer.itemSize = 1;
        this.surfaceVertexIndexBuffer.numItems = surfaceVertexIndices.length;
    };
    
    
    this.initSurfaceBuffers();
};

GLSurface.prototype.draw = function(){

    this.currentShader = this.shaderProgram;
    this.gl.useProgram(this.currentShader);

    /* <transparency */

   this.gl.enable(this.gl.BLEND);
    
    /* /transparency> */

    // Enable the vertex arrays for the current shader.
    this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    this.currentShader.vertexNormalAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexNormal");
    this.gl.enableVertexAttribArray(this.currentShader.vertexNormalAttribute);
    this.currentShader.vertexColorAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexColor");
    this.gl.enableVertexAttribArray(this.currentShader.vertexColorAttribute);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexPositionBuffer);


    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.surfaceVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexColorBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexColorAttribute, this.surfaceVertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexNormalBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexNormalAttribute, this.surfaceVertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.surfaceVertexIndexBuffer);
    
    this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
    

    this.gl.drawElements(this.gl.TRIANGLES, this.surfaceVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);

    
    // Disable the vertex arrays for the current shader.
    this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    this.gl.disableVertexAttribArray(this.currentShader.vertexNormalAttribute);
    this.gl.disableVertexAttribArray(this.currentShader.vertexColorAttribute);

};

/**
 * Given two coordinates, return the Euclidean distance
 * between them
 */
function distance(p1, p2){
    return Math.sqrt(((p1.x - p2.x) *
		      (p1.x -
		       p2.x)) +
		     ((p1.y - p2.y) * (p1.y - p2.y)));
}


/*
 * Point3D: This class represents a 3D point.
 * ******************************************
 */
Point3D = function(x, y, z){
    this.displayValue = "";
    
    this.lx;
    this.ly;
    this.lz;
    this.lt;
    
    this.wx;
    this.wy;
    this.wz;
    this.wt;
    
    this.ax;
    this.ay;
    this.az;
    this.at;
    
    this.dist;
    
    this.initPoint = function(){
        this.lx = this.ly = this.lz = this.ax = this.ay = this.az = this.at = this.wx = this.wy = this.wz = 0;
        this.lt = this.wt = 1;
    };
    
    this.init = function(x, y, z){
        this.initPoint();
        this.lx = x;
        this.ly = y;
        this.lz = z;
        
        this.ax = this.lx;
        this.ay = this.ly;
        this.az = this.lz;
    };
    
    this.init(x, y, z);
};

/*
 * Polygon: This class represents a polygon on the surface plot.
 * ************************************************************
 */
Polygon = function(cameraPosition, isAxis){
    this.points = new Array();
    this.cameraPosition = cameraPosition;
    this.isAxis = isAxis;
    this.centroid = null;
    this.distanceFromCamera = null;
    
    this.isAnAxis = function(){
        return this.isAxis;
    };
    
    this.addPoint = function(point){
        this.points[this.points.length] = point;
    };
    
    this.distance = function(){
        return this.distance2(this.cameraPosition, this.centroid);
    };
    
    this.calculateDistance = function(){
        this.distanceFromCamera = this.distance();
    };
    
    this.calculateCentroid = function(){
        var xCentre = 0;
        var yCentre = 0;
        var zCentre = 0;
        
        var numPoints = this.points.length * 1.0;
        
        for (var i = 0; i < numPoints; i++) {
            xCentre += this.points[i].ax;
            yCentre += this.points[i].ay;
            zCentre += this.points[i].az;
        }
        
        xCentre /= numPoints;
        yCentre /= numPoints;
        zCentre /= numPoints;
        
        this.centroid = new Point3D(xCentre, yCentre, zCentre);
    };
    
    this.distance2 = function(p1, p2){
        return ((p1.ax - p2.ax) * (p1.ax - p2.ax)) + ((p1.ay - p2.ay) * (p1.ay - p2.ay)) + ((p1.az - p2.az) * (p1.az - p2.az));
    };
    
    this.getPoint = function(i){
        return this.points[i];
    };
};


/*
 * Point: A simple 2D point.
 * ************************************************************
 */
Point = function(x, y){
    this.x = x;
    this.y = y;
};

/*
 * This function displays tooltips and was adapted from original code by Michael Leigeber.
 * See http://www.leigeber.com/
 */
Tooltip = function(useExplicitPositions, tooltipColour){
    var top = 3;
    var left = 3;
    var maxw = 300;
    var speed = 10;
    var timer = 20;
    var endalpha = 95;
    var alpha = 0;
    var tt, t, c, b, h;
    var ie = document.all ? true : false;
    
    this.show = function(v, w){
        if (tt == null) {
            tt = document.createElement('div');
            tt.style.color = tooltipColour;
            
            tt.style.position = 'absolute';
            tt.style.display = 'block';
            
            t = document.createElement('div');
            
            t.style.display = 'block';
            t.style.height = '5px';
            t.style.marginleft = '5px';
            t.style.overflow = 'hidden';
            
            c = document.createElement('div');
            
            b = document.createElement('div');
            
            tt.appendChild(t);
            tt.appendChild(c);
            tt.appendChild(b);
            document.body.appendChild(tt);
            
            if (!ie) {
                tt.style.opacity = 0;
                tt.style.filter = 'alpha(opacity=0)';
            }
            else 
                tt.style.opacity = 1;
            
            
        }
        
        if (!useExplicitPositions) 
            document.onmousemove = this.pos;
        
        tt.style.display = 'block';
        c.innerHTML = '<span style="font-weight:bold; font-family: arial;">' + v + '</span>';
        tt.style.width = w ? w + 'px' : 'auto';
        
        if (!w && ie) {
            t.style.display = 'none';
            b.style.display = 'none';
            tt.style.width = tt.offsetWidth;
            t.style.display = 'block';
            b.style.display = 'block';
        }
        
        if (tt.offsetWidth > maxw) {
            tt.style.width = maxw + 'px';
        }
        
        h = parseInt(tt.offsetHeight) + top;
        
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){
                fade(1)
            }, timer);
        }
    };
    
    this.setPos = function(e){
        tt.style.top = e.y + 'px';
        tt.style.left = e.x + 'px';
    };
    
    this.pos = function(e){
        var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
        var l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
        tt.style.top = (u - h) + 'px';
        tt.style.left = (l + left) + 'px';
        tt.style.zIndex = 999999999999;
    };
    
    function fade(d){
        var a = alpha;
        
        if ((a != endalpha && d == 1) || (a != 0 && d == -1)) {
            var i = speed;
            
            if (endalpha - a < speed && d == 1) {
                i = endalpha - a;
            }
            else 
                if (alpha < speed && d == -1) {
                    i = a;
                }
            
            alpha = a + (i * d);
            tt.style.opacity = alpha * .01;
            tt.style.filter = 'alpha(opacity=' + alpha + ')';
        }
        else {
            clearInterval(tt.timer);
            
            if (d == -1) {
                tt.style.display = 'none';
            }
        }
    }
    
    this.hide = function(){
        if (tt == null) 
            return;
        
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){
                fade(-1)
            }, timer);
        }
        else {
            tt.style.display = 'none';
        }
    };
};

degToRad = function(degrees){
    return degrees * Math.PI / 180;
};

function hexToR(h){
    return parseInt((cutHex(h)).substring(0, 2), 16)
}

function hexToG(h){
    return parseInt((cutHex(h)).substring(2, 4), 16)
}

function hexToB(h){
    return parseInt((cutHex(h)).substring(4, 6), 16)
}

function cutHex(h){
    return (h.charAt(0) == "#") ? h.substring(1, 7) : h
}

log = function(base, value){
    return Math.log(value) / Math.log(base);
};

JSSurfacePlot.DEFAULT_X_ANGLE_CANVAS = 47;
JSSurfacePlot.DEFAULT_Z_ANGLE_CANVAS = 45;
//JSSurfacePlot.DEFAULT_X_ANGLE_WEBGL = -70;
//JSSurfacePlot.DEFAULT_Y_ANGLE_WEBGL = -42;
JSSurfacePlot.DEFAULT_X_ANGLE_WEBGL = -45;
JSSurfacePlot.DEFAULT_Y_ANGLE_WEBGL = -120;
JSSurfacePlot.DATA_DOT_SIZE = 5;
JSSurfacePlot.DEFAULT_SCALE = 350;
JSSurfacePlot.MIN_SCALE = 50;
JSSurfacePlot.MAX_SCALE = 1100;
JSSurfacePlot.SCALE_FACTOR = 1.4;

