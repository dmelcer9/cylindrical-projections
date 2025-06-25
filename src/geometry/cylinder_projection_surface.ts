import {ProjectionSurface} from "./projection_surface";
import {UniformBuffer, Vector3} from "@babylonjs/core";
import CylinderVariable = CylinderProjectionSurface.CylinderVariable;


export class CylinderProjectionSurface extends ProjectionSurface {

    private cylinder_radius: number;
    private cylinder_height: number;
    private center_position: Vector3;
    private cylinder_extrude_direction: Vector3;
    private id: number;

    constructor(cylinder_radius: number, cylinder_height: number, center_position: Vector3, cylinder_extrude_direction: Vector3, id: number) {
        super();
        this.cylinder_radius = cylinder_radius;
        this.cylinder_height = cylinder_height;
        this.center_position = center_position;
        this.cylinder_extrude_direction = cylinder_extrude_direction;
        this.id = id;
    }

    getUniformName(variable: CylinderProjectionSurface.CylinderVariable): string {
        switch (variable) {
            case CylinderVariable.Center:
                return `sphereCenter${this.id}`;
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
            ubo: [],
            decls: ''
        };
    }

    updateUniformBuffer(uniformBuffer: UniformBuffer) {
    }

    getCylinder(): string {
        return `Cylinder(${this.getUniformName(CylinderProjectionSurface.CylinderVariable.Center)},
                         ${this.getUniformName(CylinderProjectionSurface.CylinderVariable.Axis)},
                         ${this.getUniformName(CylinderProjectionSurface.CylinderVariable.Radius)})`
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


export namespace CylinderProjectionSurface {
    export enum CylinderVariable {
        Center,
        Axis,
        Radius,
        Height
    }
}