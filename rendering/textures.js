const Textures = {
    // Textures will be loaded here at runtime
    COLOR_GRID: '../resources/textures/ColorGrid.png', 
};

async function loadTextures() {
    for (let texture of Object.keys(Textures)) {
        const location = Textures[texture];
        const image = new Image();
        image.src = location;
        Textures[texture] = image;
    }
}
