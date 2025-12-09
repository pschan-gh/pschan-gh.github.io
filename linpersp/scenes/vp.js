import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";

import {
    counter,
    Label,
    formObject,
    geometricObject,
    Point,
    LineSegment,
    Line,
    Plane,
    Pyramid,
} from "../objects.js";

import {
    arrayPolymorph,
    vecPolymorph,
    perspectivalProj,
    truncateX,
} from "../utils.js";

export class Scene {
    constructor() {
        this.animateSlider = this.animateSlider.bind(this);
        this.startAnimation = this.startAnimation.bind(this);
        this.stopAnimation = this.stopAnimation.bind(this);
        this.animationId = null;
        this.direction = 1; // 1 for right, -1 for left
        this.animationSpeed = 0.1; // Controls how fast the slider moves per frame
        this.init();
    }

    init() {
        const mainLineForm = new formObject(
            `<h3>$\\mathbf{L}$ Start Position</h3>
            <label>Px <span class="value" id="pxVal">1.0</span></label>
            <input type="range" min="-10" max="10" step="0.1" value="1.0" id="px" />
            <label>Py <span class="value" id="pyVal">-1.6</span></label>
            <input type="range" min="-10" max="10" step="0.1" value="-1.6" id="py" />
            <label>Pz <span class="value" id="pzVal">-2.0</span></label>
            <input type="range" min="-2" max="2" step="0.1" value="-2.0" id="pz" />
            <h3>$\\mathbf{L}$ Direction</h3>
            <label>$\\phi$ (polar)<span class="value" id="phiVal">86</span></label>
            <input type="range" min="0" max="180" step="2" value="86" id="phi" />

            <label>$\\theta$ (azimuth) <span class="value" id="thetaVal">-34</span></label>
            <input type="range" min="-90" max="90" step="2" value="-34" id="theta" />
			`
        );

        const pointAForm = new formObject(
            `
            <label>$A$ position<span class="value" id="pyramidScale">1</span></label>
            <input type="range" min="0.1" max="10" step="0.05" value="1" id="pscale" />
            <button id="startButton">Start Animation</button>
            <button id="stopButton">Stop Animation</button>
			`
        );

        const origin = new Point({ position: [0, 0, 0], label: "$O$" });
        const center = new Point({
            position: [1, 0, 0],
            clone: true,
            label: "$C$",
        });
        const picturePlane = new Plane({
            position: [1, 0, 0],
            normal: [1, 0, 0],
            parallel: [0, 0, 1],
            formName: "Picture Plane",
        });

        const mainLine = new Line({
            label: "$\\mathbf{L}$",
            labelOffset: [-1, 0.5, 0],
        });
        mainLine.addParents([mainLineForm]).updateFromParents = () => {
            const px = +document.getElementById("px").value;
            const py = +document.getElementById("py").value;
            const pz = +document.getElementById("pz").value;
            const thetaDeg = +document.getElementById("theta").value;
            const phiDeg = +document.getElementById("phi").value;

            const theta = THREE.MathUtils.degToRad(thetaDeg);
            const phi = THREE.MathUtils.degToRad(phiDeg);

            // Direction vector from spherical coordinates
            const dir = [
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi),
            ];
            mainLine.update([px, py, pz], dir);
        };

        const directional = new Line({
            length: 10,
            label: "$\\mathbf{D}$",
            labelOffset: [-1, 0.5, 0],
        });

        directional.addParents([mainLine]).updateFromParents = () => {
            // const directionalEnd = perspectivalProj(mainLine.dir);
            // directional.updateEndPoints(origin, directionalEnd);
            directional.update(origin, perspectivalProj(mainLine.dir));
        };

        const vanishingPoint = new Point({
            label: "$V$",
            parent: mainLine,
            clone: true,
        });

        vanishingPoint.addParents([mainLine]).updateFromParents = () => {
            const directionalEnd = perspectivalProj(mainLine.dir);
            vanishingPoint.updatePosition(directionalEnd);
        };

        // origin.render({ color: 0x88ff88 });
        origin.render({});
        center.render({ color: 0x8888aa, clone: true });
        picturePlane.render();

        const pointB = new Point({
            position: [0, 0, 0],
            label: "$B$",
            parent: mainLine,
        });

        pointB.addParents([mainLine]).updateFromParents = () => {
            let t0 = (1 - mainLine.position.x) / mainLine.dir.x;
            pointB.updatePosition(mainLine.point(t0));
        };

        const lineVB = new LineSegment({ color: "#88aa88", clone: true });

        lineVB.addParents([vanishingPoint, pointB]).updateFromParents = () => {
            lineVB.updateEndPoints(vanishingPoint, pointB);
        };

        const horizon = new Line({
            position: center,
            dir: truncateX(mainLine.dir),
            clone: true,
        });
        horizon.addParents([mainLine, pointB]).updateFromParents = () => {
            horizon.update(center, truncateX(mainLine.dir));
        };

        const groundPlane = new Plane({
            label: "Ground Plane",
            size: 6,
            parent: mainLine,
            parallel: mainLine.dir,
            visible: true,
        });
        groundPlane.addParents([mainLine, pointB]).updateFromParents = () => {
            const groundNormal = mainLine.dir.clone().cross(center.position);
            groundPlane.updatePosition(pointB.position);
            groundPlane.updateNormal(groundNormal);
            groundPlane.updateParallel(mainLine.dir);
        };

