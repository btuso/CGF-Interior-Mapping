const Textures = {
    COLOR_GRID: '../resources/textures/ColorGrid.png',
};

function loadTextures(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!success) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw Error('Shader could not be created');
    }

    return shader;
}
