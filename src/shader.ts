import * as BABYLON from 'babylonjs';
import {CustomProceduralTexture, Scene, Texture, Vector3} from "babylonjs";

export const shader_text = `
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D map;
uniform float cylinder_radius;
uniform float cylinder_height;
uniform vec3 sphere_rotation;
uniform vec3 projection_origin;
uniform vec3 sphere_center;

const int texture_size = 512;
const float pi = 3.1415926;

varying vec2 vUV;

void main(void) {
 float radians_around = -(vUV.x * 2.0 * pi);
 vec3 my_pos_3d = vec3(sin(radians_around) * cylinder_radius, (vUV.y * cylinder_height) - (cylinder_height/2.0), -cos(radians_around) * cylinder_radius);

 vec3 my_pos_relative_to_proj_origin = my_pos_3d - projection_origin;
 vec3 sphere_center_relative_to_proj_origin = sphere_center - projection_origin;

 vec3 my_pos_relative_to_sphere_center = my_pos_3d - sphere_center;
 vec3 proj_origin_relative_to_sphere_center = projection_origin - sphere_center;

 vec3 ray_direction = normalize(my_pos_relative_to_proj_origin);

 float intersection_dist_from_ray = -1.0;

 vec3 L = sphere_center - projection_origin;
 float tc = dot(L, ray_direction); // Only allowed to be negative if projection origin is inside the sphere
 float d_squared = dot(L, L) - (tc * tc);
 float t1c_squared = 1.0 - d_squared; // If this is below 0, that means that the line the ray lies on doesn't intersect the sphere

 if(t1c_squared >= 0.0){
    intersection_dist_from_ray = tc + sqrt(t1c_squared);
 }

 if (intersection_dist_from_ray > 0.0) {
  vec3 intersection_location_relative_to_sphere_center = proj_origin_relative_to_sphere_center + (intersection_dist_from_ray * ray_direction);

  float proj_rads_around = atan(intersection_location_relative_to_sphere_center.z / intersection_location_relative_to_sphere_center.x);
  if(intersection_location_relative_to_sphere_center.x < 0.0){
    proj_rads_around -= pi;
  }
  float proj_rads_up = asin(intersection_location_relative_to_sphere_center.y);

  vec2 sample_from_loc = vec2(proj_rads_around / (2.0 * pi), (proj_rads_up / pi) + 0.5);
  vec3 color = texture2D(map, sample_from_loc).xyz;
  //float col = intersection_location_relative_to_sphere_center.z;
  //float col = (proj_rads_up / pi) + 0.5;
  //color = vec3(col, 0, 0);
  //vec3 color = vec3(sample_from_loc, 0);
  gl_FragColor = vec4(color, 1.0);
 } else {
  gl_FragColor = vec4(0, 0, 0, 1.0);
 }

}
`

export interface TextureOptions {
    cylinder_radius: number,
    cylinder_height: number,
    sphere_rotation: Vector3,
    projection_origin: Vector3,
    sphere_position: Vector3
}

export function setTextureOptions(texture: CustomProceduralTexture, options: TextureOptions){
    texture.setFloat("cylinder_radius", options.cylinder_radius);
    texture.setFloat("cylinder_height", options.cylinder_height);
    texture.setVector3("sphere_rotation", options.sphere_rotation);
    texture.setVector3("projection_origin", options.projection_origin);
    texture.setVector3("sphere_center", options.sphere_position);
}

export function createTexture(options: TextureOptions, map_texture: Texture, scene: Scene): CustomProceduralTexture {
    BABYLON.Effect.ShadersStore["MapProjPixelShader"] = shader_text;
    const custom_texture = new CustomProceduralTexture("MapProjTexture", "MapProj", 2048, scene);
    custom_texture.setTexture("map", map_texture);
    setTextureOptions(custom_texture, options);

    return custom_texture;
}
