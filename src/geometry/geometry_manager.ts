import {ProjectionSurface} from "./projection_surface";
import {UniformBuffer} from "@babylonjs/core";

class GeometryManger{
    private projection_surfaces: ProjectionSurface[];

    public constructor() {
        this.projection_surfaces = []
    }

    public get_uniforms() : { ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>; decls: string } {
        const inner_uniforms = this.projection_surfaces.map(e => e.getUniforms());
        return {
            ubo: inner_uniforms.flatMap(e => e.ubo),
            decls: inner_uniforms.join("\n")
        }
    }

    public updateUniformBuffer(uniformBuffer: UniformBuffer) {
        for(const surface of this.projection_surfaces){
            surface.updateUniformBuffer(uniformBuffer);
        }
    }

    /**
     * Input: vec3 ray_origin, vec3 ray_direction
     * Output: bool has_any_intersection, float closest_intersection, int id_of_closest
     */
    public getIDAndLenOfFirstIntersection(){
        let output = `
        bool has_any_intersection = false;
        float closest_intersection = 3e38;
        int id_of_closest = -1;
        `
        for(let i = 0; i < this.projection_surfaces.length; i++){
            output += this.projection_surfaces[i].getIntersectionDistFromRay();
            output += `
            if(is_intersected){
                has_any_intersection = true;
                if(intersection_dist_from_ray < closest_intersection){
                  closest_intersection = intersection_dist_from_ray;
                  id_of_closest = ${i};
                }
            }
            `
        }

        return output;
    }
}