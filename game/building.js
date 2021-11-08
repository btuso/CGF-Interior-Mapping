class Building {

    constructor(position, direction, width, height, depth) {
        this.position = position;
        this.direction = direction;
        this._createBuilding(width, height, depth);
    };

    _createBuilding(width, height, depth) {
        const vertices = [
            [width, height,     0], 
            [width,      0,     0], 
            [width, height, depth], 
            [width,      0, depth], 
            [    0, height,     0], 
            [    0,      0,     0], 
            [    0, height, depth], 
            [    0,      0, depth], 
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
        return Shaders.INTERIOR;
    };

    getShaderData() {
        return { 
            vertices: this.vertexPositions, 
            direction: this.direction,
            position: this.position,
        };
    };
}