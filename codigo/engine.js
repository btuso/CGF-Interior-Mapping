let Input;
let Render;
let game;
let previousFrameStart;

const MAX_FRAMES_TO_RENDER = 3000;
const CAP_FRAMES = false;

window.onload = function() {
    Render = new RenderingSystem(document, window);
    Input = new InputSystem(window, INPUT_MAP, Render.getScreenSize());
    game = new Game();

    game.start();    
    previousFrameStart = new Date().getTime();
    window.requestAnimationFrame(processFrame);
};

let killswitch = 0;
function processFrame(currentFrameStart) {
    const delta = currentFrameStart - previousFrameStart;
    previousFrameStart = currentFrameStart;
    
    Input.pollInputs();
    game.update(delta / 1000);
    
    Render.draw(game.getCamera(), game.getScene().filter(node => node.shouldBeRendered()))
    
  //  console.log('Time between frames is: ' + delta + '  frame #'+ killswitch);
    
    killswitch++;
    if (!CAP_FRAMES || killswitch < MAX_FRAMES_TO_RENDER) 
        window.requestAnimationFrame(processFrame);
};

// Called from index.html
function WindowResize() {
    canvas = document.getElementById("canvas");
	Render.updateCanvasSize(canvas);
    Input.updateScreenSize(Render.getScreenSize());
}
