import { Scene } from "./scenes/vp.js";
import { loadContent, updateSliders } from "./utils.js";

const container = document.getElementById("three-container");
const miniMap = document.getElementById("miniMap");

// Now just load your scene(s)
MathJax.startup.promise.then(() => {
    const promise = loadContent(
        document.getElementById("text"),
        "./scenes/vp.html"
    ).then(() => {
        new Scene();
        MathJax.typesetPromise();
        updateSliders();        
    });
});
