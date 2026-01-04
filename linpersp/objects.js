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

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";

import { Draw } from "./app/Draw.js";

import {
    animateSlider,
    createButton,
    createCheckbox,
    createSlider,
    colorGen,
    vecPolymorph,
    perspectivalProj,
    truncateX,
} from "./utils.js";

const container = document.getElementById("three-container");
const miniMap = document.getElementById("miniMap");
const draw = new Draw(container, miniMap);

const counter = {
    Line: 0,
    Plane: 0,
    Point: 0,
    LineSegment: 0,
    Pyramid: 0,
    Arc: 0,
};

const geometricMembers = [];
// const familyMembers = [];
const groups = [];
const labelGroups = [];

export const quaternion = new THREE.Quaternion();

class familyObject {
    constructor(label = "") {
        this.label = label;
        this.children = [];
        this.parents = [];
        this.groups = [];
        this.draw = draw;
        this.form = null;
        this.labelObj = null;
        this.updates = [];
        return this;
    }

    addGroup(group) {
        this.groups.push(group);
    }

    addParents(parents, debug = false) {
        this.parents.push(...parents);
        this.parents.forEach((parent) => {
            parent.addChild(this);
        });
        return this;
    }

    addChild(child) {
        this.addChildren([child]);
    }

    addChildren(children_) {
        const children = this.children.slice();
        children.push(...children_.slice());
        const trimmed = [];

        for (const child of children) {
            let isRedundant = false;
            for (const child1 of children) {
                isRedundant = child.isDescendantOf(child1);
                if (isRedundant) {
                    break;
                }
            }
            if (!isRedundant) {
                trimmed.push(child);
            }
        }

        this.children = trimmed;
    }

    isDescendantOf(obj) {
        // let result = false;
        return obj.children.some((child) => {
            if (child == this) {
                // result = true;
                return true;
            }
            return this.isDescendantOf(child);
            // if (this.isDescendantOf(child)) {
            //     // result = true;
            //     return true;
            // }
            // return false;
        });
        // return result;
    }

    isAncestorOf(obj) {
        let result = false;
        obj.parents.some((parent) => {
            if (parent == this) {
                result = true;
                return true;
            }
            if (this.isAncestorOf(parent)) {
                result = true;
                return true;
            }
            return false;
        });
        return result;
    }

    addUpdate(callback) {
        this.updates.push(callback.bind(this));
        return this;
    }

    updateFromParents() {
        // return true;
        this.updates.forEach((update) => {
            update();
        });
    }

    updateForm(form, options = {}) {
        this.form = new formObject(form, options);
        this.form.addParents([this]);
    }
}

export class Group extends familyObject {
    constructor(members, options = {}) {
        const opts = {
            formName: "Untitled Group",
            formId: null,
            checked: true,
            hidden: false,
            ...options,
        };
        super(opts.formName);
        // this.members = [];
        this.formName = opts.formName;
        this.formId = opts.formId;
        this.checked = opts.checked;
        this.hidden = opts.hidden;
        this.addForm();
        this.addMembers(members);
        groups.push(this);
    }

    addMembers(members) {
        members.forEach((member) => {
            // console.log(member);
            this.addMember(member);
        });
    }

    addMember(member) {
        this.addChild(member);
        member.addGroup(this);
        if (member.labelObj != null) {
            this.addMember(member.labelObj);
        }
        if (member.form != null) {
            this.addMember(member.form);
        }
    }

    add(input) {
        if (input instanceof familyObject) {
            return this.addMember(input);
        } else {
            return this.addMembers(input);
        }
    }

    addForm() {
        if (this.form == null && this.formName.trim() != "") {
            const form = createCheckbox({
                label: this.formName,
                checked: this.checked,
                onChange: (checked) => {
                    this.checked = checked;
                    renderAll();
                    // this.render();
                },
            });
            this.updateForm(form, {
                selectorString: "#groups",
                isFamilyMember: false,
                hidden: this.hidden,
            });
        }
    }

    appendSwitch(selectorString) {
        const self = this;
        const formDiv = createButton({
            label: "Click and See",
            id: this.formId,
            onClick: (target) => {
                // console.log(self.form.div);
                switchAllGroups(false);
                this.switchOn();
            },
        });
        formDiv.hidden = this.hidden;
        const groupSwitch = new formObject(formDiv, {
            selectorString: selectorString,
            isFamilyMember: false,
        });
        return groupSwitch;
    }

    switchOn(checked = true) {
        this.form.div.querySelector('input[type="checkbox"]').checked = checked;
        this.form.dispatch();
    }

    render() {
        this.children.forEach((member) => {
            member.render();
        });

        return true;
    }
}

export class labelGroup extends familyObject {
    constructor(members, options = {}) {
        const opts = {
            formName: "Untitled Group",
            formId: null,
            checked: false,
            visible: true,
            container: "#groups",
            ...options,
        };
        super(opts.formName);
        // this.members = [];
        this.formName = opts.formName;
        this.formId = opts.formId;
        this.checked = opts.checked;
        this.visible = opts.visible;
        this.container = opts.container;
        this.addForm();
        this.addMembers(members);
        labelGroups.push(this);
    }

    addMembers(members) {
        members.forEach((member) => {
            // console.log(member);
            this.addMember(member);
        });
    }

    addMember(member) {
        // this.addChild(member);
        if (member.labelObj != null) {
            this.children.push(member.labelObj);
            member.labelObj.labelGroups.push(this);
        }
    }

    addForm() {
        if (this.form == null && this.formName.trim() != "") {
            const formDiv = createButton({
                label: this.formName,
                id: this.formId,
                onClick: (target) => {
                    this.render();
                },
            });
            formDiv.hidden = !this.visible;
            this.updateForm(formDiv, {
                selectorString: this.container,
                isFamilyMember: false,
            });
        }
    }

