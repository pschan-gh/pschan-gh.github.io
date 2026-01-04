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

import * as THREE from "three";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // Cleaner path
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { TAARenderPass } from "three/addons/postprocessing/TAARenderPass.js";
// TAA requires specific shaders/passes internally, so make sure your build system includes them or import explicitly:
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"; // Might be needed
import { CopyShader } from "three/addons/shaders/CopyShader.js"; // Might be needed
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"; // Often needed as the final pass

import { Line2 } from "three/addons/lines/Line2.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    // appendCheckbox,
    createRoundDotTexture,
    arrayPolymorph,
    vecPolymorph,
    createGridTexture,
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
            Slider: this.addForm.bind(this),
            Button: this.addForm.bind(this),
            Label: this.addLabel.bind(this),
            Point: this.addPoint.bind(this),
            Line: this.addLine.bind(this),
            LineSegment: this.addLine.bind(this),
            Plane: this.addPlane.bind(this),
            Pyramid: this.addPyramid.bind(this),
            Rectangle: this.addEmpty.bind(this),
            SmallRectangle: this.addSmallRectangle.bind(this),
            Arc: this.addArc.bind(this),
            Ellipse: this.addCurve.bind(this),
            curveObject: this.addCurve.bind(this),
            parametricCurve: this.addCurve.bind(this),
        };

        this.innerWidth = 600;
        this.innerHeight = 600;
        this.scene = new THREE.Scene();
        // this.sceneColor = 0xf9f9f9;
        this.sceneColor = 0xffffff;
        this.scene.background = new THREE.Color(this.sceneColor);

        // Scene setup

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        // this.renderer = new SVGRenderer();
        this.renderer.setSize(this.innerWidth, this.innerHeight);
        this.renderer.setClearColor(this.sceneColor, 1);
        this.renderer.setPixelRatio(devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        // this.renderer.sortObjects = true;

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

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(this.innerWidth, this.innerHeight);
        this.labelRenderer.domElement.style.position = "absolute";
        this.labelRenderer.domElement.style.top = "0px";
        // Ensure pointer events pass through to the main canvas
        this.labelRenderer.domElement.style.pointerEvents = "none";
        this.container.appendChild(this.labelRenderer.domElement);

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        // this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement);
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
        this.miniRenderer.localClippingEnabled = true;

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
            uniform float opacity;
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
            gl_FragColor = vec4(color, opacity * (1.0 - fadeAmount));
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

        this.alphaMapTexture = createGridTexture();

        this.composer = new EffectComposer(this.renderer);

        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.taaRenderPass = new TAARenderPass(this.scene, this.camera);
        // Optional: set sample levels for quality/performance trade-offs
        this.taaRenderPass.sampleLevel = 2; // Level 2 means 4 samples
        this.taaRenderPass.accumulate = true;
        this.composer.addPass(this.taaRenderPass);

        // ... after adding your TAARenderPass
        this.outputPass = new OutputPass();
        this.composer.addPass(this.outputPass);

        const taaPass = this.taaRenderPass;
        let accumulationTimeout;
        this.controls.addEventListener("start", () => {
            taaPass.accumulate = false;
            taaPass.cameraIsMoving = true;
        });

        // Resize handler
        window.addEventListener("resize", () => {
            this.camera.aspect = this.innerWidth / this.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.innerWidth, this.innerHeight);
            this.composer.setSize(this.innerWidth, this.innerHeight); // Essential for the composer
        });

        this.controls.addEventListener("end", () => {
            // Wait ~2–3 frames (33–50 ms) for any remaining damping/inertia to settle
            clearTimeout(accumulationTimeout);
            accumulationTimeout = setTimeout(() => {
                taaPass.accumulate = true;
            }, 60); // 60 ms works perfectly in all cases
        });

        this.controls.addEventListener("change", () => {
            taaPass.accumulate = false; // forces a fresh frame (you already do this on start/end)
            taaPass.cameraIsMoving = true;
        });

        // Animation loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const { x, y, z } = this.camera.position;
        const { x: a, y: b, z: c } = this.controls.target;
        const infoCamera = document.getElementById("cameraxyz");
        const infoTarget = document.getElementById("targetxyz");
        infoCamera.value = `(${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)})`;
        infoTarget.value = `(${a.toFixed(2)},${b.toFixed(2)},${c.toFixed(2)})`;

        this.controls.update();

        // if (this.controls.isZooming || this.controls.isPanning || this.controls.isRotating) {
        // 	this.taaRenderPass.cameraIsMoving = true; // forces fresh projection + discards accumulation
        // }

        this.miniControls.update();
        // this.renderer.render(this.scene, this.camera);
        this.miniRenderer.render(this.miniScene, this.miniCamera);

        this.labelRendererMini.render(this.miniScene, this.miniCamera);
        this.labelRenderer.render(this.scene, this.camera);

        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld(); // important!

        this.composer.render();
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
        if (typeof obj.mesh !== "undefined" && obj.mesh != null) {
            obj.mesh?.geometry?.dispose();
            obj.mesh?.material?.dispose();
            this.scene.remove(obj.mesh);
            obj.mesh = null;
        }

        // if (obj.clone) {
        if (typeof obj.cloneMesh !== "undefined" && obj.cloneMesh != null) {
            obj.cloneMesh?.geometry?.dispose();
            obj.cloneMesh?.material?.dispose();
            // obj.cloneMesh.geometry.dispose();
            // obj.cloneMesh.material.dispose();
            this.miniScene.remove(obj.cloneMesh);
            obj.cloneMesh = null;
        }
        // }

        if (obj.labelObj != null) {
            this.clearLabel(obj.labelObj);
        }
    }

    clearLabel(label) {
        if (typeof label.CSS2DObj !== "undefined" && label.CSS2DObj != null) {
            this.scene.remove(label.CSS2DObj);
            label.CSS2DObj = null;
        }
        if (typeof label.cloneMesh !== "undefined" && label.cloneMesh != null) {
            this.miniScene.remove(label.cloneMesh);
            label.cloneMesh = null;
        }
    }

    add(obj, options = {}) {
        if (obj != null) {
            const name = obj.constructor.name;
            const handler = this.drawFunctions[name];

            // obj.children.forEach((child) => {
            //     this.add(child);
            // });
            handler(obj, options);
        } else {
            return true;
        }
    }

    addForm(form) {
        if (!form.hidden) {
            form.div.hidden = false;
        }
        return true;
    }

    addLabel(obj, options = {}) {
        const {
            clone = obj.clone,
            offset = obj.offset,
            visible = obj.visible,
        } = options;

        // if (obj.CSS2DObj != null) {
        //     this.scene.remove(obj.CSS2DObj);
        // }
        // if (obj.cloneMesh != null) {
        //     this.miniScene.remove(obj.cloneMesh);
        // }

        const CSS2DObject = this.CSS2DObject;

        const posVec = vecPolymorph(obj.position);
        const offsetVec = vecPolymorph(offset);
        const labelVec = posVec.clone().add(offsetVec);

        const div = document.createElement("div");
        div.className = "math-label";
        div.textContent = obj.text;
        div.style.color = obj.color;
        div.style.background = "rgba(0,0,0,0)";
        const divClone = div.cloneNode(true);

        let labelCSS2D = obj.CSS2DObj;

        if (obj.CSS2DObj == null) {
            MathJax.typesetPromise([div]);
            labelCSS2D = new CSS2DObject(div);
        }
        labelCSS2D.position.set(labelVec.x, labelVec.y, labelVec.z);

        labelCSS2D.visible = visible;
        if (obj.CSS2DObj == null) {
            this.scene.add(labelCSS2D);
        }
        obj.updateCSS2DObj(labelCSS2D);

        if (clone) {
            let labelClone = obj.cloneMesh;
            if (obj.cloneMesh == null) {
                MathJax.typesetPromise([divClone]);
                labelClone = new CSS2DObject(divClone);

                labelClone.position.set(labelVec.x, labelVec.y, labelVec.z);
                labelClone.visible = visible;

                this.miniScene.add(labelClone);
            }
            labelClone.position.set(labelVec.x, labelVec.y, labelVec.z);
            labelClone.visible = visible;
            if (obj.cloneMesh == null) {
                this.miniScene.add(labelClone);
            }
            // this.miniScene.add(labelClone);
            obj.updateClone(labelClone);
            // return labelClone;
        } else {
            if (obj.cloneMesh != null) {
                obj.cloneMesh.visible = false;
            }
        }
    }

    addEmpty(options = {}) {
        return true;
    }

    addPoint(obj, options = {}) {
        let {
            color = obj.color,
            opacity = obj.opacity,
            radius = 0.06,
            clone = obj.clone,
            visible = obj.visible,
        } = options;
        const THREE = this.THREE;

        if (!visible) {
            return true;
        }

        let dot = obj.mesh;
        if (dot == null) {
            // this.clearMesh(obj);
            const dotGeo = new THREE.SphereGeometry(radius, 16, 12);
            const dotMat = new THREE.MeshStandardMaterial({
                color: color,
                // metalness: 0.9,
                roughness: 0.75, // or even 0.0 for mirror
                envMapIntensity: 1.5,
                transparent: true,
                opacity: 1 * obj.opacity,
            });
            dot = new THREE.Mesh(dotGeo, dotMat);
        }

        dot.position.set(obj.position.x, obj.position.y, obj.position.z);
        dot.visible = visible;

        if (obj.mesh == null) {
            this.scene.add(dot);
        }

        obj.updateMesh(dot);

        if (clone) {
            let dotClone = obj.cloneMesh;
            if (dotClone == null) {
                const dotMaterial = new THREE.PointsMaterial({
                    size: 0.09,
                    sizeAttenuation: true,
                    color: color,
                    transparent: true,
                    opacity: 1 * obj.opacity,
                    depthWrite: true,
                    map: createRoundDotTexture(),
                });

                dotClone = new THREE.Points(
                    new THREE.BufferGeometry().setAttribute(
                        "position",
                        new THREE.Float32BufferAttribute(
                            arrayPolymorph(obj.position),
                            3
                        )
                    ),
                    // new THREE.BufferGeometry(),
                    dotMaterial
                );
            } else {
                const positionAttr = dotClone.geometry.getAttribute("position");
                positionAttr.setXYZ(
                    0,
                    obj.position.x,
                    obj.position.y,
                    obj.position.z
                );

                positionAttr.needsUpdate = true;

                dotClone.geometry.computeBoundingSphere();
            }

            dotClone.visible = visible;

            if (obj.meshClone == null) {
                this.miniScene.add(dotClone);
            }
            obj.updateClone(dotClone);
        } else {
            if (obj.cloneMesh != null) {
                this.miniScene.remove(obj.cloneMesh);
                obj.cloneMesh.geometry.dispose();
                obj.cloneMesh.material.dispose();
                obj.cloneMesh = null;
            }
        }
    }

    addLineSegment(start, end, options = {}) {
        let {
            color = 0xaaaaaa,
            thickness = 0.025,
            clone = false,
            fade = false,
            visible = true,
            opacity = 0.75,
            mesh = null,
        } = options;
        const scene = !clone ? this.scene : this.miniScene;
        const THREE = this.THREE;

        const dir = new THREE.Vector3().subVectors(end, start); // direction
        const length = dir.length();

        if (length == 0) {
            mesh = null;
            return mesh;
        }

        let updatedMesh = mesh;
        if (!clone) {
            const material = fade
                ? new THREE.ShaderMaterial({
                      uniforms: {
                          color: { value: new THREE.Color(color) },
                          halfHeight: { value: length / 2.0 },
                          opacity: { value: opacity },
                      },
                      vertexShader: this.vertexShader,
                      fragmentShader: this.fragmentShader,
                      transparent: true, // Required for opacity
                      opacity: opacity,
                      depthWrite: false,
                      side: THREE.DoubleSide, // Optional: ensures both inner and outer faces are visible
                  })
                : new THREE.MeshStandardMaterial({
                      color: color,
                      metalness: 0.75,
                      roughness: 0.75, // or even 0.0 for mirror
                      envMapIntensity: 1.5,
                      depthWrite: false,
                      transparent: true,
                      opacity: opacity,
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
            if (updatedMesh == null) {
                updatedMesh = new this.THREE.Mesh(geometry, material);
            } else {
                updatedMesh.geometry.dispose();
                updatedMesh.geometry = geometry;
            }
            // updatedMesh = new this.THREE.Mesh(geometry, material);

            // Align cylinder direction with our vector
            const axis = new THREE.Vector3(0, 0, 1); // cylinder points along Z
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                axis,
                dir.clone().normalize()
            );
            updatedMesh.quaternion.copy(quaternion);
            updatedMesh.position.copy(vecPolymorph(start));
            updatedMesh.visible = visible;
            if (mesh == null) {
                scene.add(updatedMesh);
            }
            // if (updatedMesh == null) {
            // 	const geometry = new LineGeometry();
            // 	const material = new LineMaterial({
            // 		color: color,
            // 		// vertexColors: true,
            // 		linewidth: (clone ? 150 : 300) * thickness,
            // 		resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            // 		transparent: true,
            // 		opacity: opacity,
            // 		// blending: THREE.AdditiveBlending, // optional: glowing look
            // 		// depthWrite: true,
            // 	});
            // 	updatedMesh = new Line2(geometry, material);
            // }

            // updatedMesh.geometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
            // updatedMesh.visible = visible;
            // if (mesh == null) {
            // 	scene.add(updatedMesh);
            // }
            return updatedMesh;
        } else {
            if (updatedMesh == null) {
                const geometry = new LineGeometry();
                const material = new LineMaterial({
                    color: color,
                    // vertexColors: true,
                    linewidth: (clone ? 150 : 300) * thickness,
                    resolution: new THREE.Vector2(
                        window.innerWidth,
                        window.innerHeight
                    ),
                    transparent: true,
                    opacity: opacity,
                    // blending: THREE.AdditiveBlending, // optional: glowing look
                    // depthWrite: true,
                });
                updatedMesh = new Line2(geometry, material);
            }

            updatedMesh.geometry.setPositions([
                start.x,
                start.y,
                start.z,
                end.x,
                end.y,
                end.z,
            ]);
            updatedMesh.visible = visible;
            if (mesh == null) {
                scene.add(updatedMesh);
            }
            return updatedMesh;
        }
    }

    addLine(line, options = {}) {
        let {
            color = line.color,
            thickness = line.thickness,
            clone = line.clone,
            fade = line.fade,
            visible = line.visible,
            opacity = line.opacity,
        } = options;

        if (!visible) {
            if (line.mesh != null) {
                this.scene.remove(line.mesh);
                line.mesh = null;
            }
            if (line.cloneMesh != null) {
                this.miniScene.remove(line.cloneMesh);
                line.cloneMesh = null;
            }
            return true;
        }

        const mesh = this.addLineSegment(line.start, line.end, {
            color: color,
            thickness: thickness,
            fade: fade,
            visible: visible,
            opacity: opacity,
            mesh: line.mesh,
        });
        if (mesh == null) {
            this.clearMesh(line);
        }
        line.updateMesh(mesh);

        if (clone) {
            line.updateClone(
                this.addLineSegment(line.start, line.end, {
                    color: color,
                    thickness: thickness,
                    clone: true,
                    fade: fade,
                    visible: visible,
                    opacity: opacity,
                    mesh: line.cloneMesh,
                })
            );
        } else {
            if (line.cloneMesh != null) {
                // line.cloneMesh.visible = false;
                this.miniScene.remove(line.cloneMesh);
                line.cloneMesh.geometry.dispose();
                line.cloneMesh.material.dispose();
                line.cloneMesh = null;
            }
        }
    }

    addPlane(obj, options = {}) {
        let {
            color = obj.color,
            size = obj.size,
            visible = obj.visible,
            parallel = obj.parallel,
            opacity = obj.opacity,
        } = options;

        if (!visible) {
            return true;
        }

        const THREE = this.THREE;
        const parallelVec = vecPolymorph(parallel);

        let mesh = obj.mesh;
        if (mesh == null) {
            // this.clearMesh(obj);
            const geometry = new THREE.PlaneGeometry(size, size); // Width and height
            const material =
                // new THREE.ShaderMaterial({
                //     uniforms: {
                //         color: { value: new THREE.Color(color) },
                //         planeSize: { value: new THREE.Vector2(size, size) },
                //     },
                //     vertexShader: this.planeVertexShader,
                //     fragmentShader: this.planeFragmentShader,
                //     transparent: true,
                //     depthWrite: false,
                //     side: THREE.DoubleSide, // Important for viewing from both sides
                // });
                new THREE.MeshBasicMaterial({
                    color: color,
                    alphaMap: this.alphaMapTexture,
                    alphaHash: true,
                    // envMapIntensity: 1.5,
                    // metalness: 0,
                    // roughness: 1,
                    side: THREE.DoubleSide, // Important: makes the plane visible from both sides
                    // depthWrite: false,
                    // transparent: true,
                    opacity: opacity,
                    // clearcoat: 0,
                    // clearcoatRoughness: 1,
                });
            mesh = new THREE.Mesh(geometry, material);
        }

        // Create an identity matrix (all zeros except 1s on the diagonal)
        const identity = new THREE.Matrix4().identity();

        // Decompose it back into the mesh properties to sync them
        identity.decompose(mesh.position, mesh.quaternion, mesh.scale);

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

        if (obj.mesh == null) {
            this.scene.add(mesh);
        }
        obj.updateMesh(mesh);
    }

    addPyramid(pyramid, options = {}) {
        const { visible = pyramid.visible, opacity = pyramid.opacity } =
            options;
        // if (pyramid.mesh) {
        //     // pyramid.mesh.geometry.dispose();
        //     // pyramid.mesh.material.dispose();
        //     // this.scene.remove(pyramid.mesh);
        //     this.clearMesh(pyramid);
        // }
        if (!visible) {
            return true;
        }
        let mesh = pyramid.mesh;
        if (mesh == null) {
            const material =
                // new this.THREE.MeshStandardMaterial({
                //     color: pyramid.color,
                //     metalness: 0,
                //     roughness: 1, // or even 0.0 for mirror
                //     envMapIntensity: 1.5,
                //     side: this.THREE.DoubleSide,
                //     transparent: true,
                //     opacity: 0.4,
                //     depthWrite: false,
                //     // alphaTest: 0.4
                // });
                new THREE.MeshBasicMaterial({
                    color: pyramid.color,
                    alphaMap: this.alphaMapTexture,
                    alphaHash: true,
                    // envMapIntensity: 1.5,
                    // metalness: 0,
                    // roughness: 1,
                    side: THREE.DoubleSide, // Important: makes the plane visible from both sides
                    // depthWrite: false,
                    // transparent: true,
                    opacity: opacity,
                    // clearcoat: 0,
                    // clearcoatRoughness: 1,
                });
            // const geometry = new this.ParametricGeometry(pyramid.paramFunc, 25, 25);
            // const geometry = new this.ParametricGeometry(pyramid.paramFunc, Math.round(pyramid.res / 6), Math.round(pyramid.res / 6));

            const geometry = new THREE.BufferGeometry();
            // 1. Set vertices from the Vector3 array
            // console.log(pyramid.points);
            geometry.setFromPoints(pyramid.points);

            // 2. Create the index buffer
            // Triangle 1: index 0 (origin), index 1, index 2
            // Triangle 2: index 0 (origin), index 2, index 3...
            const indices = [];
            for (let i = 1; i < pyramid.points.length - 1; i++) {
                indices.push(0, i, i + 1);
            }

            geometry.setIndex(indices);
            // geometry.computeVertexNormals();

            mesh = new this.THREE.Mesh(geometry, material);
        } else {
            // console.log("updating pyramid");
            // const positionAttr = mesh.geometry.attributes.position;

            // for (let i = 0; i < pyramid.points.length; i++) {
            //     // Only update if your points array length matches or is smaller than the original
            //     positionAttr.setXYZ(
            //         i,
            //         pyramid.points[i].x,
            //         pyramid.points[i].y,
            //         pyramid.points[i].z
            //     );
            // }
            // positionAttr.needsUpdate = true;
            // mesh.geometry.computeBoundingSphere();
            // mesh.geometry.computeBoundingBox();

            // 1. Set vertices from the Vector3 array
            // console.log(pyramid.points);
            mesh.geometry.setFromPoints(pyramid.points);

            const indices = [];
            for (let i = 1; i < pyramid.points.length - 1; i++) {
                indices.push(0, i, i + 1);
            }
            mesh.geometry.setIndex(indices);
        }

        mesh.visible = visible;
        if (pyramid.mesh == null) {
            this.scene.add(mesh);
        }

        pyramid.updateMesh(mesh);
    }

    addArc(obj, options = {}) {
        const { visible = obj.visible } = options;
        if (!visible) {
            return true;
        }
        // if (obj.mesh != null) {
        //     this.clearMesh(obj);
        // }

        // makeFilledArcMesh(v1_, v2_, radius, color)
        const mesh = makeArcMesh(
            obj.pos1,
            obj.pos2,
            obj.position,
            obj.radius,
            obj.color,
            obj.filled,
            {
                opacity: obj.opacity,
                mesh: obj.mesh == null ? null : obj.mesh,
            }
        );

        mesh.visible = visible;
        if (obj.mesh == null) {
            this.scene.add(mesh);
        }
        obj.updateMesh(mesh);

        if (obj.clone) {
            const cloneMesh = makeArcMesh(
                obj.pos1,
                obj.pos2,
                obj.position,
                obj.radius,
                obj.color,
                obj.filled,
                {
                    clone: true,
                    opacity: obj.opacity,
                    mesh: obj.cloneMesh,
                }
            );
            cloneMesh.visible = visible;
            if (obj.cloneMesh == null) {
                this.miniScene.add(cloneMesh);
            }
            obj.updateClone(cloneMesh);
        } else {
            if (obj.cloneMesh != null) {
                this.miniScene.remove(obj.cloneMesh);
                obj.cloneMesh = null;
            }
        }
    }

    addSmallRectangle(obj, options = {}) {
        const { visible = obj.visible } = options;
        if (!visible) {
            return true;
        }
        if (obj.mesh != null) {
            this.clearMesh(obj);
        }

        // makeFilledArcMesh(v1_, v2_, radius, color)
        const mesh = makeRectangleMesh(
            obj.pos1,
            obj.pos2,
            obj.position,
            obj.radius,
            obj.color,
            obj.filled,
            {
                opacity: obj.opacity,
            }
        );

        mesh.visible = visible;
        obj.updateMesh(mesh);

        this.scene.add(mesh);

        if (obj.clone) {
            const cloneMesh = makeRectangleMesh(
                obj.pos1,
                obj.pos2,
                obj.position,
                obj.radius,
                obj.color,
                obj.filled,
                {
                    clone: true,
                    opacity: obj.opacity,
                }
            );
            cloneMesh.visible = visible;
            this.miniScene.add(cloneMesh);
            obj.updateClone(cloneMesh);
        }
    }

    addCurve(obj, options = {}) {
        const { visible = obj.visible, res = this.res } = options;
        if (!visible) {
            return true;
        }
        // if (obj.mesh != null) {
        //     this.clearMesh(obj);
        // }

        // makeFilledArcMesh(v1_, v2_, radius, color)
        // const smooth = !(obj.constructor.name == 'Rectangle');
        const mesh = makeCurveMesh(obj.points, {
            clone: false,
            res: res,
            color: obj.color,
            opacity: this.opacity,
            mesh: obj.mesh,
            // smooth: smooth
        });

        mesh.visible = visible;

        if (obj.mesh == null) {
            this.scene.add(mesh);
        }
        obj.updateMesh(mesh);

        if (obj.clone) {
            const cloneMesh = makeCurveMesh(obj.points, {
                clone: true,
                res: res,
                color: obj.color,
                opacity: this.opacity,
                mesh: obj.cloneMesh,
                // smooth: smooth
            });
            cloneMesh.visible = visible;
            if (obj.cloneMesh == null) {
                this.miniScene.add(cloneMesh);
            }
            obj.updateClone(cloneMesh);
        } else {
            if (obj.cloneMesh != null) {
                obj.cloneMesh.visible = false;
            }
        }
    }
}

