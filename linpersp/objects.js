import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";

import { Draw } from "./app/Draw.js";

import {
    appendCheckbox,
    colorGen,
    arrayPolymorph,
    vecPolymorph,
    perspectivalProj,
    truncateX,
} from "./utils.js";

const container = document.getElementById("three-container");
const miniMap = document.getElementById("miniMap");
const draw = new Draw(container, miniMap);

export let counter = {
    Line: 0,
    Plane: 0,
    Point: 0,
    LineSegment: 0,
};

export class parentObject {
    constructor(label = "") {
        this.label = label;
        this.children = [];
        this.parents = [];
        this.draw = draw;
        return this;
    }

    addParents(parents, debug = false) {
        // this.parents = this.getTrimmedParents(parents, debug);
        this.parents.push(...parents);
        this.parents.forEach((parent) => {
            parent.addChild(this);
        });
        return this;
    }

    updateFromParents() {
        return true;
    }

    addChild(child) {
        this.setTrimmedDescendants([child]);
    }

    setTrimmedDescendants(children_) {
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
        let result = false;
        obj.children.some((child) => {
            if (child == this) {
                result = true;
                return true;
            }
            if (this.isDescendantOf(child)) {
                result = true;
                return true;
            }
            return false;
        });
        return result;
    }

    updateChildren() {
        this.children.forEach((child) => {
            // console.log(child);
            child.updateFromParents();
            child.updateChildren();
        });
    }

    render(options = {}) {
        const name = this.constructor.name;
        const handler = this.draw.drawFunctions[name];

        this.children.forEach((child) => {
            child.render();
        });
        if (this instanceof geometricObject) this.addForm();
        handler(this, options);
    }
}

export class formObject extends parentObject {
    constructor(innerHTML, formId = "controls") {
        super();
        this.innerHTML = innerHTML;
        this.div = document.createElement("div");
        // document.getElementById(formId).insertAdjacentHTML('beforeend', this.innerHTML);
        this.div.innerHTML = innerHTML;
        document.getElementById(formId).append(this.div);
        this.div.querySelectorAll("input").forEach((input) => {
            input.oninput = () => {
                this.updateChildren();
                this.render();
            };
        });
    }
}

export class geometricObject extends parentObject {
    constructor(
        _position = [0, 0, 0],
        label = "",
        clone = false,
        color = "#aaa",
        options = {}
    ) {
        const { formName = "" } = options;
        super(label, { formName: formName });
        this.THREE = THREE;
        this.formName = formName == "" ? (label == "" ? "" : label) : formName;
        this.position = vecPolymorph(_position);
        this.mesh = null;
        this.cloneMesh = null;
        this.clone = clone;
        this.labelObj = new Label(this.position, label);
        this.visible = true;

        this.updateFromParent = () => {
            return true;
        };
        this.updateFromForm = () => {
            return true;
        };
        counter[this.constructor.name]++;
        this.color = color;
        return this;
    }

    updateMesh(mesh) {
        this.mesh = mesh;
    }

    updateClone(clone) {
        this.cloneMesh = clone;
    }

    updatePosition(_position) {
        const vec = vecPolymorph(_position);
        this.position.set(vec.x, vec.y, vec.z);
        this.labelObj.updatePosition(vecPolymorph(_position));
        // this.updateChildren();
    }

    updateForm(form) {
        this.form = form;
    }

    setVisibility(visible) {
        this.visible = visible;
        this.labelObj.visible = visible;
    }

    setIsClone(bool) {
        this.isClone = bool;
    }

    visibility() {
        if (this.form != null) {
            if (this.mesh != null) {
                this.mesh.visible = this.form.checked;
            }
            if (this.cloneMesh != null) {
                this.cloneMesh.visible = this.form.checked;
            }
        }
    }

    addForm() {
        if (this.form == null && this.formName != "") {
            const form = appendCheckbox("#controls", {
                label: this.formName,
                checked: this.visible,
                onChange: (checked) => {
                    this.visible = checked;
                    this.render();
                },
            });
            this.updateForm(form);
        } else {
            this.visibility();
        }
    }
}

export class Point extends geometricObject {
    constructor(options = {}) {
        const {
            position = [0, 0, 0],
            formName = "",
            label = "",
            parent = null,
            clone = false,
            color = colorGen(counter.Point),
        } = options;
        super(position, label, clone, color, { formName: formName });
        this.perspectivalProj = this.perspectivalProj.bind(this);
    }

    perspectivalProj(label = "") {
        const A_ = new Point({
            label: label,
            clone: true,
            parent: this,
            color: this.color,
            position: perspectivalProj(this.position),
        });

        A_.addParents([this]).updateFromParents = () => {
            A_.updatePosition(perspectivalProj(this.position));
        };
        return A_;
    }
}

export class LineSegment extends geometricObject {
    constructor(options = {}) {
        const {
            start = [0, 0, 0],
            end = [0, 0, 1],
            formName = "",
            label = "",
            clone = false,
            color = colorGen(counter.Line + counter.LineSegment),
            thickness = 0.025,
            fade = false
        } = options;
        super(start, label, clone, color, { formName: formName });
        this.thickness = thickness;
        this.fade = fade;
        this.updateEndPoints(start, end);
        this.perspectivalProj = this.perspectivalProj.bind(this);
        if (start instanceof Point && end instanceof Point) {
            this.addParents([start, end]);
            this.updateFromParents = () => {
                this.updateEndPoints(start, end);
            };
        }
    }