    render() {
        const visible = true;

        ancestor.forEach((member) => {
            fadeOutLabel(member);
            // if (member.labelObj != null) {
            //     if (!this.children.includes(member.labelObj)) {
            //         if (member.labelObj.CSS2DObj != null) {
            //             runFadeSequence(member.labelObj.CSS2DObj);
            //         }
            //         if (member.labelObj.cloneMesh != null) {
            //             runFadeSequence(member.labelObj.cloneMesh);
            //         }
            //     }
            // }
        });

        return true;
    }
}

export class formObject extends familyObject {
    constructor(content = null, options = {}) {
        const {
            selectorString = "#forms",
            hidden = false,
            isFamilyMember = true,
            formName = "",
        } = options;
        super();
        this.formName = formName;
        this.hidden = hidden;
        if (typeof content === "string") {
            this.div = document.createElement("div");
            this.div.innerHTML = content;
        } else {
            this.div = content;
        }
        const el = document.querySelector(selectorString);
        const container = el == null ? document.querySelector("#forms") : el;
        if (this.div != null) {
            container.append(this.div);
        }
        if (this.div != null) {
            this.updateListener();
        }

        if (isFamilyMember) {
            ancestor.addChild(this);
        }
    }

    updateListener() {
        this.div.querySelectorAll("input").forEach((input) => {
            input.addEventListener("input", (event) => {
                this.render();
            });
        });
    }

    addClickListener(callback) {
        this.div
            .querySelector('input[type="button"]')
            .addEventListener("click", callback);
    }

