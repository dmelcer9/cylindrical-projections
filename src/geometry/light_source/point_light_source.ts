import {LightSource} from "./light_source";
import {
    Color3,
    GizmoManager,
    IAxisDragGizmo,
    Mesh,
    Scene,
    ShaderMaterial,
    StandardMaterial,
    UniformBuffer
} from "@babylonjs/core";
import {GeometryManager} from "../geometry_manager";

export class PointLightSource extends LightSource {
    private point: Mesh;
    private gizmo_manager: GizmoManager;

    constructor(scene: Scene, geometry_manager: GeometryManager) {
        super();

        this.point = Mesh.CreateSphere("point", 16, 0.1, scene);

        const material = new StandardMaterial("point_material", scene);
        material.emissiveColor = Color3.Yellow();
        this.point.material = material;

        this.gizmo_manager = new GizmoManager(scene);
        this.gizmo_manager.positionGizmoEnabled = false;
        this.gizmo_manager.attachToMesh(this.point);
        this.gizmo_manager.attachableMeshes = [];


        const update_position_on_drag = (axis: IAxisDragGizmo) => axis.dragBehavior.onDragObservable.add(() => geometry_manager.updateUniforms())
        const pos_gizmo = this.gizmo_manager.gizmos.positionGizmo;

        if (pos_gizmo) {
            update_position_on_drag(pos_gizmo.xGizmo);
            update_position_on_drag(pos_gizmo.yGizmo);
            update_position_on_drag(pos_gizmo.zGizmo);
        }
    }

    setGizmoEnabled(enabled: boolean): void {
        this.gizmo_manager.positionGizmoEnabled = enabled;
    }

    getShaderCode(): string {
        return `
vec3 getLightSource(vec3 pos_of_target){
    return light_source_position;
}
`;
    }

    getUniforms(): {
        decls: string;
        ubo: { arraySize?: number | undefined; name: string; size?: number | undefined; type?: string | undefined }[]
    } {
        return {
            ubo: [{
                "name": "light_source_position",
                size: 3,
                type: 'vec3'
            }],
            decls: "uniform vec3 light_source_position;"
        };
    }

    setPropertiesOfShaderMaterial(shaderMaterial: ShaderMaterial): void {

        shaderMaterial.setVector3("light_source_position", this.point.position);

    }

    updateUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.updateVector3("light_source_position", this.point.position);
    }
}