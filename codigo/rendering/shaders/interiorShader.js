
class InteriorShader {

    constructor() {
        // WebGl is not yet loaded when the shader objects are created
        // they will be initialized later
        this.initialized = false;
        this.gl = null; 
        this.randomSeed =  Math.floor(Math.random() * 7) + 1; // random between 1 and 7 inclusive
    };

    init(gl) {
        if (this.initialized)
            throw Error('Shader is already initialized');

        this.gl = gl;
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, this._VertexShader);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, this._FragmentShader);
        this.program = createProgram(gl, vertexShader, fragmentShader);
        
        // create buffers and uniforms
        this.mvpUniform = gl.getUniformLocation(this.program, 'mvp' );
        this.worldTransformUniform = gl.getUniformLocation(this.program, 'worldTransform' );
        this.globalCameraPosUniform = gl.getUniformLocation( this.program, 'globalCameraPos');
        this.buildingDirectionUniform = gl.getUniformLocation( this.program, 'buildingDirection');
        this.buildingDimensionsUniform = gl.getUniformLocation( this.program, 'buildingDimensions');
        this.roomVariationsUniform = gl.getUniformLocation( this.program, 'roomVariations');
        this.randomSeedUniform = gl.getUniformLocation( this.program, 'randomSeed');
        
		this.vertexPostion = gl.getAttribLocation( this.program, 'vertexPosition' );
		this.vertexBuffer = gl.createBuffer();
        this.loadTextures();
        this.initialized = true;
    };

    loadTextures() {
        const texture = Textures.INTERIOR_COMBINED;
        this.roomVariations = texture.height / 1024; // Each individual room texture's height is 1024 
        
        var glTexture = this.gl.createTexture();
        // Fill the texture with a 1x1 blue pixel in case image loading fails.
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        // Load the proper image texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    setData(objectData) {
        const vertices = objectData.vertices;
        this.numberOfVertices = vertices.length / 3;
        // update the buffers        
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.buildingDirectionVector = objectData.direction;
        this.buildingDimensionsVector = objectData.dimensions;
        this.worldTransformMatrix =  [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            objectData.position[0], objectData.position[1], objectData.position[2], 1
        ];
    
    };

    setCamera(camera){
        const { yaw, pitch } = camera.getRotation();
        const [ translationX, translationY, translationZ ] = camera.getPosition();

        var yCos = Math.cos(-1 * yaw);
        var ySin = Math.sin(-1 * yaw);
        var yawTransform = [ // Column major
            yCos,  0, -1*ySin, 0,
              0 ,  1,    0   , 0,
            ySin,  0,   yCos , 0,
              0 ,  0,    0   , 1
        ];
    
        var pCos = Math.cos(pitch);
        var pSin = Math.sin(pitch);
        var pitchTransform = [ // Column major
            1,    0   ,  0  , 0,
            0,   pCos , pSin, 0,
            0, -1*pSin, pCos, 0,
            0,    0   ,  0  , 1
        ];	
        // obtiene la coordenada en espacio local pra una coordenada en espacio global, "para donde queda esta coordenada"
        var rotForObject = MatrixMult(pitchTransform, yawTransform);
        
        var translationTransform = [ // Column major
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -translationX, -translationY, translationZ, 1
        ];
        
        var mv = MatrixMult(rotForObject, translationTransform);
        
        const { width, height } = Render.getScreenSize();
        var projectionMatrix = this._ComputeProjectionMatrix(width, height, translationZ);

        this.mvpMatrix = MatrixMult( projectionMatrix, mv);
        this.globalCameraPosVector = [translationX, translationY, translationZ];
    };

    _ComputeProjectionMatrix( width, height, zDistance, fov_angle=40 )
    {
        var r = width / height;
        var n = (zDistance - VIEW_DISTANCE);
        const min_n = 0.001;
        if ( n < min_n ) n = min_n;
        var f = (zDistance + VIEW_DISTANCE);;
        var fov = 3.145 * fov_angle / 180;
        var s = 1 / Math.tan( fov/2 );
        return [
            s/r, 0, 0           , 0,
            0  , s, 0           , 0,
            0  , 0, (n+f)/(f-n) , 1,
            0  , 0, -2*n*f/(f-n), 0
        ];
    }

    draw() {
		this.gl.useProgram( this.program );		

        this.gl.uniformMatrix4fv( this.mvpUniform, false, this.mvpMatrix );
        this.gl.uniformMatrix4fv(this.worldTransformUniform, false, this.worldTransformMatrix);
        this.gl.uniform3fv(this.globalCameraPosUniform, this.globalCameraPosVector);
        this.gl.uniform3fv(this.buildingDirectionUniform, this.buildingDirectionVector);        
        this.gl.uniform3fv(this.buildingDimensionsUniform, this.buildingDimensionsVector);       
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertexBuffer );
		this.gl.enableVertexAttribArray( this.vertexPostion );
		this.gl.vertexAttribPointer( this.vertexPostion, 3, this.gl.FLOAT, false, 0, 0 ); 
        this.gl.uniform1f(this.roomVariationsUniform, this.roomVariations);
        this.gl.uniform1f(this.randomSeedUniform, this.randomSeed);

		this.gl.drawArrays( this.gl.TRIANGLES, 0, this.numberOfVertices);
    };

    _VertexShader = `
        attribute vec3 vertexPosition;

        uniform mat4 mvp;
        uniform mat4 worldTransform;

        varying vec3 vertexGlobalCoord;

        void main()
        { 
            vertexGlobalCoord = vec3(worldTransform * vec4(vertexPosition,1));
            gl_Position = mvp * vec4(vertexGlobalCoord.x, vertexGlobalCoord.y, -vertexGlobalCoord.z,1);
        }
    `;

    _FragmentShader = `
        precision highp float;

        // Interior Mapping
        varying vec3 vertexGlobalCoord;
        uniform vec3 globalCameraPos; 
        uniform vec3 buildingDirection;
        uniform vec3 buildingDimensions;

        // texturing
        uniform float roomVariations;
        uniform float randomSeed;
        
        uniform sampler2D u_texture;

        // Returns true when looking to the "other side" of an axis
        bool isAlternateWall(float cameraDirection) {
            return cameraDirection <= 0.0;
        }

        // Returns the plane index for a vertex 
        float planeForVertex(float vertexPos, float planeSpacing) {
           // multiply by 1.00001 to get rid of precision errors from interpolation
           return ceil((vertexPos * 1.00001) / planeSpacing); 
        }

        // Returns the offset from the current wall to the interior of the building. 
        // i.e. will return 1 or -1 when the vertex is in an external wall
        float calculateEdgeWallOffset(float cameraDirection, float vertexPos, float buildingSize) {
            float edgeWallOffset = 0.0;
            if (distance(0.0, vertexPos) < 0.0001 && !(isAlternateWall(cameraDirection))) {
                edgeWallOffset -= 1.0;
            } else if (distance(buildingSize, vertexPos) < 0.0001 && isAlternateWall(cameraDirection)) {
                edgeWallOffset += 1.0;
            }
            return edgeWallOffset;
        }

        // Returns the raycasted distance from the camera to an imaginary plane inside the object
        float distanceToPlane(vec3 globalCameraPos, float cameraDirection, float vertexPos, float buildingSize, float planeSpacing, vec3 planeNormal) 
        {
            float planeOffset = 0.0;   
            if (isAlternateWall(cameraDirection)) {
                // Offset the plane depending on the camera's view direction. 
                // i.e. If we're looking leftwards then we're looking at the left wall, not the right wall
                planeOffset = 1.0;
            }

            // Hide edge walls by offseting the plane
            float edgeWallOffset = calculateEdgeWallOffset(cameraDirection, vertexPos, buildingSize);
            float currentPlane = planeForVertex(vertexPos, planeSpacing);
            float pointInPlane = (currentPlane - planeOffset - edgeWallOffset) * planeSpacing;
            return dot(pointInPlane - globalCameraPos, planeNormal) / cameraDirection;
        }

        void main()
        {		
            // TODO this should be a uniform
            float roomHeight = 1.0;
            float roomWidth = 1.0;
            float roomDepth = 1.0;
            
            vec3 cameraDir = normalize(vertexGlobalCoord - globalCameraPos);

            vec3 floorNormal = vec3(0.0, 1.0, 0.0);
            vec3 xWallNormal = vec3(1.0, 0.0, 0.0);
            vec3 zWallNormal = vec3(0, 0.0, 1.0);

            float yWallDistance = distanceToPlane(globalCameraPos, cameraDir.y, vertexGlobalCoord.y, buildingDimensions.y, roomHeight, floorNormal);
            float xWallDistance = distanceToPlane(globalCameraPos, cameraDir.x, vertexGlobalCoord.x, buildingDimensions.x, roomWidth, xWallNormal);
            float zWallDistance = distanceToPlane(globalCameraPos, cameraDir.z, vertexGlobalCoord.z, buildingDimensions.z, roomDepth, zWallNormal);

            float closestIntersection = min(yWallDistance, min(xWallDistance, zWallDistance));
           
            // Get walls and offsets to calculate which room we're rendering
            float yWall = planeForVertex(vertexGlobalCoord.y, roomHeight);
            float xWall = planeForVertex(vertexGlobalCoord.x, roomWidth);
            float zWall = planeForVertex(vertexGlobalCoord.z, roomDepth);
            float yEdgeOffset = calculateEdgeWallOffset(cameraDir.y, vertexGlobalCoord.y, buildingDimensions.y); 
            float xEdgeOffset = calculateEdgeWallOffset(cameraDir.x, vertexGlobalCoord.x, buildingDimensions.x); 
            float zEdgeOffset = calculateEdgeWallOffset(cameraDir.z, vertexGlobalCoord.z, buildingDimensions.z); 
            // Rooms in the corners receive the same hash
            float roomHash = ((yWall - yEdgeOffset) * 3.0) + ((zWall  + xWall - xEdgeOffset - zEdgeOffset) * 7.0);
            float roomRandom = ceil(roomHash / randomSeed);
            float yVal = 0.0;
            float xVal = 0.0;

            // Calculate which texture to show, depending on the closest wall (the one being rendered)
            if (closestIntersection == xWallDistance) {
                yVal = -mod((cameraDir.y * closestIntersection) + globalCameraPos.y, 1.0); 
                xVal = mod((cameraDir.z * closestIntersection) + globalCameraPos.z, 1.0); 

                xVal = (xVal / 4.0) + 0.25;
                yVal = (((yVal - float(isAlternateWall(cameraDir.x))) / 2.0) + roomRandom) / roomVariations;
            } else if (closestIntersection == zWallDistance) {
                yVal = -mod((cameraDir.y * closestIntersection) + globalCameraPos.y, 1.0); 
                xVal = mod((cameraDir.x * closestIntersection) + globalCameraPos.x, 1.0); 

                xVal = (xVal / 4.0);
                yVal = (((yVal - float(isAlternateWall(cameraDir.z))) / 2.0) + roomRandom) / roomVariations;
            } else {
                yVal = -mod((cameraDir.x * closestIntersection) + globalCameraPos.x, 1.0); 
                xVal = mod((cameraDir.z * closestIntersection) + globalCameraPos.z, 1.0); 

                xVal = (xVal / 4.0) + 0.5;
                yVal = (((yVal - float(isAlternateWall(cameraDir.y))) / 2.0) + roomRandom) / roomVariations;
            }

            gl_FragColor = texture2D(u_texture, vec2(xVal, yVal));
        }
    `; 
}