    dispatch() {
        this.div.querySelectorAll("input").forEach((input) => {
            // console.log(input);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    clear() {
        if (this.div != null) {
            this.div.hidden = true;
        }
    }

    render(options = {}) {
        const { shallow = false } = options;
        this.updateFromParents();
        this.clear();
        if (this.div != null) {
            if (this.groups.length > 0) {
                for (let group of this.groups) {
                    if (group.checked) {
                        this.draw.add(this);
                        break;
                    }
                }
            } else {
                this.draw.add(this);
            }
        }
        if (!shallow) {
            this.children.forEach((child) => {
                child.render();
            });
        }

        return true;
    }
}

export class Button extends formObject {
    constructor(options = {}) {
        const {
            label = "",
            onClick = null,
            id = "",
        } = options;
        super(
            createButton({
                label:label,
                onClick: onClick,
                id: id
            }),
            options
        );
        this.button = this.div.querySelector('input[type="button"]');
    }
    
}

export class Slider extends formObject {
    constructor(options = {}) {
        const {
            min = 0,
            max = 1,
            step = 0.1,
            value = 0,
            label = "",
            id = "",
        } = options;
        super(
            createSlider({
                min: min,
                max: max,
                step: step,
                value: value,
                label: label,
                id: id,
            }),
            options
        );
        this.slider = this.div.querySelector('input[type="range"]');
    }

    setValue(val) {
        this.slider.value = val;
        this.dispatch();
    }

    getValue() {
        return this.slider.value;
    }

    animateTo(value, options = {}) {
        const { onUpdate = null, duration = 500 } = options;
        animateSlider(this.div.querySelector('input[type="range"]'), value, {
            duration: duration,
            onUpdate: onUpdate,
        });
    }
}

class sceneObject extends familyObject {
    constructor(options = {}) {
        const opts = {
            position: [0, 0, 0],
            clone: false,
            color: "#aaa",
            opacity: 0.75,
            visible: true,
            ...options,
        };
        super(opts);
        this.position = vecPolymorph(opts.position);
        this.mesh = null;
        this.cloneMesh = null;
        this.clone = opts.clone;
        this.label = opts.label;

        this.visible = opts.visible;
        this.color = opts.color;
        this.opacity = opts.opacity;
        this.degenerate = false;
        if (opts.position instanceof Point) {
            this.addParents([opts.position]).addUpdate(function () {
                this.updatePosition(opts.position);
            });
        }

        return this;
    }

    updateFromForm() {
        return true;
    }

    updateMesh(mesh) {
        this.mesh = mesh;
    }

    updateClone(clone) {
        this.cloneMesh = clone;
    }

    updatePosition(_position) {
        if (nondegenerate([_position])) {
            this.visibility();
            this.degenerate = false;
            this.position = vecPolymorph(_position);
        } else {
            this.degenerate = true;
            this.visible = false;
        }
    }

    setVisibility(visible) {
        this.visible = visible;
        this.labelObj.visible = visible;
        if (this.form != null) {
            this.form.div.querySelector('input[type="checkbox"]').checked =
                visible;
        }
    }

    setIsClone(bool) {
        this.isClone = bool;
    }

    visibility() {
        let visible = true;

        if (this.form != null) {
            const checkbox = this.form.div.querySelector(
                'input[type="checkbox"]'
            );
            visible = checkbox.checked;
        }
        if (visible && this instanceof Label) {
            if (this.parent != null) {
                visible = this.parent.visibility();
            }
        }
        if (visible && this.groups.length > 0) {
            visible = false;
            for (let group of this.groups) {
                if (group.checked) {
                    visible = true;
                    break;
                }
            }
        }

        if (this.mesh != null) {
            this.mesh.visible = visible;
        }
        if (this.cloneMesh != null) {
            this.cloneMesh.visible = visible;
        }

        this.visible = visible;
        return visible;
    }

    render() {
        return true;
    }

    clear() {
        if (this.form != null) {
            this.form.div.hidden = true;
        }
        // this.draw.taaRenderPass.accumulate = false;
        // setTimeout(() => {
        //     this.draw.taaRenderPass.accumulate = true;
        // }, 60);
        // this.draw.clearMesh(this);
        if (this.mesh != null) {
            this.mesh.visible = false;
        }
        if (this.CSS2DObj != null) {
            this.CSS2DObj.visible = false;
        }
        if (this.cloneMesh != null) {
            this.cloneMesh.visible = false;
        }
        this.children.forEach((child) => child.clear());
    }
}

export class Empty extends familyObject {
    constructor() {
        super();
        ancestor.addChild(this);
    }

    clear() {
        return true;
    }

    render() {
        this.updateFromParents();
        return true;
    }
}

export class Label extends sceneObject {
    constructor(parent = null, options = {}) {
        const opts = {
            position: [0, 0, 0],
            text: "",
            clone: false,
            visible: true,
            color: "#000",
            offset: [0, 0.1, 0.1],
            ...options,
        };
        super(text);
        this.draw = draw;
        this.parent = parent;
        this.labelGroups = [];
        this.clone = opts.clone;
        this.position = vecPolymorph(opts.position);
        this.offset = vecPolymorph(opts.offset);
        this.text = opts.text;
        this.visible = opts.visible;
        this.color = opts.color;
        this.CSS2DObj = null;
        if (this.parent != null) {
            this.addParents([parent]);
        }
        // this.cloneMesh = null;
    }

    updateClone(clone) {
        this.cloneMesh = clone;
    }

    updateCSS2DObj(obj) {
        this.CSS2DObj = obj;
    }

    updateFromParents() {
        if (this.parent instanceof geometricObject) {
            if (!(this.parent instanceof Line)) {
                this.updatePosition(this.parent.position);
            } else {
                this.updatePosition(
                    this.parent.mid
                        .clone()
                        .add(
                            this.parent.dir
                                .clone()
                                .normalize()
                                .multiplyScalar(this.parent.labelShift)
                        )
                );
            }
        }
        this.offset = this.parent.labelOffset;
        this.clone = this.parent.clone;
        this.visible = this.parent.visible;
    }

    render(options = {}) {
        this.updateFromParents();
        this.visibility();
        this.draw.addLabel(this, {
            clone: this.clone,
            visible: this.visible,
            offset: this.offset,
        });
    }
}

export class geometricObject extends sceneObject {
    constructor(options = {}) {
        const opts = {
            formName: "",
            label: "",
            labelOffset: [0, 0.1, 0.1],
            clone: false,
            hideForm: false,
            ...options,
        };
        super(opts);
        this.degenerate = false;
        this.labelOffset = vecPolymorph(opts.labelOffset);
        this.labelObj = new Label(this, {
            position: this.position,
            text: this.label,
            offset: this.labelOffset,
            clone: this.clone,
        });

        this.hideForm = opts.hideForm;
        this.formName = `${opts.formName} ${opts.label}`;
        this.form = null;

        ancestor.addChild(this);
        geometricMembers.push(this);
        this.addForm();
    }

    addForm() {
        // if (this.form == null && this.formName.trim() != "") {
        if (this.form == null) {
            const formDiv = createCheckbox({
                label: this.formName,
                checked: this.visible,
                onChange: (checked) => {
                    this.visible = checked;
                    this.render({ shallow: true });
                    if (this.labelObj != null) {
                        this.labelObj.visible = checked;
                        this.labelObj.render();
                    }

                    // this.render();
                },
            });
            formDiv.hidden = true;
            this.updateForm(formDiv, {
                hidden: this.formName.trim() == "" || this.hideForm,
                selectorString: `#visibility .${this.constructor.name}`,
                formName: this.formName,
            });
        } else {
            this.visibility();
        }
    }

    render(options = {}) {
        const { shallow = false } = options;
        const degenerate = this.parents.some((parent) => {
            return parent.degenerate;
        });

        if (!degenerate) {
            this.degenerate = false;
            this.updateFromParents();
        }
        if (degenerate || this.degenerate) {
            // console.log("degenerate");
            // this.children.forEach((child) => child.clear());
            this.clear();
            return false;
        }

        this.visibility();

        this.draw.taaRenderPass.accumulate = false;
        setTimeout(() => {
            this.draw.taaRenderPass.accumulate = true;
        }, 60);
        if (this.visible) {
            this.draw.add(this, options);
            if (shallow) {
                this.labelObj.render();
                this.draw.add(this.form);
            }
        }

        if (!shallow && !degenerate && !this.degenerate) {
            this.children.forEach((child) => {
                child.render();
            });
        }
    }
}

export class Point extends geometricObject {
    constructor(options = {}) {
        const opts = {
            color: colorGen(counter.Point++),
            ...options,
        };
        super(opts);
        this.colorClass = "Point";
        this.perspectivalProj = this.perspectivalProj.bind(this);
    }

    seat(options = {}) {
        const opts = {
            label: this.label,
            clone: true,
            color: this.color,
            ...options,
        };

        const parent = this;
        return new Point(opts).addParents([parent]).addUpdate(function() {
            const pos = parent.position;
            this.updatePosition([1, pos.y, pos.z]);
        })
    }

    perspectivalProj(options = {}) {
        const opts = {
            label: this.label,
            clone: true,
            color: this.color,
            ...options,
        };

        const A_ = new Point(opts);

        const parent = this;
        A_.addParents([parent]).addUpdate(function () {
            const pos = perspectivalProj(parent.position);
            this.updatePosition(perspectivalProj(parent.position));
        });
        return A_;
    }

    rotate(basePoint, axis, offset, angle) {
        this.updatePosition(rotatePoint(basePoint, axis, offset, angle));
    }

    replicate(options = {}) {
        const opts = {
            label: "",
            formName: "",
            position: [this.position.x, this.position.y, this.position.z],
            clone: this.clone,
            color: this.color,
            ...options,
        };
        const point = new Point(opts);
        point.updates = this.updates.map((fn) => fn.bind(point));
        return point;
    }
}

class curveObject extends geometricObject {
    constructor(options = {}) {
        const opts = {
            res: 100,
            clone: false,
            color: colorGen(counter.Line++),
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            ...options,
        };
        super(opts);
        this.rotateX = THREE.MathUtils.degToRad(opts.rotateX);
        this.rotateY = THREE.MathUtils.degToRad(opts.rotateY);
        this.rotateZ = THREE.MathUtils.degToRad(opts.rotateZ);
        this.points = [];
        this.colorClass = "Line";
        this.res = opts.res;
        this.clone = opts.clone;
    }
    point(t) {
        // 0 <= t <= 1
        return this.points.length > 0
            ? this.points[Math.floor(t * (this.points.length - 1))]
            : true;
    }

    getStart() {
        const start = new Point({ position: this.point(0) });
        start.addParents([this]).addUpdate(() => {
            start.updatePosition(this.point(0));
        });
        return start;
    }

    getEnd() {
        const end = new Point({ position: this.point(1) });
        end.addParents([this]).addUpdate(() => {
            end.updatePosition(this.point(1));
        });
        return end;
    }

    perspectivalProj(options) {
        const opts = {
            clone: true,
            ...options,
        };
        const curve = new curveObject(opts);
        curve.points = this.points.map((point) => {
            return perspectivalProj(point, { onlyInFront: true });
        });
        curve.addParents([this]).addUpdate(() => {
            curve.points = this.points.map((point) => {
                return perspectivalProj(point, { onlyInFront: true });
            });
        });
        // console.log(curve.points);
        return curve;
    }

    pyramid(opts) {
        const pyramid = new Pyramid({
            curve: this,
            res: this.res,
            ...opts,
            color: this.color,
        });
        pyramid.addParents([this]).addUpdate(() => {
            pyramid.updateCurve(this);
            pyramid.updatePoints();
        });
        return pyramid;
    }

    getPoint(index, options = {}) {
        const opts = {
            visible: false,
            ...options,
        };
        const parent = this;
        const point = new Point(opts)
            .addParents([parent])
            .addUpdate(function () {
                this.updatePosition(parent.point(index));
            });
        return point;
    }
}

export class parametricCurve extends curveObject {
    constructor(options = {}) {
        const opts = {
            vectorFunction: { x: 0, y: 0, z: 0 },
            domain: [-5, 5],
            res: 300,
            // color: colorGen(counter.Line++),
            ...options,
        };
        super(opts);
        this.domain = opts.domain;
        this.vectorFunction = opts.vectorFunction;
        this.points = [];
        this.updatePoints();
    }

    generatePoints() {
        const points = [];
        const domainLength = this.domain[1] - this.domain[0];

        // const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(
            new THREE.Euler(this.rotateX, -this.rotateY, -this.rotateZ, "XYZ")
        );

        for (
            let t = this.domain[0];
            t < this.domain[1];
            t += domainLength / this.res
        ) {
            points.push(
                new THREE.Vector3(
                    this.vectorFunction.x(t),
                    this.vectorFunction.y(t),
                    this.vectorFunction.z(t)
                )
                    .applyQuaternion(quaternion)
                    .add(this.position)
            );
        }
        return points;
    }

    updatePoints(
        position = this.position,
        rotateX = 0,
        rotateY = 0,
        rotateZ = 0
    ) {
        this.position = vecPolymorph(position);
        this.rotateX = THREE.MathUtils.degToRad(rotateX);
        this.rotateY = THREE.MathUtils.degToRad(rotateY);
        this.rotateZ = THREE.MathUtils.degToRad(rotateZ);
        this.points = this.generatePoints();
    }
}

export class LineSegment extends curveObject {
    constructor(options = {}) {
        const opts = {
            start: [0, 0, 0],
            end: [0, 0, 1],
            label: "",
            clone: false,
            thickness: 0.025,
            fade: false,
            ...options,
        };
        super(opts);
        this.colorClass = "Line";
        this.thickness = opts.thickness;
        this.fade = opts.fade;
        this.updateEndPoints(opts.start, opts.end);
        this.perspectivalProj = this.perspectivalProj.bind(this);

        if (opts.start instanceof Point && opts.end instanceof Point) {
            this.addParents([opts.start, opts.end]);
            this.addUpdate(() => {
                this.updateEndPoints(opts.start, opts.end);
            });
        }
    }

