import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    Vector4,
    Color4,
    MeshBuilder,
    Mesh,
    Texture,
    StandardMaterial,
    CustomProceduralTexture,
    AxesViewer,
    GizmoManager,
    AxisDragGizmo,
    PlaneRotationGizmo, Quaternion
} from 'babylonjs'
import {createTexture, setTextureOptions, TextureOptions} from "./shader";

var canvas: any = document.getElementById("renderCanvas");
var engine: Engine = new Engine(canvas, true);

const cylinder_radius = 1.01;
const cylinder_height = 5;


function get_tube_path(height: number): Array<Vector3> {
    return [
        new Vector3(0, -height / 2, 0),
        new Vector3(0, height / 2, 0)
    ];
}


function createScene(): Scene {
    var scene: Scene = new Scene(engine);

    var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 50;
    camera.panningSensibility = 0;

    // var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    var map_texture: Texture = new Texture("images/map2.jpg", scene);
    var sphere: Mesh = MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
    sphere.rotationQuaternion = Quaternion.Zero();
    var mat = new StandardMaterial("EarthMaterial", scene);
    map_texture.uScale = -1;
    map_texture.vScale = -1;
    mat.emissiveTexture = map_texture;
    mat.diffuseTexture = map_texture;
    sphere.material = mat;

    const cylinder: Mesh = MeshBuilder.CreateTube("cylinder", {
        path: get_tube_path(cylinder_height),
        radius: cylinder_radius,
        tessellation: 48,
        sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    cylinder.hasVertexAlpha = true;
    const cyl_material = new StandardMaterial("CylinderMaterial", scene);

    function getTextureOptions(): TextureOptions {
        return {
            sphere_position: sphere.position,
            sphere_rotation: Quaternion.Inverse(sphere.rotationQuaternion!),
            projection_origin: Vector3.Zero(),
            cylinder_height: cylinder_height,
            cylinder_radius: cylinder_radius
        };
    }

    const cyl_texture = createTexture(getTextureOptions(), map_texture, scene);
    // cyl_texture.animate = true;
    // cyl_texture.refreshRate = 1;
    // cyl_texture.f
    // cyl_material.wireframe = true;
    cylinder.material = cyl_material;
    cyl_material.emissiveTexture = cyl_texture;
    cyl_material.alpha = 0.5;

    // const axesviewer = new AxesViewer(scene);

    function update_texture() {
        setTextureOptions(cyl_texture, getTextureOptions());
    }

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.attachToMesh(sphere);
    gizmoManager.attachableMeshes = [];

    const pos_gizmo = gizmoManager.gizmos.positionGizmo;
    const update_texture_on_drag = (axis: AxisDragGizmo | PlaneRotationGizmo) => axis.dragBehavior.onDragObservable.add(() => update_texture())
    if (pos_gizmo) {
        update_texture_on_drag(pos_gizmo.xGizmo)
        update_texture_on_drag(pos_gizmo.yGizmo)
        update_texture_on_drag(pos_gizmo.zGizmo)
    }

    const rot_gizmo = gizmoManager.gizmos.rotationGizmo;
    if (rot_gizmo) {
        update_texture_on_drag(rot_gizmo?.xGizmo)
        update_texture_on_drag(rot_gizmo?.yGizmo)
        update_texture_on_drag(rot_gizmo?.zGizmo)
    }

    return scene;
}

var scene: Scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

scene.debugLayer.show()
