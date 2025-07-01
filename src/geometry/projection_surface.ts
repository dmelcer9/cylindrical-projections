import {UniformBuffer} from "@babylonjs/core";
import {GeometryManager} from "./geometry_manager";

export abstract class ProjectionSurface {
    private manager: GeometryManager;

    constructor(manager: GeometryManager) {
        this.manager = manager;
        manager.add(this);
    }

    public get id(): number {
        return this.manager.getIdOfSurface(this);
    }

    public dispose() {
        this.manager.remove(this.id);
    }

    public abstract recompileShader(): void;

    /**
     * Return shader code that gets the intersection distance from a ray origin
     * INPUT: vec3 ray_origin, vec3 ray_direction (normalized)
     * Assumption:
     * OUTPUT: bool is_intersected, float intersection_dist_from_ray
     * NOTE: All non-input-output variables should be namespaced by ending with the id
     * This function will not be called often; use uniforms to change values
     */
    public abstract getIntersectionDistFromRay(): string;

    /**
     * All uniforms must be namespaced by ending with the id
     * This function will not be called often
     */
    public abstract getUniforms(): {
        ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        decls: string
    };

    public abstract updateUniformBuffer(uniformBuffer: UniformBuffer): void;

    /**
     * Return shader code that converts a uv coordinate to a 3D position
     * INPUT: vec2 uv
     * OUTPUT: vec3 position
     * NOTE: All non-input-output variables should be namespaced by ending with the id
     */
    public abstract uvToPosition3D(uvName: string, positionName: string): string;
}