    updateEndPoints(_start, _end) {
        if (nondegenerate([_start, _end])) {
            this.degenerate = false;
            this.start = vecPolymorph(_start);
            this.end = vecPolymorph(_end);
            this.mid = this.start.clone().add(this.end).multiplyScalar(0.5);
            this.position = this.mid;
            this.dir = this.end.clone().sub(this.start).normalize();
            this.length = this.end.clone().sub(this.start).length();
            this.displacement = this.end.clone().sub(this.start);
            this.updatePoints();
        } else {
            console.log("degenerate");
            this.degenerate = true;
            this.visible = false;
        }
    }

    getMidpoint() {
        return this.mid;
    }

    updatePoints() {
        this.points = [];
        const bound = Math.floor(this.res / 2);
        for (let i = -1 * bound; i < bound; i++) {
            this.points.push(
                this.position
                    .clone()
                    .add(
                        this.dir
                            .clone()
                            .multiplyScalar((i * 0.5 * this.length) / bound)
                    )
            );
            // this.point(i * 0.5 * (this.length / 100)));
        }
    }

    perspectivalProj = (options = {}) => {
        const line_ = new LineSegment({
            // start: this.start.clone().multiplyScalar(1 / this.start.x),
            // end: this.end.clone().multiplyScalar(1 / this.end.x),
            label: "",
            clone: true,
            color: this.color,
            opacity: this.opacity,
            thickness: this.thickness,
            ...options,
        });

        const parent = this;
        line_.addParents([parent]).addUpdate(() => {
            const start = perspectivalProj(parent.start);
            const end = perspectivalProj(parent.end);
            line_.updateEndPoints(start, end);
        });
        return line_;
    };

