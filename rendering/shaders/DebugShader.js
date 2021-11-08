
class DebugShader {

    constructor() {
        // WebGl is not yet loaded when the shader objects are created
        // they will be initialized later
        this.initialized = false;
        this.gl = null; 
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
        
		this.vertexPostion = gl.getAttribLocation( this.program, 'vertexPosition' );
		this.vertexBuffer = gl.createBuffer();
        this.initialized = true;
    };

    setData(objectData) {
        const vertices = objectData.vertices;
        this.numberOfVertices = vertices.length / 3;
        // update the buffers        
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.buildingDirectionVector = objectData.direction;
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
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertexBuffer );
		this.gl.enableVertexAttribArray( this.vertexPostion );
		this.gl.vertexAttribPointer( this.vertexPostion, 3, this.gl.FLOAT, false, 0, 0 ); 

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
            
            // We invert the z coord, since the gl_position points to positive Z for some reason?????
            gl_Position = mvp * vec4(vertexGlobalCoord.x, vertexGlobalCoord.y, -vertexGlobalCoord.z,1);
        }
    `;

    _FragmentShader = `
        precision highp float;

        uniform float height;

        // Interior Mapping
        varying vec3 vertexGlobalCoord;

        uniform vec3 globalCameraPos; 
        uniform vec3 buildingDirection;

        void main()
        {		
        
            float floorHeight = 1.0;
            float floorWidth = 1.0;
            
            vec3 cameraDir = normalize(vertexGlobalCoord - globalCameraPos);


            vec3 horizontalColor = vec3(1, 0, 0); // debug color
            float floorOffset = 0.0;
            if (cameraDir.y <= 0.0) {
                // If we're looking downwards then we're looking at the floor, not the ceiling
                floorOffset = 1.0;
                horizontalColor = vec3(0, 0, 1); // debug color
            }
            
            float floor = ceil((vertexGlobalCoord.y * 1.00001) / floorHeight) - floorOffset;
            vec3 pointInHorizontalPlane = vec3(0.0, floor * floorHeight, 0.0);
            vec3 planeNormal = vec3(0.0, 1.0, 0.0);
            float horizontalPlaneDistance = dot(pointInHorizontalPlane - globalCameraPos, planeNormal) / dot(cameraDir, planeNormal);

            vec3 xWallColor = vec3(0, 1, 0); // debug color
            float wallOffset = 0.0;
            
            if (cameraDir.x <= 0.0) {
                // If we're looking leftwards then we're looking at the left wall, not the right wall
                wallOffset = 1.0;
                xWallColor = vec3(0, 1, 1); // debug color
            }
            

            // multiply by 1.00001 to get rid of precision errors from interpolation
            float currentWall = ceil((vertexGlobalCoord.x * 1.00001) / floorWidth) - wallOffset;
            
            // Make the wall closest to the camera disappear
            if (cameraDir.x > 0.0 && currentWall == 0.0) {
                currentWall = currentWall + 1.0;
            }
            
            vec3 pointInWallPlane = vec3(currentWall * floorWidth, 0.0, 0.0);
            vec3 wallNormal = vec3(-1.0, 0.0, 0.0); // TODO esto es lo que hay que cambiar por building direction?
            float wallDistance = dot(pointInWallPlane - globalCameraPos, wallNormal) / dot(cameraDir, wallNormal);  
     

            

            if (wallDistance < horizontalPlaneDistance) {
                gl_FragColor = vec4(xWallColor, 1);
            } else {
                gl_FragColor = vec4(horizontalColor, 1);
            }
             
            
            
        }
    `; 
}
