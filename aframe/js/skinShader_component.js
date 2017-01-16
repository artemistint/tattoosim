// SKIN SHADER
AFRAME.registerShader('skin', {
    init: function (data) {
        var entity = this;
        var scene = this.el.sceneEl;

        // INIT
        var renderer, uniforms;

        // RENDERER
        scene.addEventListener('render-target-loaded', function () {
            renderer = scene.renderer;
            renderer.autoClear = false;

            renderer.gammaInput = true;
            renderer.gammaOutput = true;

            var effectBeckmann = new THREE.ShaderPass( THREE.ShaderSkin[ "beckmann" ] );
            var effectCopy = new THREE.ShaderPass( THREE.CopyShader );

            var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
            var rtwidth = 512, rtheight = 512;

            composerBeckmann = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );
            composerBeckmann.addPass( effectBeckmann );
            composerBeckmann.addPass( effectCopy );

            // UPDATE UNIFORM
            composerBeckmann.render();
            uniforms[ "tBeckmann" ].value = composerBeckmann.renderTarget1.texture;
        });

        // TEXTURE
        var textureLoader = new THREE.TextureLoader();

        var mapHeight = textureLoader.load( "human_models/female/spec.jpg" );

        mapHeight.anisotropy = 4;
        mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping;
        mapHeight.format = THREE.RGBFormat;

        var mapSpecular = mapHeight;

        mapSpecular.anisotropy = 4;
        mapSpecular.wrapS = mapSpecular.wrapT = THREE.RepeatWrapping;
        mapSpecular.format = THREE.RGBFormat;

        var mapColor = textureLoader.load( "human_models/female/color.jpg" );

        mapColor.anisotropy = 4;
        mapColor.wrapS = mapColor.wrapT = THREE.RepeatWrapping;
        mapColor.format = THREE.RGBFormat;

        var shader = THREE.ShaderSkin[ "skinSimple" ];

        var fragmentShader = shader.fragmentShader;
        var vertexShader = shader.vertexShader;

        // UNIFORMS
        uniforms = THREE.UniformsUtils.clone( shader.uniforms );

        uniforms[ "enableBump" ].value = true;
        uniforms[ "enableSpecular" ].value = true;

        uniforms[ "tDiffuse" ].value = mapColor;

        uniforms[ "bumpMap" ].value = mapHeight;
        uniforms[ "specularMap" ].value = mapSpecular;

        uniforms[ "diffuse" ].value.setHex( 0xffffff );
        uniforms[ "specular" ].value.setHex( 0xffffff );

        uniforms[ "uRoughness" ].value = 0.25;
        uniforms[ "uSpecularBrightness" ].value = 2.0;

        uniforms[ "bumpScale" ].value = -0.001;

        // MATERIAL
        var material = new THREE.ShaderMaterial( { fragmentShader: fragmentShader, vertexShader: vertexShader, uniforms: uniforms, lights: true } );
        material.extensions.derivatives = true;
        entity.material = material;
    }
});