const PLAYER_SPEED = 10;

class Player {

    constructor(startingPosition) {
        this.position = startingPosition;
        this.yaw = 0;
        this.pitch = 0;
    };

    update(delta) {
        let speed = delta * PLAYER_SPEED;
		let translationX = 0, translationY = 0, translationZ = 0;
        if (Input.IS_ACCELERATE()){
            speed *= 2.5;
        }
        if (Input.IS_FORWARD()) {
            translationZ -= speed;
        }
        if (Input.IS_BACKWARDS()) {
            translationZ += speed;
        }
        if (Input.IS_STRAFE_LEFT()) {
            translationX -= speed;
        }
        if (Input.IS_STRAFE_RIGHT()) {
            translationX += speed;
        }
        if (Input.IS_ASCEND()) {
            translationY += speed;
        }
        if (Input.IS_DESCEND()) {
            translationY -= speed;
        }

        this._turn(Input.mouseYMovement(), Input.mouseXMovement());
        
        // Move towards where we're looking 

        var yCos = Math.cos(-1 * this.yaw);
        var ySin = Math.sin(-1 * this.yaw);
        var yawTransform = [ // Column major
            yCos,  0, -1*ySin, 0,
              0 ,  1,    0   , 0,
            ySin,  0,   yCos , 0,
              0 ,  0,    0   , 1
        ];
    
        var pCos = Math.cos(this.pitch);
        var pSin = Math.sin(this.pitch);
        var pitchTransform = [ // Column major
            1,    0   ,  0  , 0,
            0,   pCos , pSin, 0,
            0, -1*pSin, pCos, 0,
            0,    0   ,  0  , 1
        ];	
        // obtiene la coordenada en espacio global para una coordenada en espacio local, "hacia donde estoy mirando"
        var rotFromCamera = MatrixMult(yawTransform, pitchTransform);
    
        // First person based movement, we ignore translationY so upwards movement is global instead of camera based
        var globalMovement = [translationX, 0, translationZ, 1];
        var cameraMovement = MatrixVectorMult(rotFromCamera, globalMovement)	
        
        // TODO normalize to avoid compound movement speed
        const xAxisMovement = cameraMovement[0];
        const yAxisMovement = cameraMovement[1] + translationY; // Elevation is based on global axis
        const zAxisMovement = cameraMovement[2];
        this._move(xAxisMovement, yAxisMovement, zAxisMovement);
    };

    _move(xAxisMovement, yAxisMovement, zAxisMovement) {
        this.position[0] += xAxisMovement;
        this.position[1] += yAxisMovement;
        this.position[2] += zAxisMovement;
    };

    _turn(pitch, yaw) {
        this.pitch += pitch;
        this.yaw += yaw;
    };

    getCamera() {
        return this;
    };

    getPosition() {
        return this.position;
    };

    getRotation() {
        return { yaw: this.yaw, pitch: this.pitch };
    };

    shouldBeRendered() {
        return false;
    }
}