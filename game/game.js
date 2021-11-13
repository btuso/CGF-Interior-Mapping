
class Game {

    constructor() {
        this.started = false;
    };

    start() {
        const menu = new MenuSystem(document);
        const player = new Player([1,2,10]);
        const building = new Building([0,0,0], [1,0,0], [2, 4, 2]);
        const floor = new Building([-25,-0.1,25], [0,0,1], [50, 0.1, 50]);
        floor.getShader = () => Shaders.TEST;

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