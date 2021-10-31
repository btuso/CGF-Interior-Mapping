
class Game {

    constructor() {
        this.started = false;
    };

    start() {
        const menu = new MenuSystem(document);
        const player = new Player([0,0,0]);
        const building = new Building([0,0,5], [0,0,1], 1, 1);

        this.scene = [ menu, player, building ];
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