function makeCurveMesh(points, options = {}) {
    const {
        thickness = 1,
        clone = false,
        color = "#000",
        res = 100,
        opacity = 0.75,
        mesh = null,
        // smooth = true,
    } = options;

    if (points.length === 1) {
        const p1 = points[0];
        // Create a second point offset by a tiny amount
        const p2 = p1.clone().add(new THREE.Vector3(0.00001, 0, 0));
        points = [p1, p2];
    }

    const curve = new THREE.CatmullRomCurve3(points);

    if (mesh == null) {
        let material;
        const geometry = new THREE.TubeGeometry(
            curve, // The path defined by your 50 points
            points.length, // Number of segments along the tube's length (more for smoother arc)
            0.015 * thickness, // Radius (thickness of the arc in world units)
            8, // Number of segments around the tube's circumference (more for a rounder tube)
            false // Is the tube closed (starts/ends meet)?
        );
        if (!clone) {
            material = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide,
            });
        } else {
            const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -1);

            material = new THREE.LineBasicMaterial({
                color: color,
                opacity: opacity,
                clippingPlanes: [clipPlane],
                side: THREE.DoubleSide,
            });
        }
        return new THREE.Mesh(geometry, material);
    } else {
        mesh.geometry.dispose();
        const position = mesh.geometry.attributes.position;
        const tubeData = new THREE.TubeGeometry(
            curve,
            points.length,
            0.015 * thickness,
            8,
            false
        );
        
        // Directly copy the newly calculated data into the old buffer
        // position.copyArray(tubeData.attributes.position.array);
        // position.array.set(tubeData.attributes.position.array);
        // position.needsUpdate = true;
        // tubeData.dispose();
        mesh.geometry = tubeData;
        return mesh;
    }
}

