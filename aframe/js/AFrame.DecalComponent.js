// Decal Component
AFRAME.registerComponent('decal', {
    dependencies: [],
    schema: { 
        scale: {default: 0.125},
        rotation: {default: 0}
    },
    
    init: function () {
        
        window.parent.addEventListener("MyEventType", function(evt) {
            // IMAGE
            var image = document.createElement( 'img' );
            var texture = new THREE.Texture( image );
            image.onload = function()  {
                    texture.needsUpdate = true;
                    console.log("Loaded!");
                    uniforms.map = { type: "t", value: texture};
                    uniforms.shaderSwitch = { type: "i", value: shaderSwitch };
                    helperMaterial.map = texture;
                };
            
            var imageType = evt.detail.name.split(".").pop();
            
            var shaderSwitch = false;
            if (imageType === 'png'){
                var shaderSwitch = true;
            }
            
            if (evt.detail) {
                var reader = new FileReader();
                
                reader.onload = function (e) {
                    image.src = e.target.result;
                };
                
                reader.readAsDataURL(evt.detail);
            }
        });
        
        // Variables
        var mesh, ray_entity;
        var decals = [];
        var decalHelper, mouseHelper;
        var p = new THREE.Vector3( 0, 0, 0 );
        var r = new THREE.Vector3( 0, 0, 0 );
        var s = new THREE.Vector3( 1, 1, 1 );
        var up = new THREE.Vector3( 0, 1, 0 );
        var check = new THREE.Vector3( 1, 1, 1 );
        var container = this.el;
        var aframe_scene = container.sceneEl;
        
        var params = this.params = {
            scale: this.data.scale,
            rotation: this.data.rotation,
            rotate: true
        };
        
        // Loaders
        var manager = new THREE.LoadingManager();
        var loader = new THREE.TextureLoader(manager);
        
        /*// Decal Material
        var decalMaterial = this.decalMaterial = new THREE.MeshPhongMaterial( { 
            specular: 0x3e444c,
            color: 0x000000,
            normalMap: loader.load( 'img/skin_normal.jpg' ),
            normalScale: new THREE.Vector2( 2.5, 2.5 ),
            depthTest: true, 
            depthWrite: false, 
            polygonOffset: true,
            polygonOffsetFactor: -4
        });
        
        // NORMAL MATERIAL
        decalMaterial = new THREE.MeshNormalMaterial( { 
            transparent: true, 
            depthTest: true, 
            depthWrite: false, 
            polygonOffset: true,
            polygonOffsetFactor: -4, 
            shading: THREE.SmoothShading
        });*/
        
        // Custom Ink Material
        var vertexShader = THREE.ShaderLib.phong.vertexShader;
        var fragmentShader = getShader();
        var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);

        var defines = {};
        defines[ "USE_MAP" ] = "";
        defines[ "USE_NORMALMAP" ] = "";
        
        var color_map = loader.load( 'img/flower.png' );
        var normal_map = loader.load( 'img/skin_normal.jpg' );
        
        uniforms.specular = { type: "c", value: new THREE.Color( 0x3e444c )};
        uniforms.shininess = { type: "f", value: 10 };
        uniforms.map = { type: "t", value: color_map};
        uniforms.normalMap = { type: "t", value: normal_map};
        uniforms.normalScale = { type: "v2", value: new THREE.Vector2( 0.5, 0.5 )};
        uniforms.shaderSwitch = { type: "i", value: 1 };
        
        var decalMaterial = new THREE.ShaderMaterial( {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            defines: defines,
            lights: true,
            fog: false,
            transparent: true,
            depthTest: true, 
            depthWrite: false, 
            polygonOffset: true,
            polygonOffsetFactor: -4
        } );
        
        decalMaterial.extensions.derivatives = true;
        
        // Intersection
        var intersection = {
            point: new THREE.Vector3(),
            normal: new THREE.Vector3()
        };
        
        // Mouse Helper
        var helperMaterial = new THREE.MeshBasicMaterial( { 
            map: color_map,
            depthTest: true, 
            depthWrite: false, 
            polygonOffset: true,
            polygonOffsetFactor: -1000
        });
          
        var scene = this.el.sceneEl.object3D;
        mouseHelper = this.mouseHelper = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), helperMaterial );
        var help_mat = mouseHelper.material;
        help_mat.transparent = true;
        help_mat.opacity = 0.5;
        
        var helper_entity = document.createElement('a-entity');
        helper_entity.setAttribute('id', 'decal');
        helper_entity.setObject3D('mesh', mouseHelper);
        container.appendChild(helper_entity);
        
        var raycaster = document.getElementById("raycaster_add");
        raycaster.addEventListener('raycaster-intersection', function (evt) {
            // Mesh
            ray_entity = evt.detail.els[0];
            var ray_entity_group = ray_entity.object3D;
            var ray_entity_group_pos = ray_entity_group.position;
            ray_entity_group.updateMatrixWorld();
            // Position
            var p = evt.detail.intersections[0].point;
            intersection.point.copy( p );
            p = ray_entity_group.worldToLocal(p);
            p.add(ray_entity_group_pos);
            mouseHelper.position.copy( p );
            // Normal
            var n = evt.detail.intersections[0].face.normal.clone();
            n.add( p );
            mouseHelper.lookAt( n );
            mouseHelper.rotation.z = params.rotation * (Math.PI / 180);
            intersection.normal.copy( evt.detail.intersections[0].face.normal );
        });
        
        // Decal Button
        var button = window.parent.$('#add')[0];
        button.addEventListener('click', addDecal);
        
        function addDecal() {
            mesh = ray_entity.getObject3D('mesh');
            
            if (mesh.type === 'Group') {
                mesh = mesh.children[0];
            }
            
            if (mesh.geometry.type === 'BufferGeometry') {
                mesh.geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );
            }
            
            p = intersection.point;
            var ray_entity_group = ray_entity.object3D;
            var ray_entity_group_pos = ray_entity_group.position;
            ray_entity_group.updateMatrixWorld();
            p = ray_entity_group.worldToLocal(p);

            r.copy( mouseHelper.rotation );
            
            var scale = params.scale;
            s.set( scale, scale, scale );
            
            var m = new THREE.Mesh( new THREE.DecalGeometry( mesh, p, r, s, check ), decalMaterial );
            m.position.add(ray_entity_group_pos);
            var entity = document.createElement('a-entity');
            entity.setAttribute('id', 'decal');
            entity.setObject3D('mesh', m);
            entity.setAttribute('remove', true);
            entity.setAttribute('class', "removable");
            container.parentNode.appendChild(entity);
        };
    },
    
    update: function (oldData) {
        
        // Variables
        var data = this.data;
        var params = this.params;
        params.scale = data.scale;
        params.rotation = data.rotation;
        this.mouseHelper.scale.set( params.scale, params.scale, params.scale );
        this.mouseHelper.rotation.z = params.rotation * (Math.PI / 180);
        
    }
});