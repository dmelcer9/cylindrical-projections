import {
    GizmoManager, IAxisDragGizmo,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene, ShaderMaterial,
    StandardMaterial,
    Texture,
    UniformBuffer, Vector4
} from "@babylonjs/core";
import {InflationPluginMaterial} from "../shader_plugins/vertex_shader";
import {GeometryManager} from "./geometry_manager";

export class Globe {
    private sphere: Mesh;
    private fakeSphereForGizmo: Mesh;
    private gizmoManager: GizmoManager;
    private map_texture: Texture;
    private manager: GeometryManager;

    constructor(scene: Scene, manager: GeometryManager) {
        const map_texture: Texture = new Texture("images/map2.jpg", scene);
        this.sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
        this.sphere.rotationQuaternion = Quaternion.Identity();
        var mat = new StandardMaterial("EarthMaterial", scene);

        map_texture.uScale = -1;
        map_texture.vScale = -1;
        mat.emissiveTexture = map_texture;
        mat.diffuseTexture = map_texture;

        this.map_texture = map_texture;

        this.sphere.material = mat;


        this.fakeSphereForGizmo = MeshBuilder.CreateSphere("fakeSphereForGizmo");
        this.fakeSphereForGizmo.rotationQuaternion = Quaternion.Identity();
        this.fakeSphereForGizmo.isVisible = false;

        this.gizmoManager = new GizmoManager(scene);
        this.gizmoManager.attachToMesh(this.fakeSphereForGizmo);
        this.gizmoManager.attachableMeshes = [];

        const pos_gizmo = this.gizmoManager.gizmos.positionGizmo;
        const update_texture_on_drag = (axis: IAxisDragGizmo) => axis.dragBehavior.onDragObservable.add(() => this.update_texture())
        if (pos_gizmo) {
            update_texture_on_drag(pos_gizmo.xGizmo)
            update_texture_on_drag(pos_gizmo.yGizmo)
            update_texture_on_drag(pos_gizmo.zGizmo)
        }

        const rot_gizmo = this.gizmoManager.gizmos.rotationGizmo;
        if (rot_gizmo) {
            update_texture_on_drag(rot_gizmo?.xGizmo)
            update_texture_on_drag(rot_gizmo?.yGizmo)
            update_texture_on_drag(rot_gizmo?.zGizmo)
        }
        this.manager = manager;
    }

    setGizmoEnabled(enabled: boolean) {
        this.gizmoManager.positionGizmoEnabled = enabled;
        this.gizmoManager.rotationGizmoEnabled = enabled;
    }

    update_texture() {
        this.sphere.position = this.fakeSphereForGizmo.position;
        this.sphere.rotationQuaternion = this.fakeSphereForGizmo.rotationQuaternion ?? Quaternion.Identity();
        this.manager.updateUniforms();

    }

    getUniforms(): { ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>; decls: string } {
        return {
            ubo: [{
                name: "globe_position", size: 3, type: 'vec3'
            },
                {
                    name: "globe_radius", size: 1, type: 'float'
                },
                {
                    name: "globe_rotation_quaternion", size: 4, type: 'vec4'
                },
                {
                    name: "map", size: 1, type: 'sampler2D'
                }
            ],
            decls: `
            uniform vec3 globe_position;
            uniform float globe_radius;
            uniform vec4 globe_rotation_quaternion;
            uniform sampler2D map;`
        };
    }

    updateUniformBuffer(uniformBuffer: UniformBuffer) {
        const sphere_position = this.sphere.position;
        const sphere_rotation = Quaternion.Inverse(this.fakeSphereForGizmo.rotationQuaternion ?? Quaternion.Identity())

        uniformBuffer.updateVector3("globe_position", sphere_position);
        uniformBuffer.updateFloat("globe_radius", 1.0);
        uniformBuffer.updateVector4("globe_rotation_quaternion", sphere_rotation);
        uniformBuffer.setTexture("map", this.map_texture);
    }

    public setPropertiesOfShaderMaterial(material: ShaderMaterial) {
        const sphere_position = this.sphere.position;
        const sphere_rotation = Quaternion.Inverse(this.fakeSphereForGizmo.rotationQuaternion ?? Quaternion.Identity())

        material.setTexture("map", this.map_texture);
        material.setVector3("globe_position", sphere_position);
        material.setFloat("globe_radius", 1.0);
        material.setQuaternion("globe_rotation_quaternion", sphere_rotation);
    }
}