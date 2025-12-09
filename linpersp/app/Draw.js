// import * as THREE from "three"; // Now resolves via importmap
// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";
import * as THREE from "three";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // Cleaner path
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    appendCheckbox,
    createRoundDotTexture,
    arrayPolymorph,
    vecPolymorph,
} from "../utils.js";

export class Draw {
    constructor(container, miniMap) {
        this.container = container;
        this.miniMap = miniMap;

        this.THREE = THREE;

        this.CSS2DObject = CSS2DObject;
        this.ParametricGeometry = ParametricGeometry;
        // this.MathJax = MathJax;
        this.drawFunctions = {
            formObject: this.addForm.bind(this),
            Label: this.addLabel.bind(this),
            Point: this.addPoint.bind(this),
            Line: this.addLine.bind(this),
            LineSegment: this.addLine.bind(this),
            Plane: this.addPlane.bind(this),
            Pyramid: this.addLinePyramid.bind(this),
        };

        this.innerWidth = 640;
        this.innerHeight = 640;
        this.scene = new THREE.Scene();
        this.sceneColor = 0xf9f9f9;
        this.scene.background = new THREE.Color(this.sceneColor);

        // Scene setup

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        // this.renderer = new SVGRenderer();
        this.renderer.setSize(this.innerWidth, this.innerHeight);
        this.renderer.setClearColor(this.sceneColor, 1);
        this.renderer.setPixelRatio(devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        this.renderer.sortObjects = true;

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(this.innerWidth, this.innerHeight);
        this.labelRenderer.domElement.style.position = "absolute";
        this.labelRenderer.domElement.style.top = "0px";
        // Ensure pointer events pass through to the main canvas
        this.labelRenderer.domElement.style.pointerEvents = "none";
        this.container.appendChild(this.labelRenderer.domElement);

        // === Z-UP ROTATION (once at startup) ===
        const toZup = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.scene.applyMatrix4(toZup); // This converts the entire scene to Z-up

        this.camera = new THREE.PerspectiveCamera(
            60,
            this.innerWidth / this.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(-4.64, 2.51, 1.7);

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.target.set(1.64, 0.34, 0.64);
        this.controls.update();

        // Light
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 10, 5);
        this.scene.add(dirLight);

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        // Load FREE HDR environment map (works 100% – from official Three.js)
        const rgbeLoader = new RGBELoader();
        rgbeLoader.setPath(
            "https://threejs.org/examples/textures/equirectangular/"
        );
        const parent = this;
        rgbeLoader.load("venice_sunset_1k.hdr", function (texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            // Set for the whole scene (shiny reflections everywhere!)
            parent.scene.background = null; // Optional: pretty sunset sky
            parent.scene.environment = envMap; // Lights all materials automatically

            // Clean up
            texture.dispose();
            pmremGenerator.dispose();
        });

        // ────────────────────── MINI MAP ──────────────────────
        this.miniRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        this.miniRenderer.setPixelRatio(this.devicePixelRatio);
        this.miniRenderer.setSize(this.innerWidth, this.innerHeight);
        this.miniRenderer.setClearColor(this.sceneColor);

        // This line does the magic:
        this.miniMap.appendChild(this.miniRenderer.domElement);
        // ← exactly the same pattern as main view!

        this.labelRendererMini = new CSS2DRenderer();
        this.labelRendererMini.setSize(this.innerWidth, this.innerHeight);
        this.labelRendererMini.domElement.style.position = "absolute";
        this.labelRendererMini.domElement.style.top = "0px";
        // Ensure pointer events pass through to the main canvas
        this.labelRendererMini.domElement.style.pointerEvents = "none";
        this.miniMap.appendChild(this.labelRendererMini.domElement);

        this.miniScene = new THREE.Scene();
        this.miniScene.applyMatrix4(toZup);

        this.miniCamera = new THREE.PerspectiveCamera(
            90,
            1, // innerWidth / innerHeight,
            0.1,
            100
        );
        this.miniCamera.position.set(-1, 0, 0);
        this.miniCamera.lookAt(1, 0, 0);

        this.miniControls = new OrbitControls(
            this.miniCamera,
            this.miniRenderer.domElement
        );

        this.miniControls.enableRotate = false; // Prevents mouse drag rotation

        this.miniControls.enablePan = true; // Prevents panning (Shift + drag)
        this.miniControls.enableZoom = true;

        this.vertexShader = `
			varying vec3 vPosition;
			void main() {
				vPosition = position;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;

        this.fragmentShader = `
			uniform vec3 color;
            uniform float halfHeight;
            varying vec3 vPosition;

            void main() {
            // Calculate fade factor based on vertical position (y-axis)
            // vPosition.y ranges from -halfHeight to halfHeight
            float fadeStart = halfHeight * 0.85; // Start fading 80% up from center

            // Distance from the vertical ends
            float distFromEnd = max(0.0, abs(vPosition.z - halfHeight) - fadeStart);
            // Normalized fade amount (0 for opaque, 1 for fully transparent)
            float fadeAmount = smoothstep(0.0, halfHeight * 0.15, distFromEnd);
            
            // Apply color and calculated transparency
            gl_FragColor = vec4(color, 0.3 * (1.0 - fadeAmount));
            if (gl_FragColor.a < 0.001) discard;
            }
		`;

        this.planeVertexShader = `
    varying vec3 vPosition;
    void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

        this.planeFragmentShader = `
    uniform vec3 color;
    uniform vec2 planeSize;
    varying vec3 vPosition;

    void main() {
        // Calculate normalized distance from the center (0 to 1 range for half plane)
        // abs(vPosition.x) ranges from 0 to halfWidth
        vec2 distFromCenter = abs(vPosition.xy);
        vec2 halfSize = planeSize / 2.0;

        // Define the fade start zone (e.g., last 20% of the plane width/height)
        vec2 fadeStart = halfSize * 0.975;
        vec2 fadeEnd = halfSize; // Fade finishes at the edge

        // Calculate fade factor for X and Y axes independently
        float fadeX = smoothstep(fadeStart.x, fadeEnd.x, distFromCenter.x);
        float fadeY = smoothstep(fadeStart.y, fadeEnd.y, distFromCenter.y);

        // Combine fades: Use the maximum fade value (if either is fading, the pixel fades)
        float combinedFade = max(fadeX, fadeY);

        // Apply color and the calculated transparency
        gl_FragColor = vec4(color, 0.2*(1.0 - combinedFade));

        // Crucial for blending
        if (gl_FragColor.a < 0.001) discard;
    }
`;

        // Resize handler
        window.addEventListener("resize", () => {
            this.camera.aspect = this.innerWidth / this.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.innerWidth, this.innerHeight);
        });

        // Animation loop

        this.animate();
    }
    animate() {
        this.camera.updateMatrixWorld(); // important!

        const { x, y, z } = this.camera.position;
        const { x: a, y: b, z: c } = this.controls.target;
        const infoCamera = document.getElementById("cameraxyz");
        const infoTarget = document.getElementById("targetxyz");
        infoCamera.value = `(${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)})`;
        infoTarget.value = `(${a.toFixed(2)},${b.toFixed(2)},${c.toFixed(2)})`;

        this.controls.update();
        this.miniControls.update();
        this.renderer.render(this.scene, this.camera);
        this.miniRenderer.render(this.miniScene, this.miniCamera);

        this.labelRenderer.render(this.scene, this.camera);
        this.labelRendererMini.render(this.miniScene, this.miniCamera);
        requestAnimationFrame(() => this.animate());
    }