function makeArcMesh(p1_, p2_, pos_, radius, color, filled, options = {}) {
    const {
        thickness = 1,
        clone = false,
        opacity = 0.55,
        mesh = null,
    } = options;
    const p1 = vecPolymorph(p1_);
    const p2 = vecPolymorph(p2_);
    const pos = vecPolymorph(pos_);
    const v1 = p1.clone().sub(pos);
    const v2 = p2.clone().sub(pos);
    const normalVector = v1.clone().cross(v2);

    const normal = normalVector.clone().normalize();
    const direction = v1.clone().normalize();

    const angle = v1.angleTo(v2);

    // 1. Generate the 2D Shape (Default orientation on the local XY plane, starting along +X)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, radius, 0, angle, false);

    let geometry;
    let material;
    let updatedMesh = mesh;

    if (filled) {
        shape.lineTo(0, 0);
        geometry = new THREE.ShapeGeometry(shape, 32);
        if (mesh == null) {
            material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide,
            });
            updatedMesh = new THREE.Mesh(geometry, material);
        } else {
            updatedMesh.geometry.dispose();

            // 3. Assign a newly generated geometry to the same mesh
            updatedMesh.geometry = geometry;
        }
    } else {
        const points = shape.extractPoints(20).shape;
        const points3d = points.map((point) => {
            return new THREE.Vector3(point.x, point.y, 0);
        });
        updatedMesh = makeCurveMesh(points3d, {
            thickness: thickness,
            clone: clone,
            color: color,
            opacity: opacity,
            mesh: mesh == null ? null : mesh
        })
    }

    // const mesh = new THREE.Mesh(geometry, material);

    // 2. Define the target coordinate system (basis) using the user's vectors
    const targetX = direction;
    const targetZ = normal;
    // Calculate the third axis (Y) to form a right-handed system: Y = Z cross X
    const targetY = new THREE.Vector3()
        .crossVectors(targetZ, targetX)
        .normalize();

    // 3. Create a rotation matrix from this new basis
    // makeRotationFromBasis takes X, Y, Z vectors
    const orientationMatrix = new THREE.Matrix4().makeBasis(
        targetX,
        targetY,
        targetZ
    );

    // 4. Apply the rotation to the mesh using its quaternion
    const orientationQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        orientationMatrix
    );
    updatedMesh.setRotationFromQuaternion(orientationQuaternion);
    updatedMesh.position.copy(pos);

    return updatedMesh;
}

