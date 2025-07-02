import {ProjectionSurface} from "./projection_surface";
import {UniformBuffer} from "@babylonjs/core";
import {Globe} from "./globe";

export class GeometryManager {
    private projection_surfaces: ProjectionSurface[];
    private generation: number;
    private globe: Globe;

    public constructor(globe: Globe) {
        this.projection_surfaces = []
        this.globe = globe;
        this.generation = 0;
    }

    public getGeneration(): number {
        return this.generation;
    }


    public get_uniforms(): {
        ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        decls: string
    } {
        const inner_uniforms = this.projection_surfaces.map(e => e.getUniforms());
        inner_uniforms.push(this.globe.getUniforms());
        return {
            ubo: inner_uniforms.flatMap(e => e.ubo),
            decls: inner_uniforms.flatMap(e => e.decls).join("\n")
        }
    }

    public updateUniformBuffer(uniformBuffer: UniformBuffer) {
        for (const surface of this.projection_surfaces) {
            surface.updateUniformBuffer(uniformBuffer);
        }
        this.globe.updateUniformBuffer(uniformBuffer);

    }

    public getIdOfSurface(projection_surface: ProjectionSurface): number {
        return this.projection_surfaces.indexOf(projection_surface);
    }

    public remove(id: number) {
        if (id >= 0 && id < this.projection_surfaces.length) {
            this.projection_surfaces.splice(id, 1);
        }
        this.generation++;
    }

    public add(projection_surface: ProjectionSurface): number {
        this.projection_surfaces.push(projection_surface);
        this.generation++;
        return this.projection_surfaces.length - 1;
    }

    public recompileShaders(): void {
        for (const projection_surface of this.projection_surfaces) {
            projection_surface.recompileShader();
        }
    }

    /**
     * Input: vec3 ray_origin, vec3 ray_direction
     * Output: bool has_any_intersection, float closest_intersection, int id_of_closest
     */
    public getIDAndLenOfFirstIntersection() {
        let output = `
        bool has_any_intersection = false;
        float closest_intersection = 3e38;
        int id_of_closest = -1;
        `
        for (let i = 0; i < this.projection_surfaces.length; i++) {
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

    public getFragmentShaderForID(id: number): string {
        // language=glsl
        return `
            //void fragment_shader(void) {
            // vec3 position_3d = ...
            ${this.projection_surfaces[id].uvToPosition3D("vUV", "position_3d")};

            // TODO Get light source later
            vec3 projectionSource = vec3(0, 0, 0);

            Ray ray = createRayOriginTarget(projectionSource, position_3d);

            // TODO Check all other intersections later
            bool is_first_intersection = true;

            Globe globe = getGlobe();

            float dist1;
            float dist2;

            int num_intersections = get_ray_sphere_intersection(ray, globe, dist1, dist2);

            if (num_intersections == 0 || num_intersections == 1){
                // Misses or tangent to sphere
                gl_FragColor = vec4(0, 0, 0, 0.5);
            } else {
                float max_dist_ray_to_sphere = max(dist1, dist2);
                vec3 pointOfSphereIntersection = followRayAlongDistance(ray, max_dist_ray_to_sphere);
                vec2 sphereUV = positionToUVOnSphere(pointOfSphereIntersection, globe);
                vec3 color = texture2D(map, sphereUV).xyz;
                gl_FragColor = vec4(color, 1.0);
            }

            // }`
    }
}