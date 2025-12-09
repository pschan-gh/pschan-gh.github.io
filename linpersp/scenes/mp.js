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
    truncateX,
    perspectivalProj,
    hslToHex,
} from "../utils.js";

export class Scene {
    constructor() {
        this.init();
    }

    init() {        
        const mainLineForm = new formObject(
            `<h3>$\\mathbf{L}$ Start Position</h3>
            <label>Px <span class="value" id="pxVal">2.5</span></label>
            <input type="range" min="-10" max="10" step="0.1" value="2.5" id="px" />
            <label>Py <span class="value" id="pyVal">1.5</span></label>
            <input type="range" min="-10" max="10" step="0.1" value="1.5" id="py" />
            <label>Pz <span class="value" id="pzVal">-1.0</span></label>
            <input type="range" min="-2" max="2" step="0.1" value="-1.0" id="pz" />
            <h3>$\\mathbf{L}$ Direction</h3>
            <label>$\\phi$ (polar)<span class="value" id="phiVal">86</span></label>
            <input type="range" min="0" max="180" step="2" value="86" id="phi" />

            <label>$\\theta$ (azimuth) <span class="value" id="thetaVal">-56</span></label>
            <input type="range" min="-90" max="90" step="2" value="-56" id="theta" />

            <label>Measuring Line <span class="value" id="mthetaVal">90</span></label>
            <input type="range" min="0" max="180" step="2" value="90" id="mtheta" />
			`
        );

        const pointABForm = new formObject(
            `
            <label>$A$ position
			<!-- <span class="value" id="aposVal">1</span> -->
			</label>
            <input type="range" min="-2" max="5" step="0.1" value="1" id="apos" />
            <label>$B$ position
			<!-- <span class="value" id="bposVal">1</span> -->
			</label>
            <input type="range" min="0" max="4.75" step="0.1" value="1" id="bpos" />
			`
        );

        const pointCForm = new formObject(
            `
            <div style="display:flex">
            <input type="checkbox" id="cside">
            <label for="cside">$C$ further away than $A$</label>
            </div>
			`
        );

        const origin = new Point({
            position: [0, 0, 0],
            label: "$O$",
            color: hslToHex(0, 0, 50),
        });
        const center = new Point({ position: [1, 0, 0], label: "$C$" });
        const picturePlane = new Plane({
            position: [1, 0, 0],
            normal: [1, 0, 0],
            parallel: [0, 0, 1],
            formName: "Picture Plane",
        });
        console.log(origin);
        origin.render();
        center.render({ color: 0x8888aa, clone: true });
        picturePlane.render();

        const mainLine = new Line({
            label: "$\\mathbf{L}$",
            length: 10,
            labelOffset: [-0.5, 0.5, -0.25],
        });
        mainLine.addParents([mainLineForm]).updateFromParents = () => {
            console.log("updating mainLine");
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

        const directional = new LineSegment();
        directional.addParents([mainLine]).updateFromParents = () => {
            const directionalEnd = perspectivalProj(mainLine.dir);
            directional.updateEndPoints(origin, directionalEnd);
        };

        const directionalExtension = new LineSegment({
            start: origin,
            end: origin.position
                .clone()
                .add(directional.dir.clone().multiplyScalar(2)),
        });
        directionalExtension.addParents([directional]).updateFromParents =
            () => {
                // directionalLine.updateDir(directional.dir);
                directionalExtension.updateEndPoints(
                    origin,
                    origin.position
                        .clone()
                        .add(directional.dir.clone().multiplyScalar(2))
                );
            };

        const vanishingPoint = new Point({
            label: "$V$",
            clone: true,
            color: mainLine.color,
        });

        vanishingPoint.addParents([mainLine]).updateFromParents = () => {
            const directionalEnd = perspectivalProj(mainLine.dir);
            vanishingPoint.updatePosition(directionalEnd);
        };

        // const horizonColor = 0x888888;
        // const horizon = new Line({
        //     color: horizonColor,
        //     clone: true,
        //     parent: vanishingPoint,
        // });

        const mainLine_ = mainLine.perspectivalProj("$\\mathbf{L'}$");
        mainLine_.labelOffset = [0, 0.5, -0.3];

        const mlLength = 6;
        const mlColor = "#ffaa44";
        const measuringLine = new Line({
            clone: true,
            length: mlLength,
            color: mlColor,
            label: "$\\mathbf{K}$",
            labelOffset: [0, -0.25, 0.25],
        });

        measuringLine.updateFromForm = () => {
            const mthetaDeg = +document.getElementById("mtheta").value;

            const mtheta = THREE.MathUtils.degToRad(mthetaDeg);

            // Direction vector from spherical coordinates
            const dir = vecPolymorph([0, Math.cos(mtheta), Math.sin(mtheta)]).multiplyScalar(0.5);

            measuringLine.update(vanishingPoint.position.clone().add(dir), dir);
        };
        measuringLine.addParents([vanishingPoint]).updateFromParents = () => {
            measuringLine.updatePosition(vanishingPoint.position);
            measuringLine.updateFromForm();
        };

        const pointAColor = "#aa4444";
        const pointA = new Point({
            // position: mainLine.point(apos),
            label: "$A$",
            parent: mainLine,
            color: pointAColor,
        });

        pointA.addParents([pointABForm, mainLine]).updateFromParents = () => {
            const apos = +document.getElementById("apos").value;
            pointA.updatePosition(mainLine.point(apos));
        };

        const pointA_ = pointA.perspectivalProj("$A'$");

        const measuringLineWorld = new Line({
            length: mlLength,
            color: mlColor,
            label: "$\\mathbf{J}$",
            labelOffset: [0, 0.25, 0.5],
        });
        measuringLineWorld.addParents([
            measuringLine,
            pointA,
        ]).updateFromParents = () => {
            const line = measuringLine;
            measuringLineWorld.update(
                pointA.position.clone().add(line.dir),
                line.dir
            );
        };

        const measuringLineWorld_ =
            measuringLineWorld.perspectivalProj("$\\mathbf{J'}$");
        measuringLineWorld_.labelOffset = [0, 0.25, 1];

        const pointBColor = pointA.color;
        // const bpos = +document.getElementById('bpos').value;
        const pointB = new Point({
            // position: pointA.position.clone().add(measuringLineWorld.dir.clone().multiplyScalar(bpos)),
            label: "$B$",
            color: pointBColor,
        });

        pointB.addParents([pointABForm, measuringLineWorld]).updateFromParents =
            () => {
                const bpos = +document.getElementById("bpos").value;
                // pointB.updatePosition(measuringLineWorld.point(bpos));
                pointB.updatePosition(
                    pointA.position
                        .clone()
                        .add(
                            measuringLineWorld.dir.clone().multiplyScalar(bpos)
                        )
                );
            };

        const pointB_ = pointB.perspectivalProj("$B'$");

        const lineAB = new LineSegment({
            start: pointA,
            end: pointB,
            color: pointA.color,
            thickness: 0.035,
        });

        const lineA_B_ = lineAB.perspectivalProj();

        const pointCColor = "#44aa44";
        // const dirSign = document.getElementById('cside').checked ? 1 : -1;
        const pointC = new Point({
            // position: pointA.position.clone().add(mainLine.dir.clone().multiplyScalar(dirSign * bpos)),
            label: "$C$",
            color: pointCColor,
        });

        pointC.addParents([pointA, pointB, pointCForm]).updateFromParents =
            () => {
                const len = pointA.position.distanceTo(pointB.position);
                const dirSign = document.getElementById("cside").checked
                    ? 1
                    : -1;
                pointC.updatePosition(
                    pointA.position
                        .clone()
                        .add(mainLine.dir.clone().multiplyScalar(dirSign * len))
                );
            };

        const pointC_ = pointC.perspectivalProj("$C'$");

        // const lineOC = new LineSegment({ start: origin, end: pointC });

        // const lineOA = new LineSegment({ start: origin, end: pointA });

        // const lineOB = new LineSegment({ start: origin, end: pointB });

        const pointBtilde = new Point({ label: "$\\tilde{B}$" });
        pointBtilde.addParents([
            vanishingPoint,
            measuringLine,
            pointCForm,
        ]).updateFromParents = () => {
            const cfurther = document.getElementById("cside").checked
                ? true
                : false;
            pointBtilde.setVisibility(cfurther);
            pointBtilde.updatePosition(
                vanishingPoint.position
                    .clone()
                    .add(
                        measuringLine.dir
                            .clone()
                            .multiplyScalar(vanishingPoint.position.length())
                    )
            );
        };
        const pointCtilde = new Point({ label: "$\\tilde{C}$" });
        pointCtilde.addParents([vanishingPoint, pointCForm]).updateFromParents = () => {
            pointCtilde.updatePosition(directionalExtension.end);
            pointCtilde.visible = document.getElementById("cside").checked;
        };

        const lineBCtilde = new LineSegment({
            start: pointBtilde,
            end: pointCtilde,
        });
        lineBCtilde.addParents([pointCForm]).updateFromParents = () => {
            lineBCtilde.visible = document.getElementById("cside").checked;
        };

        const segmentM = new LineSegment();
        segmentM.addParents([
            measuringLine,
            vanishingPoint,
            pointC,
        ]).updateFromParents = () => {
            const dirSign = document.getElementById("cside").checked ? 1 : -1;
            const len = vanishingPoint.position.length();
            const start = vanishingPoint.position;
            const end = vanishingPoint.position.clone().add(
                measuringLine.dir
                    .clone()
                    .normalize()
                    .multiplyScalar(-1 * dirSign * len)
            );
            segmentM.updateEndPoints(start, end);
        };

        const pointM = new Point({
            label: "$M$",
            clone: true,
            color: mlColor,
        });
        pointM.addParents([segmentM]).updateFromParents = () => {
            pointM.updatePosition(segmentM.end);
        };

        const colorBC = "#444";
        const lineBC = new LineSegment({
            start: pointB,
            end: pointC,
            color: colorBC,
        });

        // const lineBC_ = lineBC.perspectivalProj();

        const lineOM = new LineSegment({
            start: origin,
            end: pointM,
            color: colorBC,
        });

        const lineMB_ = new LineSegment({
            start: pointM,
            end: pointB_,
            clone: true,
            formName: "$\\overline{MB'}$"
        });

        const lineMC_ = new LineSegment({
            start: pointM,
            end: pointC_,
            clone: true,
            formName: "$\\overline{MC'}$"
        });

        const planeABC = new Plane({
            formName: "ABC",
            position: pointA,
            normal: mainLine.dir
                .clone()
                .cross(pointB.position.clone().sub(pointA.position)),
            visible: false,
        });
        planeABC.addParents([
            mainLine,
            pointA,
            pointB,
            pointC,
        ]).updateFromParents = () => {
            planeABC.update(
                pointA,
                mainLine.dir
                    .clone()
                    .cross(pointB.position.clone().sub(pointA.position))
            );
        };

        const planeVMO = new Plane({
            formName: "VMO",
            position: vanishingPoint,
            normal: mainLine.dir
                .clone()
                .cross(pointM.position.clone().sub(vanishingPoint.position)),
            visible: false,
        });
        planeVMO.addParents([
            mainLine,
            vanishingPoint,
            pointM,
            origin,
        ]).updateFromParents = () => {
            planeVMO.update(
                vanishingPoint,
                mainLine.dir
                    .clone()
                    .cross(pointM.position.clone().sub(vanishingPoint.position))
            );
        };

        mainLineForm.updateChildren();
        mainLineForm.render();

        ["px", "py", "pz", "theta", "phi"].forEach((id) => {
            document.getElementById(id).addEventListener("input", () => {
                const val = +document.getElementById(id).value;
                document.getElementById(`${id}Val`).textContent =
                    val.toFixed(1);
            });
        });
    }
}