    rotate(baseStart, baseEnd, offset, angle) {
        this.updateEndPoints(
            rotatePoint(baseStart, axis, offset, angle),
            rotatePoint(baseEnd, axis, offset, angle)
        );
    }

    replicate(options = {}) {
        const opts = {
            label: "",
            formName: "",
            position: this.position,
            start: this.start,
            end: this.end,
            clone: this.clone,
            color: this.color,
            ...options,
        };
        const line = new LineSegment(opts);
        line.updates = this.updates.map((fn) => fn.bind(line));
        return line;
    }
}

export class Line extends LineSegment {
    constructor(options = {}) {
        const opts = {
            position: [0, 0, 0],
            dir: [0, 0, 1],
            length: 20,
            // formName = "",
            // label = "",
            clone: false,
            formName: "",
            label: "",
            // color: colorGen(counter.Line++),
            labelOffset: [0, 0.15, -0.15],
            labelShift: 0,
            thickness: 0.025,
            fade: true,
            // visible = true,
            ...options,
        };

        super(opts);
        this.colorClass = "Line";
        this.thickness = opts.thickness;
        this.fade = opts.fade;
        this.dir = vecPolymorph(opts.dir).clone().normalize();
        this.labelShift = opts.labelShift;
        this.length = opts.length;
        this.update(this.position, this.dir, this.length);
        this.perspectivalProj = this.perspectivalProj.bind(this);
        // if (opts.position instanceof Point) {
        //     this.addParents([opts.position]).addUpdate(() => {
        //         this.updatePosition(opts.position);
        //     });
        // }
    }

    updateLabel(labelObj) {
        this.labelObj = labelObj;
    }

    updatePosition(pos_) {
        if (pos_) {
            this.degenerate = false;
            this.position = vecPolymorph(pos_);
            this.updateRemainingParams();
        } else {
            // this.visible = false;
            // this.labelObj.visible = false;
            this.degenerate = true;
        }
    }

    updateDir(dir) {
        const vec = vecPolymorph(dir).clone().normalize();
        this.dir.set(vec.x, vec.y, vec.z);
        this.updateRemainingParams();
    }

    updateRemainingParams(length = this.length) {
        this.length = length;
        this.start = this.position
            .clone()
            .add(this.dir.clone().multiplyScalar(-0.5 * this.length));
        this.end = this.position
            .clone()
            .add(this.dir.clone().multiplyScalar(0.5 * this.length));
        this.mid = this.start.clone().add(this.end.clone()).multiplyScalar(0.5);
        this.labelObj.updatePosition(
            this.mid
                .clone()
                .add(this.dir.clone().multiplyScalar(this.labelShift))
        );
        this.updatePoints();
    }

    update(pos, dir, length = this.length) {
        if (nondegenerate([pos, dir])) {
            this.degenerate = false;
            // this.visible = true;
            // this.labelObj.visible = true;
            // this.updatePosition(pos);
            // this.updateDir(dir);
            this.position = vecPolymorph(pos);
            const vec = vecPolymorph(dir).normalize();
            this.dir.set(vec.x, vec.y, vec.z);
            this.updateRemainingParams(length);
        } else {
            // console.log("degenerate");
            this.degenerate = true;
            // this.visible = false;
            // this.labelObj.visible = false;
        }
    }

    perspectivalProj = (options = {}) => {
        const line_ = new Line({
            // start: perspectivalProj(this.position),
            // end: truncateX(this.dir),
            label: this.label,
            clone: true,
            parent: this,
            color: this.color,
            length: this.length,
            ...options,
        });

        const parent = this;
        line_.addParents([this]).addUpdate(() => {
            const pos = perspectivalProj(parent.position);
            if (!pos) {
                line_.degenerate = true;
                return false;
            } else {
                line_.degenerate = false;
            }
            const startProj = perspectivalProj(parent.start);
            const endProj = perspectivalProj(parent.end);
            if (!nondegenerate([startProj, endProj])) {
                line_.degenerate = true;
                return false;
            } else {
                line_.degenerate = false;
            }

            const dir = endProj.clone().sub(startProj.clone());
            line_.update(pos, dir);
        });
        return line_;
    };

    rotate(basePoint, baseDir, axis, offset, angle) {
        this.update(
            rotatePoint(basePoint, axis, offset, angle),
            rotatePoint(baseDir, axis, [0, 0, 0], angle)
        );
    }

    replicate(options = {}) {
        const opts = {
            label: "",
            formName: "",
            position: this.position,
            dir: this.dir,
            clone: this.clone,
            color: this.color,
            ...options,
        };
        const line = new Line(opts);
        line.updates = this.updates.map((fn) => fn.bind(line));
        return line;
    }
}

export class Plane extends geometricObject {
    constructor(options = {}) {
        const opts = {
            position: [0, 0, 0],
            normal: [0, 0, 1],
            color: colorGen(counter["Plane"]++),
            parallel: [1, 0, 0],
            size: 5,
            opacity: 0.55,
            ...options,
        };
        super(opts);
        this.colorClass = "Plane";
        this.normal = vecPolymorph(opts.normal);
        this.parallel = vecPolymorph(opts.parallel);
        this.size = opts.size;
    }

