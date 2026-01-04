// This file is part of Linear Perspective for the Math-Curious.
//  Copyright (C) 2025 Ping-Shun Chan

//  Linear Perspective for the Math-Curious is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.

//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*
 * This educational content (geometric and interactive designs) is licensed
 * under CC BY-SA 4.0 (creativecommons.org).
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

import {
	labelGroup,
	Group,
	Label,
	formObject,
	Slider,
	Button,
	Point,
	LineSegment,
	Line,
	Plane,
	Pyramid,
	Arc,
	renderAll,
	projectPointOntoLine,
	SmallRectangle,
	switchAllGroups,
} from '../objects.js';

import { vecPolymorph, perspectivalProj, truncateX, blendDecimalColors, animateSlider } from '../utils.js';

export class Scene {
	constructor() {
		this.animateSlider = this.animateSlider.bind(this);
		this.startAnimation = this.startAnimation.bind(this);
		this.stopAnimation = this.stopAnimation.bind(this);
		this.animationId = null;
		this.direction = 1; // 1 for right, -1 for left
		this.animationSpeed = 0.01; // Controls how fast the slider moves per frame
		this.init();
	}

	init() {
		const mainLineForm = new formObject();

		const pxForm = new Slider({
			min: -1,
			max: 5,
			step: 0.1,
			value: 0.5,
			label: 'Px',
			id: 'px',
		});
		const pyForm = new Slider({
			min: -5,
			max: 5,
			step: 0.1,
			value: 1.6,
			label: 'Py',
			id: 'py',
		});
		const pzForm = new Slider({
			min: -3,
			max: 2,
			step: 0.1,
			value: -2.0,
			label: 'Pz',
			id: 'pz',
		});

		const phiForm = new Slider({
			min: -90,
			max: 90,
			step: 2,
			value: 10,
			label: '$\\phi$ (polar)',
			id: 'phi',
		});

		const thetaForm = new Slider({
			min: -90,
			max: 90,
			step: 2,
			value: 30,
			label: '$\\theta$ (azimuth)',
			id: 'theta',
		});

		const deltaForm = new Slider({
			min: -90,
			max: 90,
			step: 2,
			value: 0,
			label: '$\\delta$',
			id: 'delta',
		});

		const seatGroup = new Group([], {
			checked: false,
			formName: 'seat',
		});

		mainLineForm.addParents([pxForm, pyForm, pzForm]);

		const pointAForm = new Slider({
			min: 0,
			max: 1,
			step: 0.01,
			value: 0.35,
			label: '$A$ position',
			id: 'pscale',
		});

		const origin = new Point({ position: [0, 0, 0], label: '$O$' });

		const center = new Point({
			position: [1, 0, 0],
			clone: true,
			label: '$Z$',
			labelOffset: [0, 0.125, 0.125],
		});

		const picturePlane = new Plane({
			position: [1, 0, 0],
			normal: [1, 0, 0],
			parallel: [0, 0, 1],
			// formName: "Picture Plane",
			label: 'Picture Plane $\\Pi$',
			labelOffset: [0, 2, 2.5],
			opacity: 0.5,
			color: '#8a8',
		});

		const pointB = new Point({
			position: [0, 0, 0],
			label: '$B$',
		});

		// pointB.addParents([mainLine]).addUpdate(() => {
		pointB.addParents([mainLineForm]).addUpdate(() => {
			const px = +document.getElementById('px').value + 1;
			const py = +document.getElementById('py').value * -1;
			const pz = +document.getElementById('pz').value;
			pointB.updatePosition([px, py, pz]);
			// pointB.updatePosition(
			//     mainLine.dir.x > 10 ** -12
			//         ? mainLine.position
			//               .clone()
			//               .add(
			//                   mainLine.dir
			//                       .clone()
			//                       .multiplyScalar(
			//                           (1 - mainLine.position.x) / mainLine.dir.x
			//                       )
			//               )
			//         : mainLine.position
			// );
			pointB.clone = px == 1;
		});

		const pointB_ = pointB.perspectivalProj({
			label: "$B'$",
			labelOffset: [0, 0, -0.15],
			// visible: false,
		});

		const groundPlane = new Plane({
			// label: "Ground Plane",
			formName: '$\\mathcal{G}$',
			// size: 6,
			parallel: center,
			// visible: false,
		});
		groundPlane.addParents([mainLineForm, phiForm, thetaForm, pointB, center]).addUpdate(function () {
			const px = +document.getElementById('px').value + 1;
			const py = +document.getElementById('py').value * -1;
			const pz = +document.getElementById('pz').value;
			const thetaDeg = +document.getElementById('theta').value;
			const phiDeg = +document.getElementById('phi').value;

			const theta = THREE.MathUtils.degToRad(thetaDeg);
			const phi = THREE.MathUtils.degToRad(-phiDeg + 90);

			// Direction vector from spherical coordinates
			const dir = [Math.sin(phi) * Math.cos(-theta), Math.sin(phi) * Math.sin(-theta), Math.cos(phi)];

			const groundNormal = vecPolymorph(dir).cross(center.position);

			if (groundNormal.length() < 10 ** -12) {
				this.degenerate = true;
				return false;
			}

			const centerProj = projectPointOntoLine(center, pointB, truncateX(dir));
			this.updatePosition(centerProj);
			this.updateNormal(groundNormal);
			this.updateParallel(center);
		});

		const mainLine = new Line({
			label: '$\\mathbf{L}$',
			labelShift: -2,
		});
		// mainLine.addParents([mainLineForm]).addUpdate(() => {
		mainLine.addParents([pointB, groundPlane, deltaForm]).addUpdate(() => {
			// const px = +document.getElementById("px").value + 1;
			// const py = +document.getElementById("py").value * -1;
			// const pz = +document.getElementById("pz").value;
			// const thetaDeg = +document.getElementById("theta").value;
			// const phiDeg = +document.getElementById("phi").value;

			// const theta = THREE.MathUtils.degToRad(thetaDeg);
			// const phi = THREE.MathUtils.degToRad(-phiDeg + 90);
			// const delta = THREE.MathUtils.degToRad(
			//     -1 * deltaForm.div.querySelector('input[type="range"]').value
			// );
			const delta = THREE.MathUtils.degToRad(-1 * deltaForm.getValue());

			// Direction vector from spherical coordinates
			// const dir = [
			//     Math.sin(phi) * Math.cos(-theta),
			//     Math.sin(phi) * Math.sin(-theta),
			//     Math.cos(phi),
			// ];

			const newDir = vecPolymorph([1, 0, 0]).applyAxisAngle(groundPlane.normal, delta);
			mainLine.update(pointB, newDir);
		});

		const directional = new Line({
			length: 10,
			label: '$\\mathbf{D}$',
			labelShift: -3,
		});

		directional.addParents([mainLine]).addUpdate(() => {
			directional.update(origin.position.clone().add(mainLine.dir.clone().multiplyScalar(2)), mainLine.dir);
		});

		const pointV = new Point({
			label: '$V$',
			parent: mainLine,
			clone: true,
		});

		pointV.addParents([mainLine]).addUpdate(() => {
			const directionalEnd = perspectivalProj(mainLine.dir);
			pointV.updatePosition(directionalEnd);
		});

		const horizon = new Line({
			position: center,
			dir: truncateX(mainLine.dir.clone()),
			clone: true,
			formName: 'Horizon',
			label: '$\\mathbf{H}$',
			labelShift: -1.5,
			length: 6,
			color: picturePlane.color,
		});
		horizon.addParents([mainLine]).addUpdate(function () {
			const dir_ = truncateX(mainLine.dir.clone());
			if (dir_.length() < 10 ** -12) {
				this.degenerate = true;
				return false;
			}
			const dir = dir_.normalize().multiplyScalar(-2);
			this.update(center.position.clone(), truncateX(mainLine.dir));
		});

		const OHatForm = new Slider({
			min: 0,
			max: 90,
			value: 0,
			step: 2,
			id: 'alpha',
			label: 'Rotate',
		});

		const pointOHat = new Point({
			label: '$\\hat{O}$',
			labelOffset: [0, 0, -0.2],
		});
		pointOHat.addParents([mainLine, OHatForm]).addUpdate(() => {
			const alphaDeg = +document.getElementById('alpha').value;
			const alpha = THREE.MathUtils.degToRad(alphaDeg);

			const auxVec = mainLine.dir
				.clone()
				.multiplyScalar(-1 * Math.sign(mainLine.dir.y == 0 ? 1 : mainLine.dir.y));
			const axisVec = truncateX(auxVec).normalize();

			pointOHat.updatePosition(
				origin.position
					.clone()
					.sub(center.position.clone())
					.applyAxisAngle(axisVec, alpha)
					.add(center.position.clone())
			);

			pointOHat.clone = alpha >= THREE.MathUtils.degToRad(88);
			pointOHat.setVisibility(alpha > 0.1);
		});

		const lineVO = new LineSegment({
			start: pointV,
			end: origin,
		});

		const lineVOHat = new LineSegment({
			start: pointV,
			end: pointOHat,
		});
		lineVOHat.addUpdate(function () {
			const alphaDeg = +document.getElementById('alpha').value;
			const alpha = THREE.MathUtils.degToRad(alphaDeg);

			// this.updateEndPoints(pointV, pointOHat);
			lineVOHat.clone = alpha >= THREE.MathUtils.degToRad(88);
		});

		const lineCO = new LineSegment({
			start: center,
			end: origin,
		});

		const lineCOHat = new LineSegment({
			start: center,
			end: pointOHat,
		});
		lineCOHat.addUpdate(() => {
			const alphaDeg = +document.getElementById('alpha').value;
			const alpha = THREE.MathUtils.degToRad(alphaDeg);

			// lineCOHat.updateEndPoints(center, pointOHat);
			lineCOHat.clone = alpha >= THREE.MathUtils.degToRad(88);
		});

		const projLine = new Plane({
			formName: '$\\mathcal{P}$',
			// size: 2,
			parent: mainLine,
			parallel: mainLine.dir,
			// visible: false,
		});

		projLine.addParents([mainLine, pointB]).addUpdate(() => {
			const projLineNormal = mainLine.dir.clone().cross(mainLine.position.clone());
			projLine.updatePosition(pointA_.position.clone().add(pointB_.position).multiplyScalar(0.5));
			projLine.updateNormal(projLineNormal);
			projLine.updateParallel(mainLine.dir);
		});

		const lineVB = new LineSegment({
			start: pointV,
			end: pointB,
			// color: "#88aa88",
			color: blendDecimalColors(picturePlane.color, projLine.color),
			clone: true,
		});

		const mainLineProj = mainLine.perspectivalProj({
			label: "$\\mathbf{L}'$",
			clone: true,
			// hideForm: true,
			labelShift: -3.5,
			opacity: 0.35,
		});
		// mainLineProj.defaultUpdate = mainLineProj.updateFromParents;
		mainLineProj.addUpdate(function () {
			// this.setVisibility(pointV.degenerate);
		});

		const pscale = +document.getElementById('pscale').value;
		const pointAColor = '#aa4444';
		const pointA = new Point({
			position: mainLine.point(pscale),
			label: '$A$',
			parent: mainLine,
			color: pointAColor,
		});

		pointA.addParents([mainLine, pointB, pointAForm]).addUpdate(function () {
			const pscale = +document.getElementById('pscale').value;
			// pointA.updatePosition(mainLine.point(0.5 + 0.5 * pscale));
			pointA.updatePosition(
				pointB.position.clone().add(mainLine.dir.clone().multiplyScalar(0.5 * mainLine.length * pscale))
			);
		});

		const pointADagger = pointA.seat({
			// label: "$\\tilde{A}$",
			label: '$A^{\\dagger}$',
			labelOffset: [0, -0.15, 0.15],
		});
		const lineAADagger = new LineSegment({
			start: pointA,
			end: pointADagger,
		});
		const lineOZ = new LineSegment({ start: origin, end: center });

		const lineOA = new LineSegment({ start: origin, end: pointA });

		const lineZADagger = new LineSegment({
			start: center,
			end: pointADagger,
			visible: false,
			hideForm: true,
		});

		const lineBA = new LineSegment({
			start: pointB,
			end: pointA,
			visible: false,
		});

		const OStarForm = new Slider({
			min: 0,
			max: 90,
			value: 0,
			step: 1,
			id: 'alpha',
			label: 'Rotate',
		});

		const pointOStar = new Point({
			label: '$O^{\\ast}$',
			labelOffset: [0, 0, -0.2],
		});
		pointOStar.addParents([origin, lineZADagger, OStarForm, center]).addUpdate(function () {
			const alpha = OStarForm.getValue();

			this.rotate(origin, lineZADagger.dir, center, alpha);
			this.clone = alpha >= 88;
			this.setVisibility(alpha > 0.1);
		});

		const lineZOStar = new LineSegment({ start: center, end: pointOStar })
			.addParents([OStarForm])
			.addUpdate(function () {
				const alpha = OStarForm.getValue();
				this.clone = alpha >= 88;
				this.setVisibility(alpha > 0.1);
			});

		const pointAStar = new Point({
			label: '$A^{\\ast}$',
			labelOffset: [0, 0, 0.15],
		});

		pointAStar.addParents([pointA, lineZADagger, OStarForm, center]).addUpdate(function () {
			const alpha = OStarForm.getValue();

			this.rotate(pointA, lineZADagger.dir, pointADagger, alpha);
			this.clone = alpha >= 88;
			this.setVisibility(alpha > 0.1);
		});

		const lineADaggerAStar = new LineSegment({
			start: pointADagger,
			end: pointAStar,
		})
			.addParents([OStarForm])
			.addUpdate(function () {
				const alpha = OStarForm.getValue();
				this.clone = alpha >= 88;
				this.setVisibility(alpha > 0.1);
			});

		seatGroup.add([pointAStar, lineADaggerAStar]);

		const rightAngleADaggerZ = new SmallRectangle({
			position: pointADagger,
			pos1: pointAStar,
			pos2: center,
		})
			.addParents([OStarForm])
			.addUpdate(function () {
				const alpha = OStarForm.getValue();
				this.clone = alpha >= 88;
				this.setVisibility(alpha > 0.1);
			});
		seatGroup.addMember(rightAngleADaggerZ);

		const rightAngleZOStar = new SmallRectangle({
			position: center,
			pos1: pointOStar,
			pos2: pointADagger,
		})
			.addParents([OStarForm])
			.addUpdate(function () {
				const alpha = OStarForm.getValue();
				this.clone = alpha >= 88;
				this.setVisibility(alpha > 0.1);
			});
		seatGroup.addMember(rightAngleZOStar);

		const lineOAStar = new LineSegment({
			start: pointOStar,
			end: pointAStar,
		})
			.addParents([OStarForm])
			.addParents([OStarForm])
			.addUpdate(function () {
				const alpha = OStarForm.getValue();
				this.clone = alpha >= 88;
				this.setVisibility(alpha > 0.1);
			});
		seatGroup.addMember(lineOAStar);
		seatGroup.addMember(
			new Arc({
				pos1: origin,
				pos2: pointOStar,
				position: center,
				radius: 1,
				color: '#888',
				thickness: 1,
				filled: true,
				opacity: 0.5,
			})
		);

		seatGroup.add(
			new Arc({
				pos1: pointA,
				pos2: pointAStar,
				position: pointADagger,
				radius: 1,
				color: '#888',
				thickness: 1,
				filled: true,
				opacity: 0.5,
			})
		);

		const planeStar = new Plane({
			position: center,
			normal: lineZOStar.dir.clone().cross(lineZADagger.dir),
			parallel: lineZADagger.dir.clone(),
			// visible: false,
		})
			.addParents([center, pointOStar, pointA, OStarForm])
			.addUpdate(function () {
				this.update(center.position, lineZOStar.dir.clone().cross(lineZADagger.dir));
				this.updateParallel(lineOZ.dir.clone());
				// const alpha = OStarForm.getValue();
				// this.clone = alpha >= 88;
				// this.setVisibility(alpha < 90 && alpha > 0.1);
			});

		seatGroup.add(planeStar);

		seatGroup.add(
			new Line({
				label: '$\\mathbf{K}$',
				clone: true,
				color: '#aaa',
				opacity: 0.5,
				labelShift: -2,
			})
				.addParents([center, pointADagger])
				.addUpdate(function () {
					this.update(center, pointADagger.position.clone().sub(center.position));
				})
		);

		const pyramid = lineBA.pyramid();

		const pointA_ = pointA.perspectivalProj({
			label: "$A'$",
			labelOffset: [0, -0.15, 0.15],
		});

		const lineADaggerA_ = new LineSegment({
			start: pointA_,
			end: pointADagger,
			clone: true,
		});

		const lineZA_ = new LineSegment({
			start: center,
			end: pointA_,
			clone: true,
		});

		const rightAngleADagger = new SmallRectangle({
			position: pointADagger,
			pos1: pointA,
			pos2: pointA_,
			filled: true,
		});

		const rightAngleZ = new SmallRectangle({
			position: center,
			pos1: origin,
			pos2: pointA_,
			filled: true,
		});

		const lineAB_ = new LineSegment({
			start: pointA_,
			end: pointB_,
			clone: true,
		});

		const angleMainLine = new Arc({
			pos1: center,
			pos2: pointV,
			position: origin,
			radius: 0.33,
			color: '#ec9',
			thickness: 1,
			filled: true,
			label: '$\\delta$',
		});

		const angleMainLineRotated = new Arc({
			pos1: center,
			pos2: pointV,
			position: pointOHat,
			radius: 0.33,
			color: angleMainLine.color,
			thickness: angleMainLine.thickness,
			label: '$\\delta$',
		});
		angleMainLineRotated
			// .addParents([pointV, center, pointOHat])
			.addUpdate(function () {
				// this.updatePosition(pointOHat);
				// this.updateVertices(center, pointV);
				const alphaDeg = +document.getElementById('alpha').value;
				const alpha = THREE.MathUtils.degToRad(alphaDeg);
				angleMainLineRotated.clone = alpha >= THREE.MathUtils.degToRad(88);
			});

		const rotateArc = new Arc({
			pos1: origin,
			pos2: pointOHat,
			position: center,
			radius: 1,
			color: '#888',
			thickness: 1,
			filled: true,
			opacity: 0.5,
		});

		const rightAngle = new SmallRectangle({
			position: center,
			pos1: pointV,
			pos2: origin,
			filled: true,
		});

		const rightAngleRotated = new SmallRectangle({
			position: center,
			pos1: pointV,
			pos2: pointOHat,
		}).addUpdate(function () {
			const alphaDeg = +document.getElementById('alpha').value;
			const alpha = THREE.MathUtils.degToRad(alphaDeg);
			this.clone = alpha >= THREE.MathUtils.degToRad(88);
		});

		const orthogonalLine = new Line({
			position: pointB,
			dir: [1, 0, 0],
			label: '$\\mathbf{K}$',
			labelShift: -2,
		});

		const angleFromOthogonalLine = new Arc({
			position: pointB,
			pos1: orthogonalLine.getPoint(1),
			pos2: mainLine.getPoint(1),
			radius: 0.33,
			filled: true,
			color: '#888',
			label: '$\\delta$',
		});

		const defaultGroup = new Group([pointAForm, pointA, lineOA, pointA_], {
			checked: true,
			formName: 'default',
		});

		seatGroup.addMembers([
			center,
			pointAForm,
			pointA,
			pointA_,
			pointADagger,
			lineOA,
			lineOZ,
			lineZADagger,
			lineADaggerA_,
			lineZA_,
			lineZOStar,
			lineAADagger,
			rightAngleADagger,
			rightAngleZ,
			OStarForm,
			pointOStar,
		]);

		const moveAGroup = new Group(
			[mainLine, pointAForm, pointA, pointA_, lineOA, pointB, pointB_, lineAB_, pyramid],
			{
				checked: false,
				formName: 'line projection',
			}
		);

		const transversalGroup = new Group(
			[
				mainLine,
				pointAForm,
				pointA,
				pointA_,
				lineOA,
				pointB,
				pointB_,
				lineAB_,
				pointB,
				pointB_,
				pyramid,
				mainLineProj,
				projLine,
			],
			{
				checked: false,
				formName: 'Transversal case',
			}
		);

		const nonTransversalGroup = new Group(
			[
				mainLine,
				pointV,
				lineVB,
				mainLineProj,
				directional,
				pointB,
				pointB_,
				pointAForm,
				pointA,
				pointA_,
				pyramid,
				lineOA,
				projLine,
			],
			{
				checked: false,
				formName: 'Non-transversal case',
			}
		);

		const orthogonalCase = new Group([mainLine, pointV, directional, center], {
			checked: false,
			formName: 'Orthogonal Case',
		});

        const defaultButton = new Button({
			selectorString: '#text .default',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				pxForm.setValue(1.5);
				pyForm.setValue(1.5);
				pzForm.setValue(-0.5);
				phiForm.setValue(10);
				thetaForm.setValue(30);
				deltaForm.setValue(30);
				pointAForm.setValue(0);
				switchAllGroups(false);
				defaultGroup.switchOn();
			},
		});

