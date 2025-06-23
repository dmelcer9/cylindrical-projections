import {ProjectionSurface} from "./projection_surface";
import {Mesh, Plane, UniformBuffer, Vector3} from "@babylonjs/core";

export class CylinderProjectionSurface extends ProjectionSurface {
    private id: number;

    constructor(plane: Mesh, id: number) {
        super();
        // Plane origin at center
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