    visibility(obj) {
        if (obj.form != null) {
            if (obj.mesh != null) {
                obj.mesh.visible = obj.form.checked;
            }
            if (obj.cloneMesh != null) {
                obj.cloneMesh.visible = obj.form.checked;
            }
        }
    }

    clearMesh(obj) {
        if (obj.mesh != null) {
            obj.mesh.geometry.dispose();
            obj.mesh.material.dispose();
            this.scene.remove(obj.mesh);
        }
        if (obj.cloneMesh) {
            obj.cloneMesh.geometry.dispose();
            obj.cloneMesh.material.dispose();
            this.miniScene.remove(obj.cloneMesh);
        }
        if (obj.labelObj != null) {
            this.clearLabel(obj.labelObj);
        }
    }

    clearLabel(label) {
        if (label.CSS2DObj != null) {
            this.scene.remove(label.CSS2DObj);
        }
        if (label.cloneMesh != null) {
            this.miniScene.remove(label.cloneMesh);
        }
    }

    add(obj, options = {}) {
        const name = obj.constructor.name;
        const handler = this.drawFunctions[name];

        obj.children.forEach((child) => {
            this.add(child);
        });

        // if (obj.visible) {
        //     handler(obj, options);
        // } else {
        //     if (obj.mesh != null) {
        //         this.clearMesh(obj);
        //     }
        // }
        handler(obj, options);
    }

    addForm() {
        return true;
    }

