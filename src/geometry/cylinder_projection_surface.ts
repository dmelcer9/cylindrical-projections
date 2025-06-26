import {ProjectionSurface} from "./projection_surface";
import {Material, Mesh, MeshBuilder, Scene, StandardMaterial, UniformBuffer, Vector3} from "@babylonjs/core";
import {GeometryManager} from "./geometry_manager";
import {ProjectionSurfacePlugin} from "../shader_plugins/projection_surface_plugin";

enum CylinderVariable {
    Center,
    Axis,
    Radius,
    Height
}

export class CylinderProjectionSurface extends ProjectionSurface {
    static CylinderVariable = CylinderVariable;

    private cylinder_radius: number;
    private cylinder_height: number;
    private center_position: Vector3;
    private cylinder_extrude_direction: Vector3;
    private id: number;

    private mesh: Mesh;
    private material: Material;
    private plugin: ProjectionSurfacePlugin


    constructor(manager: GeometryManager, scene: Scene, cylinder_radius: number, cylinder_height: number, center_position: Vector3, cylinder_extrude_direction: Vector3) {
        super();


        this.cylinder_extrude_direction = cylinder_extrude_direction.normalizeToNew();
        this.cylinder_radius = cylinder_radius;
        this.cylinder_height = cylinder_height;
        this.center_position = center_position;
        this.cylinder_extrude_direction = cylinder_extrude_direction;

        const cyl_extrude_direction_half_height = cylinder_extrude_direction.clone().normalizeFromLength(cylinder_height / 2);
        this.mesh = MeshBuilder.CreateTube("cylinder", {
            path: [
                center_position.subtract(cyl_extrude_direction_half_height),
                center_position.add(cyl_extrude_direction_half_height)
            ],
            radius: cylinder_radius,
            tessellation: 48,
            sideOrientation: Mesh.DOUBLESIDE
        }, scene);

        this.mesh.hasVertexAlpha = true;

        this.material = new StandardMaterial("CylinderMaterial", scene);
        this.plugin = new ProjectionSurfacePlugin(this.material, manager, this);
        this.id = manager.add(this);
    }

    getUniformName(variable: CylinderVariable): string {
        switch (variable) {
            case CylinderVariable.Center:
                return `cylinderCenter${this.id}`;
            case CylinderVariable.Axis:
                return `cylinderAxis${this.id}`;
            case CylinderVariable.Radius:
                return `cylinderRadius${this.id}`;
            case CylinderVariable.Height:
                return `cylinderHeight${this.id}`;
        }
    }

    setID(id: number) {
        this.id = id;
    }

    getIntersectionDistFromRay(): string {
        return `
         
        `;
    }

    getUniforms(): { ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>; decls: string } {
        return {
            ubo: [{
                name: this.getUniformName(CylinderVariable.Center), size: 3, type: 'vec3'
            },
                {
                    name: this.getUniformName(CylinderVariable.Axis), size: 3, type: 'vec3'
                },
                {
                    name: this.getUniformName(CylinderVariable.Radius), size: 1, type: 'float'
                },
                {
                    name: this.getUniformName(CylinderVariable.Height), size: 1, type: 'float'
                }],
            decls: `
uniform vec3 ${this.getUniformName(CylinderVariable.Center)};
uniform vec3 ${this.getUniformName(CylinderVariable.Axis)};
uniform float ${this.getUniformName(CylinderVariable.Radius)};
uniform float ${this.getUniformName(CylinderVariable.Height)};
            `
        };
    }

    updateUniformBuffer(uniformBuffer: UniformBuffer) {
        uniformBuffer.updateVector3(this.getUniformName(CylinderVariable.Center), this.center_position);
        uniformBuffer.updateVector3(this.getUniformName(CylinderVariable.Axis), this.cylinder_extrude_direction);
        uniformBuffer.updateFloat(this.getUniformName(CylinderVariable.Radius), this.cylinder_radius);
        uniformBuffer.updateFloat(this.getUniformName(CylinderVariable.Height), this.cylinder_height);
    }

    getCylinder(): string {
        const {CylinderVariable} = CylinderProjectionSurface;
        return `Cylinder(${this.getUniformName(CylinderVariable.Center)},
                         ${this.getUniformName(CylinderVariable.Axis)},
                         ${this.getUniformName(CylinderVariable.Radius)})`
    }

    uvToPosition3D(uvName: string, positionName: string): string {
        // language=glsl
        return `
            float radians_around_${this.id} = -(${uvName}.x * 2.0 * pi);
            vec3 ${positionName} = vec3(sin(radians_around_${this.id}) * ${this.getUniformName(CylinderVariable.Radius)},
            (${uvName}.y * ${this.getUniformName(CylinderVariable.Height)}) - (${this.getUniformName(CylinderVariable.Height)}/2.0),
            -cos(radians_around_${this.id}) * ${this.getUniformName(CylinderVariable.Radius)})
            + ${this.getUniformName(CylinderVariable.Center)};
        `
    }
}



