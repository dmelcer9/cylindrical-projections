import {ProjectionSurface} from "./projection_surface";
import {UniformBuffer, Vector3} from "@babylonjs/core";

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

    uvToPosition3D(): string {
        return "";
    }
}