function makeRectangleMesh(
    p1_,
    p2_,
    pos_,
    radius,
    color,
    filled,
    options = {}
) {
    const { thickness = 2.5, clone = false, opacity = 0.55 } = options;
    const p1 = vecPolymorph(p1_);
    const p2 = vecPolymorph(p2_);
    const pos = vecPolymorph(pos_);
    const v1 = p1.clone().sub(pos);
    const v2 = p2.clone().sub(pos);
    const normalVector = v1.clone().cross(v2);
    const offset = v1
        .clone()
        .normalize()
        .add(v2.clone().normalize())
        .multiplyScalar(radius * 0.5);

    const normal = normalVector.clone().normalize();
    const direction = v1.clone().normalize();

    let geometry;
    let material;
    let mesh;

    geometry = new THREE.PlaneGeometry(radius, radius);

    if (filled) {
        material = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide, // Makes it visible from both front and back
        });
        mesh = new THREE.Mesh(geometry, material);
    } else {
        const edges = new THREE.EdgesGeometry(geometry);

        // 3. Convert EdgesGeometry into thick LineSegmentsGeometry
        const fatGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);

        // 4. Create material and mesh
        const fatMaterial = new LineMaterial({
            color: color,
            linewidth: thickness, // Width in pixels
            resolution: new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            ),
        });

        mesh = new LineSegments2(fatGeometry, fatMaterial);
        // const edges = new THREE.EdgesGeometry(geometry);
        // const lineMaterial = new THREE.LineBasicMaterial({
        //     color: color,
        //     thickness: thickness,
        // });
        // mesh = new THREE.LineSegments(edges, lineMaterial);
    }

    const targetX = direction;
    const targetZ = normal;
    // Calculate the third axis (Y) to form a right-handed system: Y = Z cross X
    const targetY = new THREE.Vector3()
        .crossVectors(targetZ, targetX)
        .normalize();

    // 3. Create a rotation matrix from this new basis
    // makeRotationFromBasis takes X, Y, Z vectors
    const orientationMatrix = new THREE.Matrix4().makeBasis(
        targetX,
        targetY,
        targetZ
    );

    // 4. Apply the rotation to the mesh using its quaternion
    const orientationQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        orientationMatrix
    );
    mesh.setRotationFromQuaternion(orientationQuaternion);
    mesh.position.copy(pos.clone().add(offset));

    return mesh;
}
