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
import * as geometricObject from "./objects.js";

export function loadContent(container, filename) {
    // 1. Fetch the content from the file path
    return fetch(filename)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    "Network response was not ok: " + response.statusText
                );
            }
            return response.text(); // 2. Read the response body as plain text
        })
        .then((htmlString) => {
            // 4. Inject the retrieved HTML string into the div
            const range = document.createRange();
            const fragment = range.createContextualFragment(htmlString);
            container.appendChild(fragment); // This will trigger the console.log
            return MathJax.typesetPromise();
        })
        .catch((error) => {
            console.error(
                "There has been a problem with your fetch operation:",
                error
            );
            document.getElementById("content-container").innerHTML =
                "<p>Error loading content.</p>";
        });
}

export function createGridTexture(
    size = 512,
    step = 1,
    color = "white",
    bgColor = "black"
) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    // Fill the background (which will be transparent areas in the alphamap)
    context.fillStyle = bgColor;
    context.fillRect(0, 0, size, size);

    // Draw the grid lines (which will be opaque areas in the alphamap)
    context.strokeStyle = color;
    context.lineWidth = 1;

    for (let i = 0; i <= size; i += step) {
        // Horizontal lines
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(size, i);
        context.stroke();

        // Vertical lines
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, size);
        context.stroke();
    }

    // Use the canvas to create a three.js texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
}

export function createElementFromSpec(spec) {
    const el = document.createElement(spec.tag || "input");

    // Simple attributes
    if (spec.attrs) {
        Object.entries(spec.attrs).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
    }

    // Text content (for label, etc.)
    if (spec.text) el.textContent = spec.text;

    // Children
    if (spec.children) {
        spec.children.forEach((child) => {
            el.appendChild(createElementFromSpec(child));
        });
    }

    return el;
}

export function createCheckbox(options) {
    // const { id, label, checked = false, onChange } = options;
    const {
        container = null,
        label,
        id = null,
        checked = true,
        append = false,
        onChange,
    } = options;

    // Create wrapper (for styling/flexibility)
    const wrapper = document.createElement("div");
    wrapper.className = "visibility";

    // Create checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id == null ? randomId() : id;
    checkbox.checked = checked;
    checkbox.classList.add("form-check-input");

    // Create label
    const labelEl = document.createElement("label");
    labelEl.htmlFor = checkbox.id;
    labelEl.textContent = label;

    // Optional change handler
    if (typeof onChange === "function") {
        checkbox.addEventListener("change", (e) =>
            onChange(e.target.checked, e)
        );
    }

    // Assemble
    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);

    if (append) {
        const target =
            typeof container === "string"
                ? document.querySelector(container)
                : container instanceof Element
                ? container
                : null;

        if (!target) {
            console.error("appendCheckbox: container not found");
            return null;
        }

        target.appendChild(wrapper);
    }

    return wrapper; // useful for later reference
}

export function createSlider(options) {
    // const { id, label, checked = false, onChange } = options;
    const {
        container = null,
        label,
        id = null,
        checked = true,
        append = false,
        onChange,
        min = 0,
        max = 1,
        value = 0,
        step = 0.1,
    } = options;

    // Create wrapper (for styling/flexibility)
    const wrapper = document.createElement("div");

    // Create checkbox
    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id == null ? randomId() : id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.classList.add("form-range");

    // Create label
    const labelEl = document.createElement("label");
    labelEl.htmlFor = slider.id;
    labelEl.textContent = label;

    const valueSpan = document.createElement("span");
    valueSpan.classList.add("value");
    valueSpan.textContent = value;

    labelEl.append(valueSpan);
    slider.addEventListener("input", () => {
        valueSpan.textContent = slider.value;
    });
    // Optional change handler
    if (typeof onChange === "function") {
        checkbox.addEventListener("change", (e) =>
            onChange(e.target.checked, e)
        );
    }

    // Assemble
    wrapper.appendChild(labelEl);
    wrapper.appendChild(slider);

    if (append) {
        const target =
            typeof container === "string"
                ? document.querySelector(container)
                : container instanceof Element
                ? container
                : null;

        if (!target) {
            console.error("appendCheckbox: container not found");
            return null;
        }

        target.appendChild(wrapper);
    }

    return wrapper; // useful for later reference
}

export function createButton(options) {
    const {
        container = null,
        label = "",
        id = null,
        className = "visibility",
        append = false,
        onClick,
    } = options;

    // Create wrapper (for styling/flexibility)
    const wrapper = document.createElement("div");
    wrapper.className = className;

    // Create checkbox
    const input = document.createElement("input");
    input.type = "button";
    input.value = label;
    input.id = id == null ? randomId() : id;
    input.classList.add("btn");
    input.classList.add("btn-outline-primary");

    if (typeof onClick === "function") {
        input.addEventListener("click", (e) => onClick(e.target, e));
    }

    // Assemble
    wrapper.appendChild(input);
    // wrapper.appendChild(labelEl);
    if (append) {
        const target =
            typeof container === "string"
                ? document.querySelector(container)
                : container instanceof Element
                ? container
                : null;

        if (!target) {
            console.error("createButton: container not found");
            return null;
        }

        target.appendChild(wrapper);
    }

    return wrapper; // useful for later reference
}

