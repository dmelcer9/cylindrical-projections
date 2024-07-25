import * as BABYLON from "@babylonjs/core"
import {
    CustomProceduralTexture,
    Scene,
    Texture,
    Vector3,
    Color4,
    Quaternion,
    AbstractMesh,
    Nullable, UniformBuffer, AbstractEngine, SubMesh, Vector4, Matrix
} from "@babylonjs/core";
import {MaterialPluginBase} from "@babylonjs/core";
import type {MaterialDefines} from "@babylonjs/core/Materials/materialDefines";

// language=GLSL
export const shader_text = `
#ifdef GL_ES
precision highp float;
#endif


attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;
uniform float inflation;
uniform vec3 sphereCenter; // 0 to 1
uniform float maxHeight; // From center to top of cylinder. Cylinder is twice this height
uniform vec3 cylinderExtrudeDirection;

varying vec2 vUV;

const float pi = 3.1415926;


void main(void) {
  float dist_along_cylinder_extrusion_axis = dot(position - sphereCenter, cylinderExtrudeDirection);
  bool is_top = dist_along_cylinder_extrusion_axis > 0.0;
  float amount_to_move = maxHeight * inflation;
  vec3 pos_adjustment = cylinderExtrudeDirection * (is_top ? amount_to_move : -amount_to_move);
  vec3 final_pos = position + pos_adjustment;
  
  gl_Position = worldViewProjection * vec4(final_pos, 1.0);
  vUV = uv;
}
`


export const shader_text2 = `
#ifdef INFLATION
  vec3 position_rel = ( rotation * vec4(position, 1)).xyz;
  float dist_along_cylinder_extrusion_axis = dot(position_rel, cylinderExtrudeDirection);
  bool is_top = dist_along_cylinder_extrusion_axis > 0.0;
  float amount_to_move = maxHeight * inflation;
  vec3 pos_adjustment = cylinderExtrudeDirection * (is_top ? amount_to_move : -amount_to_move);
  positionUpdated.xyz = position_rel + pos_adjustment; 
#endif
`

/*
GL Variables:
position: Relative to the object's center
world: Where the object is in the world
worldPos: Where the vertex is in the world
worldViewProjection: world relative to camera

Solution: Maybe take in an alternate rotation matrix? That isn't actually related to the rotation matrix of the real object
 */

export class InflationPluginMaterial extends MaterialPluginBase {
    private inflation: number;
    private rotation: Quaternion;
    private position: Vector3;
    private _enabled: boolean;

    constructor(material: BABYLON.Material) {
        super(material, "InflationPluginMaterial", 600, {"INFLATION": true}, true, true);

        this._enabled = false;
        this.inflation = 0;
        this.rotation = Quaternion.Identity();
        this.position = new Vector3();
    }

    public set enabled(enabled: boolean) {
        this._enabled = enabled;
        this.markAllDefinesAsDirty();
    }

    public get enabled() {
        return this._enabled;
    }

    prepareDefines(defines : MaterialDefines, scene: Scene, mesh: AbstractMesh) {
        defines.INFLATION = this._enabled;
    }

    setInflation(value: number) {
        this.inflation = value;
    }

    setRotation(value: Quaternion) {
        this.rotation = value;
    }

    setPosition(value: Vector3) {
        this.position = value;
    }

    getClassName(): string {
        return "InflationPluginMaterial";
    }

    getUniforms(): {
        ubo?: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        vertex?: string;
        fragment?: string
    } {
        return {
            ubo: [{name: "inflation", size: 1, type: "float"},
                {name: "cylinderExtrudeDirection", size: 3, type: "vec3"},
                {name: "maxHeight", size: 1, type: "float"},
                {name: "sphereCenter", size: 3, type: "vec3"},
                {name: "rotation", size: 16, type: "mat4"}
            ],
            vertex: `
            #ifdef INFLATION
            uniform float inflation;
            uniform vec3 cylinderExtrudeDirection;
            uniform float maxHeight;
            uniform vec3 sphereCenter;
            uniform vec4 rotation;
            #endif
            `,
        }
    }

    getCustomCode(shaderType: string): Nullable<{ [p: string]: string }> {
        if(shaderType === "vertex"){
            return {
              "CUSTOM_VERTEX_UPDATE_POSITION": shader_text2
            }
        }

        return null;
    }

    bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: AbstractEngine, subMesh: SubMesh) {
        if(this._enabled){
            uniformBuffer.updateFloat("inflation", this.inflation);
            uniformBuffer.updateVector3("cylinderExtrudeDirection", new Vector3(0, 1, 0));
            uniformBuffer.updateFloat("maxHeight", 1);
            uniformBuffer.updateVector3("sphereCenter", this.position);
            const matrix = new Matrix();
            this.rotation.toRotationMatrix(matrix);
            uniformBuffer.updateMatrix("rotation", matrix);
        }
    }
}