        const groundPlaneIntersection = new Line({
            position: pointB,
            normal: groundPlane.normal.clone().cross(picturePlane.normal),
        });
        groundPlaneIntersection.addParents([
            pointB,
            groundPlane,
        ]).updateFromParents = () => {
            groundPlaneIntersection.update(
                pointB,
                groundPlane.normal.clone().cross(picturePlane.normal)
            );
        };

        const OBarForm = new formObject(
            `
            <h3>Rotate about horizon</h3>
            <input type="range" min="0" max="90" step="2" value="0" id="alpha" />
			`
        );

        const pointOBar = new Point({ label: "$\\overline{O}$" });
        pointOBar.addParents([mainLine, OBarForm]).updateFromParents = () => {
            const alphaDeg = +document.getElementById("alpha").value;
            const alpha = THREE.MathUtils.degToRad(alphaDeg);

            const auxVec = mainLine.dir
                .clone()
                .multiplyScalar(-1 * Math.sign(mainLine.dir.y));
            const axisVec = truncateX(auxVec).normalize();

            pointOBar.updatePosition(
                origin.position
                    .clone()
                    .sub(center.position)
                    .applyAxisAngle(axisVec, alpha)
                    .add(center.position)
            );

            pointOBar.clone = alpha >= THREE.MathUtils.degToRad(88);
        };

        const lineVOBar = new LineSegment({
            start: vanishingPoint,
            end: pointOBar,
        });
        lineVOBar.updateFromParents = () => {
            const alphaDeg = +document.getElementById("alpha").value;
            const alpha = THREE.MathUtils.degToRad(alphaDeg);

            lineVOBar.updateEndPoints(vanishingPoint, pointOBar);
            lineVOBar.clone = alpha >= THREE.MathUtils.degToRad(88);
        };

        const lineCO = new LineSegment({
            start: center,
            end: origin,
        });
        lineCO.addParents([mainLine]).updateFromParents = () => {
            lineCO.updateEndPoints(center, origin);
        };

        const lineCOBar = new LineSegment({
            start: center,
            end: pointOBar,
        });
        lineCOBar.updateFromParents = () => {
            const alphaDeg = +document.getElementById("alpha").value;
            const alpha = THREE.MathUtils.degToRad(alphaDeg);

            lineCOBar.updateEndPoints(center, pointOBar);
            lineCOBar.clone = alpha >= THREE.MathUtils.degToRad(88);
        };

        const projLine = new Plane({
            label: "Projective Line",
            size: 6,
            parent: mainLine,
            parallel: mainLine.dir,
            visible: false,
        });

        projLine.addParents([mainLine]).updateFromParents = () => {
            const projLineNormal = mainLine.dir
                .clone()
                .cross(mainLine.position);
            projLine.updatePosition(mainLine.position);
            projLine.updateNormal(projLineNormal);
            projLine.updateParallel(mainLine.dir);
        };

        const pointAColor = "#aa4444";
        const pointA = new Point({
            position: mainLine.point(pscale),
            label: "$A$",
            parent: mainLine,
            color: pointAColor,
        });

        pointA.addParents([mainLine, pointAForm]).updateFromParents = () => {
            const pscale = +document.getElementById("pscale").value;
            pointA.updatePosition(mainLine.point(pscale));
        };

        const pyramid = new Pyramid({ parent: mainLine, scale: 1 });
        pyramid.addParents([mainLine, pointA]).updateFromParents = () => {
            const pscale = +document.getElementById("pscale").value;
            pyramid.updateLine(mainLine);
            pyramid.updateScale(pscale);
        };

        const pointA_ = pointA.perspectivalProj("$A'$");

        mainLineForm.updateChildren();
        mainLineForm.render();

        // Attach all sliders
        ["px", "py", "pz", "theta", "phi"].forEach((id) => {
            document.getElementById(id).addEventListener("input", () => {
                const val = +document.getElementById(id).value;
                document.getElementById(`${id}Val`).textContent =
                    val.toFixed(1);
            });
        });

        ["pscale"].forEach((id) => {
            document.getElementById(id).addEventListener("input", () => {
                const pscale = +document.getElementById("pscale").value;
                document.getElementById("pyramidScale").textContent =
                    pscale.toFixed(1);
            });
        });
        const startButton = document.getElementById("startButton");
        const stopButton = document.getElementById("stopButton");

        // Add event listeners to the buttons
        startButton.addEventListener("click", this.startAnimation);
        stopButton.addEventListener("click", this.stopAnimation);
        // Custom animation logic
        // this.app.setUpdateCallback(() => this.update());
    }

    animateSlider() {
        const slider = document.getElementById("pscale");
        let currentValue = parseFloat(slider.value);

        currentValue += this.direction * this.animationSpeed;

        if (currentValue >= slider.max) {
            slider.value = slider.min;
            // currentValue = slider.min;
        } else {
            slider.value = Math.max(
                slider.min,
                Math.min(slider.max, currentValue)
            );
        }
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        this.animationId = window.requestAnimationFrame(this.animateSlider);
    }

    stopAnimation() {
        if (this.animationId) {
            window.cancelAnimationFrame(this.animationId);
            this.animationId = null; // Clear the ID so it can be restarted
        }
    }

    startAnimation() {
        if (!this.animationId) {
            // Only start if not already running
            this.animationId = window.requestAnimationFrame(this.animateSlider);
        }
    }

    //   update() {
    //     this.cube.rotation.x += 0.01;
    //     this.cube.rotation.y += 0.01;
    //   }
}
