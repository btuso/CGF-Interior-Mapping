let Input;
let Render;

const TARGET_FPS = 60;

async function start() {
    let killswitch = 0;
    let previousFrameStart = timeInMilis();
    const game = new Game();

    game.start();
    while (true && killswitch < 2000) {
        let currentFrameStart = timeInMilis();
        const delta = currentFrameStart - previousFrameStart;
        
        Input.pollInputs();
        game.update(delta / 1000);
        
        let s = timeInMilis();
        window.requestAnimationFrame(() =>
            Render.draw(game.getCamera(), game.getScene().filter(node => node.shouldBeRendered()))
        );
        let f = timeInMilis();
        
        // FPS cap
        await limitFPS(currentFrameStart, TARGET_FPS);
      //  console.log('Time between frames is: ' + delta + '  frame #'+ killswitch + ",  time spent rendering: "+ (f-s));
        
        previousFrameStart = currentFrameStart;
        killswitch++;
    }
    console.log('Done')
};

function timeInMilis() {
    return new Date().getTime();
}

// Ensure FPS are capped at #targetFPS to prevent CPU hogging
async function limitFPS(frameStart, targetFPS) {
    const timeUpToNow = timeInMilis() - frameStart;
    const idle = (1000 / targetFPS) - timeUpToNow;
    await sleep(idle);
};

// setTimeout only has 10ms granularity, therefore this can only be used to cap fps to a maximum of around 80 fps
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
};

window.onload = function() {
    Render = new RenderingSystem(document, window);
    Input = new InputSystem(window, INPUT_MAP, Render.getScreenSize());
    start();
};

// Called from index.html
function WindowResize() {
    canvas = document.getElementById("canvas");
	Render.updateCanvasSize(canvas);
    Input.updateScreenSize(Render.getScreenSize());
}