    updateNormal(_normal) {
        const vec = vecPolymorph(_normal);
        this.degenerate = !nondegenerate([vec]) && vec.length() < 10 ** -12;
        if (!this.degenerate) {
            this.normal.set(vec.x, vec.y, vec.z).normalize();
        }
    }

    updateParallel(_parallel) {
        const vec = vecPolymorph(_parallel);
        this.degenerate = !nondegenerate([vec]);
        if (!this.degenerate) {
            this.parallel.set(vec.x, vec.y, vec.z);
        }
    }

    update(_pos, _normal) {
        this.degenerate = !nondegenerate([_pos, _normal]);
        if (!this.degenerate) {
            this.updatePosition(vecPolymorph(_pos));
            this.updateNormal(vecPolymorph(_normal));
        }
    }

    rotate(basePosition, baseNormal, axis, offset, angle) {
        this.update(
            rotatePoint(basePosition, axis, offset, angle),
            rotatePoint(baseNormal, axis, [0, 0, 0], angle)
        );
        this.updateParallel(axis);
    }

    replicate(options = {}) {
        const opts = {
            label: "",
            formName: "",
            position: this.position,
            normal: this.normal,
            clone: this.clone,
            size: this.size,
            parallel: this.parallel,
            ...options,
        };
        const plane = new Plane(opts);
        plane.updates = this.updates.map((fn) => fn.bind(plane));
        return plane;
    }
}

export class Pyramid extends curveObject {
    constructor(options) {
        const opts = {
            scale: 1,
            start: 0,
            curve: null,
            // label = "",
            color: colorGen(counter.Plane++),
            // visible = true,
            opacity: 0.55,
            res: 100,
            ...options,
        };
        // super([0, 0, 0], label, false, color, { visible: visible });
        super(opts);
        this.colorClass = "Plane";
        this.curve = opts.curve;
        this.scale = opts.scale;
        this.start = Math.min(opts.scale, opts.start);
        this.points = [];

        // this.paramFunc = (u, v, target) => {
        //     // v ∈ [0,1]: parameter along the line segment A → B
        //     // u ∈ [0,1]: parameter from origin (0,0,0) to the line
        //     // const pointOnLine = vecPolymorph(this.line.point(this.scale * v));
        //     // const pointOnLine = vecPolymorph(this.line.points[Math.round(this.scale * 99 * v)]);
        //     const pointOnLine = vecPolymorph(this.curve.point(this.scale * v));
        //     const x = u * pointOnLine.x;
        //     const y = u * pointOnLine.y;
        //     const z = u * pointOnLine.z;

        //     target.set(x, y, z);
        // };
        this.updatePoints();
    }

    updateCurve(curve) {
        this.curve = curve;
        // this.updateChildren();
    }

    updatePoints(scale = this.scale, start = 0) {
        this.scale = scale;
        this.start = Math.min(scale, start);
        const origin = new THREE.Vector3(0, 0, 0);
        const length = this.curve.points.length;
        const curvePoints =
            this.scale >= 1
                ? this.curve.points.slice()
                : this.curve.points.slice(
                      Math.floor(this.start * length),
                      Math.floor(this.scale * length)
                  );

        this.points = [origin, ...curvePoints];
    }

    updateScale(scale, start = 0) {
        this.scale = scale;
        this.start = Math.min(scale, start);
        // this.updateChildren();
    }
}

export class Rectangle extends curveObject {
    constructor(options = {}) {
        const opts = {
            width: 1,
            height: 1,
            color: colorGen(counter.LineSegment++),
            ...options,
        };
        super(opts);
        this.quaternion = new THREE.Quaternion();
        this.update(this.position, opts.width, opts.height);

        const rectangle = this;

        this.lines = [];
        // this.vertices = [];
        for (let i = 0; i < 4; i++) {
            // console.log(this.vertices[i]);
            this.lines.push(
                new LineSegment({
                    start: this.points[i],
                    end: this.points[(i + 1) % 4],
                    color: rectangle.color,
                })
                    .addParents([rectangle])
                    .addUpdate(function () {
                        // const start = rectangle.points[i].clone()
                        //     .applyQuaternion(rectangle.quaternion)
                        //     .add(rectangle.position);
                        // const end = rectangle.points[(i + 1) % 4].clone()
                        //     .applyQuaternion(rectangle.quaternion)
                        //     .add(rectangle.position);
                        const start = rectangle.points[i];
                        const end = rectangle.points[(i + 1) % 4];
                        this.updateEndPoints(start, end);
                    })
            );
            // this.vertices.push(
            //     new Point().addParents([rectangle]).addUpdate(function() {
            //         this.updatePosition(rectangle.points[i]);
            //     })
            // )
        }
    }

    perspectivalProj() {
        this.lines.forEach((line) => {
            line.perspectivalProj();
        });
    }

    update(position, width, height, rotateX = 0, rotateY = 0, rotateZ = 0) {
        this.position = vecPolymorph(position);
        this.width = width;
        this.height = height;
        this.rotateX = THREE.MathUtils.degToRad(rotateX);
        this.rotateY = THREE.MathUtils.degToRad(rotateY);
        this.rotateZ = THREE.MathUtils.degToRad(rotateZ);
        this.quaternion.setFromEuler(
            new THREE.Euler(this.rotateX, -this.rotateY, -this.rotateZ, "XYZ")
        );

        this.halfW = width / 2;
        this.halfH = height / 2;

        const points_ = [
            [-this.halfW, -this.halfH, 0],
            [this.halfW, -this.halfH, 0],
            [this.halfW, this.halfH, 0],
            [-this.halfW, this.halfH, 0],
        ];
        this.points = [];
        this.points = points_.map((point) => {
            const vec = vecPolymorph(point);
            return vec.applyQuaternion(this.quaternion).add(this.position);
        });
    }

