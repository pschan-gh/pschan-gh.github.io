// import { Draw } from "./app/Draw.js";
import { Scene } from "./scenes/mp.js";
import { loadContent } from "./utils.js";

// const container = document.getElementById("three-container");
// const miniMap = document.getElementById("miniMap");
// const draw = new Draw(container, miniMap);

// Now just load your scene(s)
MathJax.startup.promise.then(() => {    
    loadContent(document.getElementById("text"), "./scenes/mp.html");
    // new Scene(draw);
    new Scene();
});

// If you have multiple scenes later:
// new AnotherScene(app);
// sceneManager.switchTo('another');