		const seatButton = new Button({
			selectorString: '#text .seat',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				OStarForm.setValue(0);
				planeStar.setVisibility(true);
				pxForm.setValue(1.5);
				pyForm.setValue(1.5);
				pzForm.setValue(-0.5);
				phiForm.setValue(10);
				thetaForm.setValue(30);
				deltaForm.setValue(30);
				pointAForm.setValue(0);
				switchAllGroups(false);
				seatGroup.switchOn();
			},
		});

		const rotateStarButton = new Button({
			selectorString: '#text .rotateStar',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				// planeStar.setVisibility(true);
				pxForm.setValue(1.5);
				pyForm.setValue(1.5);
				pzForm.setValue(-0.5);
				phiForm.setValue(10);
				thetaForm.setValue(30);
				deltaForm.setValue(30);
				pointAForm.setValue(0);
				switchAllGroups(false);
				seatGroup.switchOn();
				OStarForm.setValue(0);
				OStarForm.animateTo(90, {
					onUpdate: () => {
						// planeStar.setVisibility(false);
					},
				});
			},
		});

		const moveAButton = new Button({
			selectorString: '#text .moveA',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
                pointB_.setVisibility(true);
				pxForm.setValue(0.5);
				pyForm.setValue(1);
				pzForm.setValue(-2);
				phiForm.setValue(10);
				thetaForm.setValue(30);
				deltaForm.setValue(30);
				pointAForm.setValue(0);
				pointAForm.animateTo(1, {
					duration: 2000,
					onUpdate: () => {
						// pointAForm.setValue(0.1);
					},
				});
				switchAllGroups(false);
				moveAGroup.switchOn();
			},
		});

		const transversalButton = new Button({
			selectorString: '#text .transversal',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				pointB_.setVisibility(true);
				mainLineProj.setVisibility(true);
				phiForm.animateTo(80);
				thetaForm.animateTo(90);
				deltaForm.animateTo(90);
				pxForm.animateTo(1.5);
				pointAForm.setValue(0.25);
				switchAllGroups(false);
				transversalGroup.switchOn();
			},
		});

		const transversalMoveButton = new Button({
			selectorString: '#text .transversalMove',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				pointB_.setVisibility(true);
				mainLineProj.setVisibility(true);
				phiForm.animateTo(80);
				thetaForm.animateTo(90);
				deltaForm.animateTo(90);
				pxForm.setValue(1.5);
				pointAForm.setValue(0.25);
				switchAllGroups(false);
				transversalGroup.switchOn();
				pxForm.animateTo(4.5, {
					onUpdate: () => {
						pxForm.animateTo(1.5, { duration: 1000 });
					},
					duration: 1000,
				});
			},
		});

		const nonTransversalButton = new Button({
			selectorString: '#text .nontransversal',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				pointB_.setVisibility(false);
				// mainLineProj.setVisibility(false);
				phiForm.animateTo(10);
				thetaForm.animateTo(30);
				deltaForm.animateTo(40);
				pxForm.animateTo(0);
				pyForm.animateTo(1.5);
				pzForm.animateTo(-1.5);
				switchAllGroups(false);
				nonTransversalGroup.switchOn();
			},
		});

		const orthongalButton = new Button({
			selectorString: '#text .orthogonal',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: function () {
				pxForm.animateTo(0);
				switchAllGroups(false);
				orthogonalCase.switchOn(true);
				// phiForm.animateTo(0);
				// thetaForm.animateTo(0);
				phiForm.animateTo(0, {
					duration: 100,
					onUpdate: () => {
						deltaForm.animateTo(0, {
							onUpdate: () => {},
						});
					},
				});
			},
		});

		const groundLine = new Line({
			formName: 'Ground Line',
			label: '$\\mathbf{G}$',
			labelOffset: [0, 0, -0.25],
			labelShift: -1,
			color: blendDecimalColors(groundPlane.color, picturePlane.color),
			// color: "#000",
			length: horizon.length,
			opacity: 0.25,
		});
		groundLine.addParents([pointB, groundPlane, mainLine]).addUpdate(function () {
			const pos = pointB.position
				.clone()
				.add(mainLine.dir.clone().multiplyScalar((1 - pointB.position.x) / mainLine.dir.x));
			groundLine.update(pos, truncateX(mainLine.dir));
		});

		const groundLineElevated = new Line({
			formName: 'Ground Line',
			label: '$\\mathbf{G}$',
			labelOffset: [0, 0, -0.25],
			labelShift: -1,
			color: blendDecimalColors(groundPlane.color, picturePlane.color),
			// color: "#000",
			length: horizon.length,
			opacity: 0.25,
			// visible: false,
		});

		const groundLineForm = new Slider({
			min: 0,
			max: 1,
			step: 0.05,
			value: 0,
			label: 'Elevate Ground Line',
		});

		groundLineElevated.addParents([groundLine, groundLineForm]).addUpdate(function () {
			const vec = center.position.clone().sub(groundLine.position);
			const t = groundLineForm.getValue();
			const pos = groundLine.position.clone().add(vec.multiplyScalar(t));
			const dir = groundLine.dir;
			this.setVisibility(t < 1 && t > 0);
			this.update(pos, dir);
		});

		const groundPlaneGroup = new Group(
			[
				center,
				pointV,
				mainLine,
				pointB,
				orthogonalLine,
				// angleFromOthogonalLine,
				// angleMainLine,
				lineVO,
				lineCO,
				groundPlane,
				groundLine,
				groundLineElevated,
				groundLineForm,
				horizon,
			],
			{
				checked: false,
				formName: 'Ground Plane and Vanishing Line',
			}
		);

		const groundPlaneButton = new Button({
			selectorString: '#text .groundPlane',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: () => {
				pxForm.animateTo(0);
				deltaForm.animateTo(40, {
					onUpdate: () => {
						phiForm.animateTo(10, {
							onUpdate: () => {
								switchAllGroups(false);
								groundPlaneGroup.switchOn(true);
							},
						});
					},
				});
			},
		});

		const groundLineButton = new Button({
			selectorString: '#text .groundLine',
			isFamilyMember: false,
			label: 'Click and see',
			onClick: () => {
				pxForm.animateTo(0);
				switchAllGroups(false);
				deltaForm.animateTo(40);
				groundPlaneGroup.switchOn();
				// groundLineElevated.opacity = 0.5;
				groundLineForm.animateTo(0, {
					duration: 10,
					onUpdate: () => {
						// groundLineElevated.setVisibility(true);
						groundLineForm.animateTo(1, {
							onUpdate: () => {
								// groundLineElevated.setVisibility(false);
								// groundLineElevated.opacity = 0.1;
							},
						});
					},
				});
			},
		});

		const rotateGroup = new Group(
			[
				pointV,
				horizon,
				mainLine,
				groundPlane,
				groundLine,
				center,
				orthogonalLine,
				OHatForm,
				pointOHat,
				lineVOHat,
				lineVO,
				lineCO,
				lineCOHat,
				angleMainLine,
				angleMainLineRotated,
				angleFromOthogonalLine,
				rotateArc,
				rightAngle,
				rightAngleRotated,
			],
			{ formName: 'Rotate Group', checked: false }
		);
		const rotateButton = new Button({
			label: 'Click and see',
			selectorString: '#text .rotate',
			isFamilyMember: false,
			onClick: () => {
				// pxForm.animateTo(0);
				switchAllGroups(false);
				rotateGroup.switchOn();
				phiForm.setValue(10);
				thetaForm.setValue(30);
				deltaForm.setValue(40);
				OHatForm.animateTo(0, {
					duration: 10,
					onUpdate: () => {
						OHatForm.animateTo(90);
					},
				});
			},
		});

		renderAll();

		// ["pscale"].forEach((id) => {
		//     document.getElementById(id).addEventListener("input", () => {
		//         const pscale = +document.getElementById("pscale").value;
		//         document.getElementById("pyramidScale").textContent =
		//             pscale.toFixed(1);
		//     });
		// });

		// const startButton = document.getElementById("startButton");
		// const stopButton = document.getElementById("stopButton");

		// Add event listeners to the buttons
		// startButton.addEventListener("click", this.startAnimation);
		// stopButton.addEventListener("click", this.stopAnimation);
		// Custom animation logic
		// this.app.setUpdateCallback(() => this.update());
	}

	animateSlider() {
		const slider = document.getElementById('pscale');
		let currentValue = parseFloat(slider.value);

		currentValue += this.direction * this.animationSpeed;

		if (currentValue >= slider.max) {
			slider.value = slider.min;
			// currentValue = slider.min;
		} else {
			slider.value = Math.max(slider.min, Math.min(slider.max, currentValue));
		}
		slider.dispatchEvent(new Event('input', { bubbles: true }));
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
			const slider = document.getElementById('pscale');
			slider.value = slider.min + 0.1;
			this.animationId = window.requestAnimationFrame(this.animateSlider);
		}
	}
}
