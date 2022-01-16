
class InteriorShader {

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
        this.buildingDimensionsUniform = gl.getUniformLocation( this.program, 'buildingDimensions');
        
		this.vertexPostion = gl.getAttribLocation( this.program, 'vertexPosition' );
		this.vertexBuffer = gl.createBuffer();
        this.initialized = true;
        this.textureTest();
    };

    textureTest() {
        // Create a texture.
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // Fill the texture with a 1x1 blue pixel.
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        
        // Asynchronously load an image
        var image = new Image();
        image.crossOrigin = "";
        
        //image.src = "https://btuso.com/bws.jpg";
        //image.src = "resources/textures/ColorGrid.png";
         image.src = 'https://i.imgur.com/vLppl5m.png'; // Color Grid
        //image.src = 'https://i.imgur.com/dIu5T25.jpg';
        
        
        let gl = this.gl;
        image.addEventListener('load', function() {
            console.log('IMAGE LOADEDDDDDDDDDD  ' + image)
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
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

        // Interior Mapping
        varying vec3 vertexGlobalCoord;
        uniform vec3 globalCameraPos; 
        uniform vec3 buildingDirection;
        uniform vec3 buildingDimensions;
        
        uniform sampler2D u_texture;

        void main()
        {		
        
            float floorHeight = 1.0;
            float floorWidth = 1.0;
            float floorDepth = 1.0;
            
            vec3 cameraDir = normalize(vertexGlobalCoord - globalCameraPos);


            // ----------------- Y plane

            vec3 horizontalColor = vec3(1, 0, 0); // debug color
            float floorOffset = 0.0;
            if (cameraDir.y <= 0.0) {
                // If we're looking downwards then we're looking at the floor, not the ceiling
                floorOffset = 1.0;
                horizontalColor = vec3(0, 0, 1); // debug color
            }
            
            // If it's the top floor and we're looking downwards, don't show the floor
            if (distance(buildingDimensions.y, vertexGlobalCoord.y) < 0.0001) {
                floorOffset += 1.0;
            }

            // multiply by 1.00001 to get rid of precision errors from interpolation
            float floor = ceil((vertexGlobalCoord.y * 1.00001) / floorHeight) - floorOffset;
            vec3 pointInHorizontalPlane = vec3(0.0, floor * floorHeight, 0.0);
            vec3 floorNormal = vec3(0.0, 1.0, 0.0);
            float horizontalPlaneDistance = dot(pointInHorizontalPlane - globalCameraPos, floorNormal) / dot(cameraDir, floorNormal);

            // ----------------- X plane

            vec3 xWallColor = vec3(0, 1, 0); // debug color
            float xWallOffset = 0.0;
            
            if (cameraDir.x <= 0.0) {
                // If we're looking leftwards then we're looking at the left wall, not the right wall
                xWallOffset = 1.0;
                xWallColor = vec3(0, 1, 1); // debug color
            }

            // If it's the eastern wall and we're looking to the right, don't show the wall
            if (distance(0.0, vertexGlobalCoord.x) < 0.0001 && cameraDir.x >= 0.0) {
                xWallOffset -= 1.0;
            } else if (distance(buildingDimensions.x, vertexGlobalCoord.x) < 0.0001 && cameraDir.x <= 0.0) { // the other case
                xWallOffset += 1.0;
            }
    
            // multiply by 1.00001 to get rid of precision errors from interpolation
            float currentXWall = ceil((vertexGlobalCoord.x * 1.00001) / floorWidth) - xWallOffset;        
            vec3 pointInXWallPlane = vec3(currentXWall * floorWidth, 0.0, 0.0);
            vec3 xWallNormal = vec3(-1.0, 0.0, 0.0); // TODO esto es lo que hay que cambiar por building direction?
            float xWallDistance = dot(pointInXWallPlane - globalCameraPos, xWallNormal) / dot(cameraDir, xWallNormal);  
     
            // ----------------- Z plane


            vec3 zWallColor = vec3(1, 1, 0); // debug color
            float zWallOffset = 0.0;
            if (cameraDir.z <= 0.0) {
                zWallOffset = 1.0;
                zWallColor = vec3(1, 0, 1); // debug color
            }
            
            // If it's the northern wall and we're looking south, don't show the wall
            if (distance(buildingDimensions.z, vertexGlobalCoord.z) < 0.0001 && cameraDir.z <= 0.0) {
                zWallOffset += 1.0;
            } else if (distance(0.0, vertexGlobalCoord.z) < 0.0001 && cameraDir.z >= 0.0) { // the other case
                zWallOffset -= 1.0;
            }
    
            // multiply by 1.00001 to get rid of precision errors from interpolation
            float currentZWall = ceil((vertexGlobalCoord.z * 1.00001) / floorDepth) - zWallOffset;        
            vec3 pointInZWallPlane = vec3(0.0, 0.0, currentZWall * floorDepth);
            vec3 zWallNormal = vec3(0, 0.0, -1.0); // TODO esto es lo que hay que cambiar por building direction?
            float zWallDistance = dot(pointInZWallPlane - globalCameraPos, zWallNormal) / dot(cameraDir, zWallNormal);  
     

            float closestIntersection = min(horizontalPlaneDistance, min(xWallDistance, zWallDistance));

            if (closestIntersection == xWallDistance) {
                gl_FragColor = vec4(xWallColor, 1);
                //gl_FragColor = texture2D(u_texture, vec2(vertexGlobalCoord.x, vertexGlobalCoord.y));
            } else if (closestIntersection == zWallDistance) {
                gl_FragColor = vec4(zWallColor, 1);
            } else {
                //gl_FragColor = vec4(horizontalColor, 1);
                //gl_FragColor = texture2D(u_texture, vec2(vertexGlobalCoord.x, vertexGlobalCoord.y));


                //gl_FragColor = vec4(abs(distance(vertexGlobalCoord, globalCameraPos) - horizontalPlaneDistance) / floorDepth, 0.0, 0.0, 1.0);
                float distance = abs(distance(vertexGlobalCoord, globalCameraPos) - horizontalPlaneDistance) / floorDepth;

                vec3 pointInPlane = cameraDir * horizontalPlaneDistance;
                //gl_FragColor = vec4(abs(pointInPlane.z - vertexGlobalCoord.z), 0.0, 0.0, 1.0);
                gl_FragColor = vec4(abs(vertexGlobalCoord.z) - 1.5, 0.0, 0.0, 1.0);

            }
             
            
            
        }
    `; 
}