    setVisibility(visible) {
        this.lines.forEach((line) => {
            line.setVisibility(visible);
        });
    }
}

export class Arc extends geometricObject {
    constructor(options = {}) {
        const opts = {
            position: [0, 0, 0],
            pos1: [1, 0, 0],
            pos2: [0, 1, 0],
            color: colorGen(counter.Line++),
            radius: 1,
            thickness: 1,
            clone: false,
            label: "",
            filled: false,
            hideForm: true,
            ...options,
        };
        super(opts);
        this.colorClass = "Line";
        // this.pos1 = vecPolymorph(opts.pos1);
        // this.pos2 = vecPolymorph(opts.pos2);
        this.updateVertices(opts.pos1, opts.pos2);
        this.radius = opts.radius;
        this.thickness = opts.thickness;
        this.filled = opts.filled;
        this.points = arcBetween(
            this.pos1,
            this.pos2,
            this.radius,
            this.position
        );

        if (
            opts.pos1 instanceof Point &&
            opts.pos2 instanceof Point &&
            opts.position instanceof Point
        ) {
            this.addParents([opts.pos1, opts.pos2]).addUpdate(function () {
                // this.position = vecPolymorph(opts.position);
                this.pos1 = vecPolymorph(opts.pos1);
                this.pos2 = vecPolymorph(opts.pos2);
                this.points = arcBetween(
                    this.pos1,
                    this.pos2,
                    this.radius,
                    this.position
                );
                this.updateVertices(this.pos1, this.pos2);
            });
        }
    }

    updateVertices(pos1, pos2) {
        this.pos1 = vecPolymorph(pos1);
        this.pos2 = vecPolymorph(pos2);
        this.points = arcBetween(
            this.pos1,
            this.pos2,
            this.radius,
            this.position
        );
        this.labelOffset = this.pos1
            .clone()
            .sub(this.position)
            .normalize()
            .add(this.pos2.clone().sub(this.position).normalize())
            .normalize()
            .multiplyScalar(this.radius * 1.5);
        // .multiplyScalar(1);
        //     console.log(this.labelOffset);
        // console.log(this.points);
        // this.labelOffset = this.points[5].clone().sub(this.position);
    }
}

export class SmallRectangle extends geometricObject {
    constructor(options = {}) {
        const opts = {
            position: [0, 0, 0],
            pos1: [1, 0, 0],
            pos2: [0, 1, 0],
            color: colorGen(counter.Line++),
            radius: 0.15,
            thickness: 1,
            clone: false,
            label: "",
            filled: false,
            hideForm: true,
            ...options,
        };
        super(opts);
        this.colorClass = "Line";
        this.pos1 = vecPolymorph(opts.pos1);
        this.pos2 = vecPolymorph(opts.pos2);
        this.radius = opts.radius;
        this.color = opts.color;
        this.thickness = opts.thickness;
        this.filled = opts.filled;
        if (
            opts.pos1 instanceof Point &&
            opts.pos2 instanceof Point &&
            opts.position instanceof Point
        ) {
            this.addParents([opts.pos1, opts.pos2, opts.position]).addUpdate(
                function () {
                    this.position = vecPolymorph(opts.position);
                    this.pos1 = vecPolymorph(opts.pos1);
                    this.pos2 = vecPolymorph(opts.pos2);
                    this.points = arcBetween(
                        this.pos1,
                        this.pos2,
                        this.radius,
                        this.position
                    );
                }
            );
        }
    }

    updateVertices(pos1, pos2) {
        this.pos1 = vecPolymorph(pos1);
        this.pos2 = vecPolymorph(pos2);
    }
}

export class Ellipse extends curveObject {
    constructor(options = {}) {
        const opts = {
            radius1: 1,
            radius2: 1,
            ...options,
        };
        super(opts);
        this.radius1 = opts.radius1;
        this.radius2 = opts.radius2;
        this.points = getEllipsePoints(
            this.position,
            this.radius1,
            this.radius2,
            this.rotateX,
            this.rotateY,
            this.rotateZ
        );
    }