    addLabel(obj, options = {}) {
        const {
            clone = false,
            offset = [0, 0.1, 0.1],
            visible = obj.visible,
        } = options;

        if (obj.CSS2DObj != null) {
            this.scene.remove(obj.CSS2DObj);
        }
        if (obj.cloneMesh != null) {
            this.miniScene.remove(obj.cloneMesh);
        }
        const CSS2DObject = this.CSS2DObject;

        const div = document.createElement("div");
        div.className = "math-label";
        div.textContent = obj.text;
        div.style.color = obj.color;
        div.style.background = "rgba(0,0,0,0)";
        const divClone = div.cloneNode(true);
        MathJax.typesetPromise([div]);

        const labelCSS2D = new CSS2DObject(div);
        const posVec = vecPolymorph(obj.position);
        const offsetVec = vecPolymorph(offset);
        const labelVec = posVec.clone().add(offsetVec);
        labelCSS2D.position.set(labelVec.x, labelVec.y, labelVec.z);

        labelCSS2D.visible = visible;
        this.scene.add(labelCSS2D);
        obj.updateCSS2DObj(labelCSS2D);

        if (clone) {
            MathJax.typesetPromise([divClone]);
            const labelClone = new CSS2DObject(divClone);
            labelClone.position.set(labelVec.x, labelVec.y, labelVec.z);
            labelClone.visible = visible;
            this.miniScene.add(labelClone);
            obj.updateClone(labelClone);
            return labelClone;
        } else {
            return obj;
        }
    }

