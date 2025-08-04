import {ProjectionSurface} from "./projection_surface";
import {Scene, UniformBuffer} from "@babylonjs/core";
import {Globe} from "./globe";
import shader_utils from "../shader_plugins/shader_utils";

export class GeometryManager {
    private projection_surfaces: ProjectionSurface[];
    private generation: number;
    private globe: Globe;

    public constructor(scene: Scene) {

        this.globe = new Globe(scene, this);
        this.projection_surfaces = []
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
        this.recompileShaders();
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
        this.updateUniforms();
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

    public getCommonBlock(): string {
        const {decls} = this.get_uniforms();
        return `
        ${decls}
        varying vec3 vPositionW;
        const float PI = 3.1415926535897932384626433832795;
        ${shader_utils}
        `
    }

    public updateUniforms() {
        const all_shaders = this.projection_surfaces.map(e => e.getShaderMaterial());
        for (const shader of all_shaders) {
            for (const surface of this.projection_surfaces) {
                surface.setPropertiesOfShaderMaterial(shader);
            }
            this.globe.setPropertiesOfShaderMaterial(shader);
        }
    }


    public getFragmentShaderForID(id: number): string {
        //                    ${this.projection_surfaces[id].uvToPosition3D("vPositionUV", "position_3d")};
        // language=glsl
        return `
            ${this.getCommonBlock()};
            #include<oitDeclaration>


            void main() {
                // vec3 position_3d = ...

                vec3 position_3d = vPositionW;
                //vec2 vPositionUV = vPositionUVW.xy;


                // TODO Get light source later
                vec3 projectionSource = vec3(0, 0, 0);

                Ray ray = createRayOriginTarget(projectionSource, position_3d);

                // TODO Check all other intersections later
                bool is_first_intersection = true;

                Globe globe = getGlobe();

                float dist1;
                float dist2;

                int num_intersections = get_ray_sphere_intersection(ray, globe, dist1, dist2);

                vec4 color = vec4(0, 0, 0, 0.5);

                if (num_intersections == 0 || num_intersections == 1){
                    // Misses or tangent to sphere
                    color = vec4(0, 0, 0, 0.5);
                } else {
                    float max_dist_ray_to_sphere = max(dist1, dist2);
                    vec3 pointOfSphereIntersection = followRayAlongDistance(ray, max_dist_ray_to_sphere);
                    vec2 sphereUV = positionToUVOnSphere(pointOfSphereIntersection, globe);
                    vec3 texture_color = texture2D(map, sphereUV).xyz;
                    //color = texture2D(map, pointOfSphereIntersection.xy).xyz;
                    //gl_FragColor = vec4(sphereUV, color.z, 1.0);
                    //gl_FragColor = vec4(pointOfSphereIntersection, 1.0);
                    if (max_dist_ray_to_sphere > 0.0){
                        color = vec4(texture_color, 0.5);
                    } else {
                        color = vec4(0.0, 0.0, 0.0, 0.5);
                    }
                }
                //gl_FragColor = vec4(globe.center, 1.0);
                //gl_FragColor.xyz = applyQuaternion(vPositionW.xyz, globe.rotationQuaternion);

                #include<oitFragment>

                #if ORDER_INDEPENDENT_TRANSPARENCY
                if (fragDepth == nearestDepth) {
                    frontColor.rgb += color.rgb * color.a * alphaMultiplier;
                    frontColor.a = 1.0 - alphaMultiplier * (1.0 - color.a);
                } else {
                    backColor += color;
                }
                #endif
            }`
    }

    public getVertexShaderForID(id: number): string {
        return `
        // Attributes
attribute vec2 position;

// Output
varying vec2 vPosition;
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

vPosition = position;
vUV = position * madd + madd;
//gl_Position = vec4(position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}`
    }
}