import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";
import * as geometricObject from "./objects.js";

export function loadContent(container, filename) {
    // 1. Fetch the content from the file path
    fetch(filename)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    "Network response was not ok: " + response.statusText,
                );
            }
            return response.text(); // 2. Read the response body as plain text
        })
        .then((htmlString) => {
            // 4. Inject the retrieved HTML string into the div
            container.innerHTML = htmlString;
            return MathJax.typesetPromise();
        })
        .catch((error) => {
            console.error(
                "There has been a problem with your fetch operation:",
                error,
            );
            document.getElementById("content-container").innerHTML =
                "<p>Error loading content.</p>";
        });
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

export function appendCheckbox(container, options) {
    // const { id, label, checked = false, onChange } = options;
    const { label, checked = true, onChange } = options;

    const target =
        typeof container === "string"
            ? document.querySelector(container)
            : container;

    if (!target) {
        console.error("appendCheckbox: container not found");
        return null;
    }

    // Create wrapper (for styling/flexibility)
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    user-select: none;
    color: #eee;
    font-family: system-ui, sans-serif;
    `;

    // Create checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = randomId();
    checkbox.checked = checked;

    // Create label
    const labelEl = document.createElement("label");
    labelEl.htmlFor = checkbox.id;
    labelEl.textContent = label;
    labelEl.style.marginLeft = "8px";
    labelEl.style.cursor = "pointer";
    labelEl.style.color = "#eee";

    // Optional change handler
    if (typeof onChange === "function") {
        checkbox.addEventListener("change", (e) =>
            onChange(e.target.checked, e),
        );
    }

    // Assemble
    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);
    target.appendChild(wrapper);

    return checkbox; // useful for later reference
}

function randomId() {
    return Array(8)
        .fill()
        .map(
            () =>
                "0123456789abcdefghijklmnopqrstuvwxyz"[
                    crypto.getRandomValues(new Uint8Array(1))[0] % 36
                ],
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
    return hslToHex((50 + (colorCounter ** 2 + 23) ** 2) % 360, 0.65, 0.45);
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
        size / 2,
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
        : (vec instanceof geometricObject.Point
          ? [vec.positiion.x, vec.position.y, vec.position.z]
          : vec);
}

export function vecPolymorph(vec) {
    return vec instanceof THREE.Vector3
        ? vec
        : (vec instanceof geometricObject.Point
          ? vec.position
          : new THREE.Vector3(...vec));
}

export function perspectivalProj(point) {
    if (point.x != 0) {
        return point.clone().multiplyScalar(1 / point.x);
    } else {
        return vecPolymorph([0, 0, 0]);
    }
}

export function truncateX(point) {
    return new THREE.Vector3(0, point.y, point.z);
}