    addPoint(obj, options = {}) {
        let {
            color = obj.color,
            radius = 0.06,
            clone = obj.clone,
            visible = obj.visible,
        } = options;
        const THREE = this.THREE;
        const scene = !clone ? this.scene : this.miniScene;

        if (obj.mesh != null) {
            // color = obj.mesh.material.color;
            this.clearMesh(obj);
        }

        const dotGeo = new THREE.SphereGeometry(radius, 16, 12);
        const dotMat = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.0,
            roughness: 0.8, // or even 0.0 for mirror
            envMapIntensity: 1.5,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(...arrayPolymorph(obj.position));

        dot.visible = visible;

        this.scene.add(dot);
        this.addLabel(obj.labelObj, { clone: clone, visible: visible });

        obj.updateMesh(dot);
        // if (obj.form == null && obj.formName != "") {
        //     const form = appendCheckbox("#controls", {
        //         label: obj.formName,
        //         checked: visible,
        //         onChange: (checked) => {
        //             // if (obj.mesh) obj.mesh.visible = checked;
        //             // if (obj.cloneMesh) obj.cloneMesh.visible = checked;
        //             obj.visible = checked;
        //             this.add(obj);
        //         },
        //     });
        //     obj.updateForm(form);
        // } else {
        //     this.visibility(obj);
        // }

        if (clone) {
            const dotMaterial = new THREE.PointsMaterial({
                size: 0.1,
                sizeAttenuation: true,
                color: color,
                transparent: true,
                opacity: 1,
                depthWrite: false,
                map: createRoundDotTexture(),
            });

            const dotClone = new THREE.Points(
                new THREE.BufferGeometry().setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(
                        arrayPolymorph(obj.position),
                        3
                    )
                ),
                dotMaterial
            );

            dotClone.visible = visible;

            this.miniScene.add(dotClone);
            obj.updateClone(dotClone);
        }
    }

    addLineSegment(start, end, options = {}) {
        let {
            color = 0xaaaaaa,
            thickness = 0.025,
            clone = false,
            fade = false,
            visible = true,
        } = options;

        const scene = !clone ? this.scene : this.miniScene;
        const THREE = this.THREE;

        const dir = new THREE.Vector3().subVectors(end, start); // direction
        const length = dir.length();

        if (!clone) {
            const dir = new THREE.Vector3().subVectors(end, start); // direction
            const length = dir.length();

            const material = fade
                ? new THREE.ShaderMaterial({
                      uniforms: {
                          color: { value: new THREE.Color(color) },
                          halfHeight: { value: length / 2.0 },
                      },
                      vertexShader: this.vertexShader,
                      fragmentShader: this.fragmentShader,
                      transparent: true, // Required for opacity
                      opacity: 0.65,
                      depthWrite: false,
                      side: THREE.DoubleSide, // Optional: ensures both inner and outer faces are visible
                  })
                : new THREE.MeshStandardMaterial({
                      color: color,
                      metalness: 0.5,
                      roughness: 0.7, // or even 0.0 for mirror
                      envMapIntensity: 1.5,
                      depthWrite: false,
                      transparent: true,
                      opacity: 0.45,
                  });
            const geometry = new THREE.CylinderGeometry(
                thickness, // radius
                thickness, // radius
                length,
                32, // segments
                1
            );
            geometry.translate(0, length / 2, 0); // move top to Y=0 → center at origin
            geometry.rotateX(Math.PI / 2); // make it point along Z-axis first
            const mesh = new this.THREE.Mesh(geometry, material);

            // Align cylinder direction with our vector
            const axis = new THREE.Vector3(0, 0, 1); // cylinder points along Z
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                axis,
                dir.clone().normalize()
            );
            mesh.quaternion.copy(quaternion);
            mesh.position.copy(vecPolymorph(start));
            mesh.visible = visible;
            scene.add(mesh);

            return mesh;
        } else {
            const geometry = new LineGeometry().setPositions([
                start.x,
                start.y,
                start.z,
                end.x,
                end.y,
                end.z,
            ]);

            const material = new LineMaterial({
                color: color,
                // vertexColors: true,
                linewidth: (clone ? 150 : 300) * thickness,
                resolution: new THREE.Vector2(
                    window.innerWidth,
                    window.innerHeight
                ),
                transparent: true,
                opacity: 0.75,
                // blending: THREE.AdditiveBlending, // optional: glowing look
                // depthWrite: true,
            });
            const mesh = new Line2(geometry, material);
            mesh.visible = visible;
            scene.add(mesh);
            return mesh;
        }
    }

    addLine(line, options = {}) {
        let {
            color = line.color,
            thickness = line.thickness,
            clone = line.clone,
            fade = line.fade,
            visible = line.visible,
        } = options;

        if (line.mesh != null) {
            this.clearMesh(line);
        }

        const mesh = this.addLineSegment(line.start, line.end, {
            color: color,
            thickness: thickness,
            fade: fade,
            visible: visible,
        });
        line.updateMesh(mesh);
        this.addLabel(line.labelObj, {
            offset: line.labelOffset,
            clone: clone,
            visible: visible,
        });
        // if (line.form == null && line.formName != "") {
        //     const form = appendCheckbox("#controls", {
        //         label: line.formName,
        //         checked: visible,
        //         onChange: (checked) => {
        //             line.visible = checked;
        //             this.add(line);
        //         },
        //     });
        //     line.updateForm(form);
        // } else {
        //     this.visibility(line);
        // }

        if (clone) {
            line.updateClone(
                this.addLineSegment(line.start, line.end, {
                    color: color,
                    thickness: thickness,
                    clone: true,
                    fade: fade,
                    visible: visible
                })
            );
        }
    }

    addPlane(obj, options = {}) {
        let {
            color = obj.color,
            size = obj.size,
            visible = obj.visible,
            parallel = obj.parallel,
        } = options;

        const THREE = this.THREE;
        const scene = this.scene;
        const parallelVec = vecPolymorph(parallel);

        if (obj.mesh != null) {
            // color = obj.mesh.material.color;
            this.clearMesh(obj);
        }

        const geometry = new THREE.PlaneGeometry(size, size); // Width and height
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(color) }, // A nice blue color
                planeSize: { value: new THREE.Vector2(size, size) },
            },
            vertexShader: this.planeVertexShader,
            fragmentShader: this.planeFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide, // Important for viewing from both sides
        });
        // new THREE.MeshBasicMaterial({
        //     color: color,
        //     side: THREE.DoubleSide, // Important: makes the plane visible from both sides
        //     depthWrite: false,
        //     transparent: true,
        //     opacity: 0.2,
        //     // alphaTest: 0.4
        // });
        const mesh = new THREE.Mesh(geometry, material);

        const planeUp = new THREE.Vector3()
            .crossVectors(obj.normal, parallelVec)
            .normalize();

        // Re-calculate the exact "right" vector (cross product of up and normal)
        // This ensures all three vectors are mutually orthogonal (a true orthonormal basis)
        const planeRight = new THREE.Vector3()
            .crossVectors(planeUp, obj.normal)
            .normalize();

        const rotationMatrix = new THREE.Matrix4().makeBasis(
            planeRight,
            planeUp,
            obj.normal
        );

        mesh.applyMatrix4(rotationMatrix);
        mesh.position.copy(vecPolymorph(obj.position));

        mesh.visible = visible;

        obj.updateMesh(mesh);

        // if (obj.form == null && obj.formName != "") {
        //     const form = appendCheckbox("#controls", {
        //         label: obj.formName,
        //         checked: visible,
        //         onChange: (checked) => {
        //             obj.visible = checked;
        //             this.add(obj);
        //         },
        //     });
        //     obj.updateForm(form);
        // } else {
        //     this.visibility(obj);
        // }

        scene.add(mesh);
    }

    addLinePyramid(pyramid, options = {}) {
        const { visible = pyramid.visible } = options;
        if (pyramid.mesh) {
            pyramid.mesh.geometry.dispose();
            pyramid.mesh.material.dispose();
            this.scene.remove(pyramid.mesh);
        }

        const scene = this.scene;
        const material = new this.THREE.MeshStandardMaterial({
            color: pyramid.color,
            metalness: 0,
            roughness: 1, // or even 0.0 for mirror
            envMapIntensity: 1.5,
            side: this.THREE.DoubleSide,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            // alphaTest: 0.4
        });
        const geometry = new this.ParametricGeometry(pyramid.paramFunc, 25, 25);
        const mesh = new this.THREE.Mesh(geometry, material);
        mesh.visible = visible;
        pyramid.updateMesh(mesh);
        this.scene.add(mesh);
    }
}