    updateEndPoints(_start, _end) {
        this.start = vecPolymorph(_start);
        this.end = vecPolymorph(_end);
        this.mid = this.start.clone().add(this.end).multiplyScalar(0.5);
        this.position = this.mid;
        this.dir = this.end.clone().sub(this.start);
        this.length = this.dir.length();
        // this.updateChildren();
    }

    getMidpoint() {
        return this.mid;
    }

    perspectivalProj = (label = "") => {
        const line_ = new LineSegment({
            start: this.start.clone().multiplyScalar(1 / this.start.x),
            end: this.end.clone().multiplyScalar(1 / this.end.x),
            label: label,
            clone: true,
            color: this.color,
            thickness: this.thickness,
        });

        line_.addParents([this]).updateFromParents = () => {
            const start = perspectivalProj(this.start);
            const end = perspectivalProj(this.end);
            line_.updateEndPoints(start, end);
        };
        return line_;
    };
}

export class Line extends LineSegment {
    constructor(options = {}) {
        const {
            position = [0, 0, 0],
            dir = [0, 0, 1],
            length = 20,
            formName = "",
            label = "",
            clone = false,
            color = colorGen(counter.Line + counter.LineSegment),
            labelOffset = [0, 0.25, -0.25],
            thickness = 0.025,
            fade = true
        } = options;
        super({ color: color, clone: clone, label: label, formName: formName });
        this.thickness = thickness;
        this.fade = fade;
        this.position = vecPolymorph(position);
        this.dir = vecPolymorph(dir).clone().normalize();
        this.labelOffset = vecPolymorph(labelOffset);
        this.length = length;
        this.update(this.position, this.dir, this.length);
        this.labelObj = new Label(this.position, label);
        this.formName =
            formName == ""
                ? label == ""
                    ? "Untitled Plane"
                    : label
                : formName;
        this.perspectivalProj = this.perspectivalProj.bind(this);
    }

    updateLabel(labelObj) {
        this.labelObj = labelObj;
    }

    updatePosition(pos) {
        this.position = vecPolymorph(pos);
        this.updateRemainingParams();
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
        this.mid = this.start.clone().add(this.end).multiplyScalar(0.5);
        this.labelObj.updatePosition(this.mid);
    }

    update(pos, dir, length = this.length) {
        this.updatePosition(pos);
        this.updateDir(dir);
        this.updateRemainingParams(length);
    }

    point(t) {
        return this.position.clone().add(this.dir.clone().multiplyScalar(t));
    }

    perspectivalProj = (label = "") => {
        const line_ = new Line({
            start: perspectivalProj(this.position),
            end: truncateX(this.dir),
            label: label,
            clone: true,
            parent: this,
            color: this.color,
            length: this.length,
        });

        line_.addParents([this]).updateFromParents = () => {
            const dir = perspectivalProj(this.end)
                .clone()
                .sub(perspectivalProj(this.start));
            line_.update(perspectivalProj(this.position), dir);
        };
        return line_;
    };
}

export class Plane extends geometricObject {
    constructor(options = {}) {
        const {
            position = [0, 0, 0],
            normal = [0, 0, 1],
            formName = "",
            label = "",
            clone = false,
            parent = null,
            color = colorGen(counter.Plane),
            parallel = [1, 0, 0],
            size = 5,
            visible = true,
        } = options;
        super(position, label, clone, color, { formName: formName });
        this.THREE = THREE;
        this.normal = vecPolymorph(normal);
        this.parallel = vecPolymorph(parallel);
        this.size = size;
        this.visible = visible;
        this.mesh = null;
        this.form = null;
    }

    updateNormal(_normal) {
        const vec = vecPolymorph(_normal);
        this.normal.set(vec.x, vec.y, vec.z);
    }

    updateParallel(_parallel) {
        const vec = vecPolymorph(_parallel);
        this.parallel.set(vec.x, vec.y, vec.z);
    }

    update(_pos, _normal) {
        this.updatePosition(vecPolymorph(_pos));
        this.updateNormal(vecPolymorph(_normal));
        // this.updateChildren();
    }
}

export class Pyramid extends geometricObject {
    constructor(options) {
        const {
            scale = 1,
            parent = null,
            label = "",
            color = colorGen(counter.Plane),
        } = options;
        super(parent != null ? parent.position : [0, 0, 0], label);

        this.line = parent;
        this.scale = scale;
        this.paramFunc = (u, v, target) => {
            // v ∈ [0,1]: parameter along the line segment A → B
            // u ∈ [0,1]: parameter from origin (0,0,0) to the line
            const pointOnLine = vecPolymorph(this.line.point(this.scale * v));
            const x = u * pointOnLine.x;
            const y = u * pointOnLine.y;
            const z = u * pointOnLine.z;

            target.set(x, y, z);
        };
    }

    updateLine(line) {
        this.line = line;
        // this.updateChildren();
    }

    updateScale(scale) {
        this.scale = scale;
        // this.updateChildren();
    }
}

export class Label {
    constructor(_position = [0, 0, 0], text = "", color = "#000") {
        this.position = vecPolymorph(_position);
        this.text = text;
        this.color = color;
        this.CSS2DObj = null;
        this.cloneMesh = null;
    }

    updateClone(clone) {
        this.cloneMesh = clone;
    }

    updateCSS2DObj(obj) {
        this.CSS2DObj = obj;
    }

    updatePosition(_position) {
        this.position = vecPolymorph(_position);
    }
}