    update(position, radius1, radius2, rotateX = 0, rotateY = 0, rotateZ = 0) {
        this.position = vecPolymorph(position);
        this.radius1 = radius1;
        this.radius2 = radius2;
        this.rotateX = THREE.MathUtils.degToRad(rotateX);
        this.rotateY = THREE.MathUtils.degToRad(rotateY);
        this.rotateZ = THREE.MathUtils.degToRad(rotateZ);
        this.points = getEllipsePoints(
            this.position,
            this.radius1,
            this.radius2,
            this.rotateX,
            this.rotateY,
            this.rotateZ
        );
    }
}

function rotatePoint(point_, axis_, offset_, angle) {
    const point = vecPolymorph(point_);
    const offset = vecPolymorph(offset_);
    const axis = vecPolymorph(axis_).normalize();
    return point
        .clone()
        .sub(offset)
        .applyAxisAngle(
            axis,
            // angle
            THREE.MathUtils.degToRad(angle)
        )
        .add(offset);
}

export function projectPointOntoLine(
    point_,
    lineStart_,
    lineDirection_,
    target = new THREE.Vector3()
) {
    // 1. Create a vector from the line start to the point (vector AP).
    const point = vecPolymorph(point_);
    const lineStart = vecPolymorph(lineStart_);
    const lineDirection = vecPolymorph(lineDirection_).normalize();
    const pointToLineStart = new THREE.Vector3().subVectors(point, lineStart);

    // 2. Calculate the scalar projection of AP onto the line direction V.
    // This is the distance along the line from A to the projected point.
    const scalarProjection = pointToLineStart.dot(lineDirection);

    // 3. The projected point B is A + scalarProjection * V.
    target.copy(lineDirection).multiplyScalar(scalarProjection).add(lineStart);

    return target;
}

function arcBetween(p1, p2, radius = 1, offset = [0, 0, 0]) {
    const center = vecPolymorph(offset).clone();
    const direction1 = new THREE.Vector3().subVectors(
        vecPolymorph(p1).clone(),
        center
    );
    const direction2 = new THREE.Vector3().subVectors(
        vecPolymorph(p2).clone(),
        center
    );
    // const direction1 = v1;
    // const direction2 = v2;

    // Use cross product to find the normal vector of the plane
    const normalVector = new THREE.Vector3()
        .crossVectors(direction1, direction2)
        .normalize();
    const targetAxis = new THREE.Vector3(0, 0, 1);
    // const rotationToTarget = new THREE.Quaternion().setFromUnitVectors(
    //     normalVector,
    //     targetAxis
    // );
    const rotationToTarget = quaternion.setFromUnitVectors(
        normalVector,
        targetAxis
    );
    const v1_2D = direction1.clone().applyQuaternion(rotationToTarget);
    const v2_2D = direction2.clone().applyQuaternion(rotationToTarget);

    // const radius = direction1.length();
    const startAngle = Math.atan2(v1_2D.y, v1_2D.x);
    const endAngle = Math.atan2(v2_2D.y, v2_2D.x);

    const curve = new THREE.ArcCurve(
        0,
        0, // center x, y
        radius, // radius
        startAngle, // start angle in radians
        endAngle, // end angle in radians
        false // clockwise?
    );
    const points2D = curve.getPoints(10);

    // Get the inverse quaternion to reverse the rotation
    const rotationFromTarget = rotationToTarget.clone().invert();

    const finalPoints = points2D.map((p) => {
        // Convert the 2D point back to a 3D vector (Z=0)
        const p3D = new THREE.Vector3(p.x, p.y, 0);

        // Rotate the 3D point back to the original orientation
        p3D.applyQuaternion(rotationFromTarget);

        // Translate the point from the origin back to the arc center
        p3D.add(center);

        return p3D;
    });
    // console.log(finalPoints);
    return finalPoints;
}

function getEllipsePoints(
    position,
    radius1,
    radius2,
    rotateXRad,
    rotateYRad,
    rotateZRad,
    options = {}
) {
    const { res = 100 } = options;
    const curve = new THREE.EllipseCurve(
        0,
        0, // Center X and Y
        radius1,
        radius2, // X Radius, Y Radius
        0,
        2 * Math.PI // Full ellipse
    );

    // 2. Get points from the 2D curve
    const points2D = curve.getPoints(res);

    // 3. Convert 2D points to 3D vectors and apply rotation
    const points3D = [];
    const rotationXAngle = rotateXRad;
    const rotationYAngle = rotateYRad;
    const rotationZAngle = rotateZRad;

    // Create a reusable Quaternion to represent the desired tilt
    // const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(
        new THREE.Euler(rotationXAngle, -rotationYAngle, -rotationZAngle, "XYZ")
    );

    points2D.forEach((point2D) => {
        // Convert the Vector2 (X, Y) into a Vector3 (X, Y, Z=0 initially)
        const point3D = new THREE.Vector3(point2D.x, point2D.y, 0);

        // Apply the pre-calculated quaternion rotation to the 3D point
        point3D.applyQuaternion(quaternion);
        point3D.add(position);

        points3D.push(point3D);
    });
    return points3D;
}

function clearAll() {
    ancestor.children.forEach((member) => {
        member.clear();
    });
}

function nondegenerate(vecs_) {
    if (vecs_.some((vec) => vec == false)) {
        return false;
    }
    const vecs = vecs_.map((vec_) => vecPolymorph(vec_));
    return !vecs.some((el) => {
        return [el.x, el.y, el.z].some((t) => Number.isNaN(t));
    });
}
export function renderAll() {
    // groups.forEach((group) => {
    //     if (group.form.div.querySelector("input").checked) {
    //         group.render();
    //     }
    // });
    // console.log(familyMembers);
    ancestor.children.forEach((member) => {
        member.clear();
        member.render();
        // if (member instanceof sceneObject) {
        //     member.visibility();
        // }
        // if (member.groups.length == 0) {
        //     // member.render({ shallow: true });
        //     member.render();
        //     if (member.labelObj != null) {
        //         member.labelObj.render();
        //     }
        // }
    });
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runFadeSequence(css2dObject) {
    const element = css2dObject.element; // Access the DOM node

    // 1. Fade out over 1 second
    element.classList.add("is-hidden");
    await delay(50);

    // 2. Stay hidden for 1 second
    await delay(1500);

    // 3. Fade back in over 1 second
    element.classList.remove("is-hidden");
}

function fadeOutLabel(member) {
    if (member.labelObj != null) {
        if (!this.children.includes(member.labelObj)) {
            if (member.labelObj.CSS2DObj != null) {
                runFadeSequence(member.labelObj.CSS2DObj);
            }
            if (member.labelObj.cloneMesh != null) {
                runFadeSequence(member.labelObj.cloneMesh);
            }
        }
    }
    member.children.forEach((child) => {
        fadeOutLabel(child);
    });
}

export function switchAllGroups(checked = true) {
    groups.forEach((group) => {
        group.switchOn(false);
    });
}

const ancestor = new familyObject();
