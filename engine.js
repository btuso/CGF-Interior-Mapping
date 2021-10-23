const Input = new InputSystem(window, INPUT_MAP);

const TARGET_FPS = 60;

(async () => {
    let killswitch = 0;
    let previousFrameStart = timeInMilis();
    while (true && killswitch < 100) {
        let currentFrameStart = timeInMilis();
        const delta = currentFrameStart - previousFrameStart;
        Input.pollInputs();

        console.log('Time between frames is: ' + delta + '  frame #'+ killswitch);
        
        console.log('Mouse movement: ' + Input.mouseXMovement() + ', ' + Input.mouseYMovement());

        // FPS cap
        await limitFPS(currentFrameStart, TARGET_FPS);
        
        previousFrameStart = currentFrameStart;
        killswitch++;
    }
    console.log('Done')
    

})();

function timeInMilis() {
    return new Date().getTime();
}

// Ensure FPS are capped at #targetFPS to prevent CPU hogging
async function limitFPS(frameStart, targetFPS) {
    const timeUpToNow = timeInMilis() - frameStart;
    const idle = (1000 / targetFPS) - timeUpToNow;
    await sleep(idle);
};

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
};