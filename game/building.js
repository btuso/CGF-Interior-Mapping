class Building {

    constructor(position, direction, width, height) {
        this.position = position;
        this.direction = direction;
        this._createBuilding(position, width, height);
    };

    _createBuilding(position, width, height) {
        const xMiddle = (width / 2);
        const yMiddle = (height / 2)
        const zMiddle = (width / 2);
        
        const vertices = [
            [xMiddle, yMiddle,   -zMiddle + position[2]], 
            [xMiddle, -yMiddle,  -zMiddle + position[2]], 
            [xMiddle, yMiddle,    zMiddle + position[2]], 
            [xMiddle, -yMiddle,   zMiddle + position[2]], 
            [-xMiddle, yMiddle,  -zMiddle + position[2]], 
            [-xMiddle, -yMiddle, -zMiddle + position[2]], 
            [-xMiddle, yMiddle,   zMiddle + position[2]], 
            [-xMiddle, -yMiddle,  zMiddle + position[2]], 
        ];

        const faces = [
            [1, 5, 7],
            [1, 7, 3],
            [4, 3, 7],
            [4, 7, 8],
            [8, 7, 5],
            [8, 5, 6],
            [6, 2, 4],
            [6, 4, 8],
            [2, 1, 3],
            [2, 3, 4],
            [6, 5, 1],
            [6, 1, 2],
        ];

        const triangles = [];
        for (let face of faces) {
            for (let component of face) {
                triangles.push(...vertices[component - 1]);
            }
        }


        this.vertexPositions = triangles;
    };

    update(delta) {
        // Do nothing
    };

    shouldBeRendered() {
        return true;
    };

    getShader() {
        return Shaders.BUILDING;
    };

    getShaderData() {
        return this.vertexPositions;
    };
}