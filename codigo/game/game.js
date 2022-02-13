
class Game {

    constructor() {
        this.started = false;
    };

    start() {
        const menu = new MenuSystem(document);
        const player = new Player([1,2,10]);
        const building = new Building({ position: [0,0,0], direction: [1,0,0], dimensions: [2, 4, 2] });
        const floor = new Building({ position: [-25,-0.1,25], direction: [0,0,1], dimensions: [50, 0.1, 50], shader: Shaders.PLAIN });

        this.scene = [ menu, player, building, floor ];
        
        this.camera = player.getCamera();

        this.started = true;
    };

    update(delta) {
        if (!this.started) 
            return;

        this.scene.forEach(child => child.update(delta));
    };

    getCamera() {
        return this.camera;
    };

    getScene() {
        return this.scene;
    }

}