function randomId() {
    return Array(8)
        .fill()
        .map(
            () =>
                "0123456789abcdefghijklmnopqrstuvwxyz"[
                    crypto.getRandomValues(new Uint8Array(1))[0] % 36
                ]
        )
        .join("");
}

export function hslToHex(h, s, l) {
    // Normalize inputs
    if (s <= 1) s *= 100;
    if (l <= 1) l *= 100;
    if (h >= 360) h %= 360;

    const color = new THREE.Color();
    color.setHSL(h / 360, s / 100, l / 100);
    return color.getHex(); // returns 0xRRGGBB integer
}

export function colorGen(colorCounter) {
    return hslToHex((50 + ((colorCounter + 1) * 67) ** 2) % 360, 0.6, 0.5);
}

export function createRoundDotTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
    );
    gradient.addColorStop(0.0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,1)");
    gradient.addColorStop(0.8, "rgba(255,255,255,0.3)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
}

export function arrayPolymorph(vec) {
    return vec instanceof THREE.Vector3
        ? [vec.x, vec.y, vec.z]
        : vec instanceof geometricObject.Point
        ? [vec.positiion.x, vec.position.y, vec.position.z]
        : vec;
}

export function vecPolymorph(vec) {
    return vec instanceof THREE.Vector3
        ? vec.clone()
        : vec instanceof geometricObject.Point
        ? vec.position.clone()
        : new THREE.Vector3(...vec);
}

export function perspectivalProj(point, options = {}) {
    const { onlyInFront = false } = options;

    if (Math.abs(point.x) < 10 ** -12) {
        return false;
    }
    const proj = point.clone().multiplyScalar(1 / point.x);

    if (onlyInFront) {
        return point.x >= 1 ? proj : point.clone();
    } else {
        return proj;
    }
}

export function truncateX(point) {
    return new THREE.Vector3(0, point.y, point.z);
}

export function blendDecimalColors(c1, c2, ratio = 0.5) {
    // Extract RGB components using bitwise operators
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    // Linear interpolation
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    // Pack components back into a single decimal integer
    return (r << 16) | (g << 8) | b;
}

export function updateSliders() {
    document
        .querySelectorAll('input[type="range"]:not(.exempt)')
        .forEach((el) =>
            el.addEventListener("input", (e) => {
                let val = parseFloat(e.target.value);
                const range = el.max - el.min;
                const anchor = Math.max(el.min, Math.min(el.max, 0));

                if (Math.abs(val - anchor) < range / 25 && val != anchor) {
                    e.target.value = 0;
                    e.target.dispatchEvent(
                        new Event("input", { bubbles: true })
                    );
                }
            })
        );
}

/**
 * Animates a range slider and ensures Three.js (or similar) updates in real-time
 * by dispatching necessary events and optionally calling a custom update callback.
 *
 * @param {HTMLInputElement} slider
 * @param {number} targetValue
 * @param {number} [duration=500]
 * @param {function} [easing=t => t] - Linear by default
 * @param {function} [onUpdate] - Optional callback called on every frame with current value
 */
export function animateSlider(slider, targetValue, options = {}) {
    if (!(slider instanceof HTMLInputElement) || slider.type !== "range") {
        throw new Error(
            'First argument must be an <input type="range"> element'
        );
    }

    const { duration = 500, easing = (t) => t, onUpdate = null } = options;

    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const stepSize = parseFloat(slider.step) || 1; // Renamed to avoid conflict

    // Clamp and snap target to valid range and step
    let finalValue = Math.max(min, Math.min(max, targetValue));
    finalValue = Math.round(finalValue / stepSize) * stepSize;

    const startValue = parseFloat(slider.value);
    const delta = finalValue - startValue;

    // If already at target (within half a step), just set and update once
    if (Math.abs(delta) < stepSize / 2) {
        slider.value = finalValue;
        dispatchEvents(slider);
        if (typeof onUpdate === "function") {
            // setTimeout(onUpdate, 0);
            onUpdate();
        }
        return;
    }

    const startTime = performance.now();

    function dispatchEvents(el) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        // Some Three.js controls or custom handlers respond to these
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
        el.dispatchEvent(new Event("pointermove", { bubbles: true }));
    }

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / duration, 1);
        progress = easing(progress);

        const currentValue = startValue + delta * progress;
        const snappedValue = Math.round(currentValue / stepSize) * stepSize;

        slider.value = snappedValue;
        setTimeout(() => {
            dispatchEvents(slider);
        }, 10);

        // onUpdate?.(snappedValue);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure final value is exact
            slider.value = finalValue;
            dispatchEvents(slider);
            if (typeof onUpdate === "function") {
                // setTimeout(onUpdate, 0);
                onUpdate();
            }
        }
    }
    requestAnimationFrame(animate);
}
