import { Scene } from "./scenes/vp.js";
import { loadContent } from "./utils.js";

const container = document.getElementById("three-container");
const miniMap = document.getElementById("miniMap");

// Now just load your scene(s)
MathJax.startup.promise.then(() => {    
    loadContent(document.getElementById("text"), "./scenes/vp.html");
    new Scene();
});

// If you have multiple scenes later:
// new AnotherScene(app);
// sceneManager.switchTo('another');
