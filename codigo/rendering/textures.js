const Textures = {
    // Textures will be loaded here at runtime
    //COLOR_GRID: 'https://i.imgur.com/vLppl5m.png', 
    INTERIOR_1: 'https://i.imgur.com/AbbfOea.jpg',
    INTERIOR_2: 'https://i.imgur.com/RXaV5br.jpg',
    INTERIOR_3: 'https://i.imgur.com/bje9KST.jpg',
    INTERIOR_4: 'https://i.imgur.com/FaCdzNm.jpg',
    INTERIOR_RAW: 'https://i.imgur.com/WLYT9TK.jpg',
    INTERIOR_COMBINED: 'https://i.imgur.com/GWBwdfr.jpg',
};

(async function loadTextures() {
    console.log('Loading Textures')
    for (let texture of Object.keys(Textures)) {
        const location = Textures[texture];
        const image = new Image();
        image.crossOrigin = "";
        image.src = location;
        image.addEventListener('load', function() {
            console.log('Loaded image texture: [' + texture + '] at: [' + location + '].')
        });
        Textures[texture] = image;
    }
})();
