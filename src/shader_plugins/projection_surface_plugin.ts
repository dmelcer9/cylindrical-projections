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
import {GeometryManager} from "../geometry/geometry_manager";
import shader_utils from "./shader_utils";
import {ProjectionSurface} from "../geometry/projection_surface";


export class ProjectionSurfacePlugin extends MaterialPluginBase {

    constructor(material: BABYLON.Material, private manager: GeometryManager, private projection_surface: ProjectionSurface) {
        super(material, "ProjectionSurfacePluginMaterial", 600, {}, false, false)
        // For silly reasons need to do this after the super call (set this.manager and this.projection_surface first)
        this._pluginManager._addPlugin(this);
        this._enable(true);
        this.markAllDefinesAsDirty();
    }

    prepareDefines(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh) {
        defines.GENERATION = this.manager.getGeneration();
    }

    public dispose(forceDisposeTextures?: boolean) {
        super.dispose(forceDisposeTextures);
    }

    getClassName(): string {
        return "ProjectionSurfacePluginMaterial"
    }

    getCustomCode(shaderType: string): Nullable<{ [p: string]: string }> {
        if (shaderType == "vertex") {
            // https://github.com/BabylonJS/Babylon.js/blob/c869b5bcb55a8f0cc8e0c43949cfc2a196445daf/packages/dev/core/src/ShadersWGSL/procedural.vertex.fx#L4
            return {
                "CUSTOM_VERTEX_DEFINITIONS": `
                // Attributes
attribute vec2 uv;
// Output
varying vec2 vUV;
varying vec3 vPosition;

`,
                "CUSTOM_VERTEX_MAIN_END": "\nvUV = uv * vec2(0.5, 0.5) + vec2(0.5, 0.5);" +
                    "vPosition = position;\n"
            } // TODO
        } else {
            return {
                "CUSTOM_FRAGMENT_DEFINITIONS": shader_utils + "\nvarying vec2 vUV; varying vec3 vPosition;asdf\n",
                "CUSTOM_FRAGMENT_MAIN_END": this.manager.getFragmentShaderForID(this.manager.getIdOfSurface(this.projection_surface))
            }
        }
    }

    bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: AbstractEngine, subMesh: SubMesh) {
        this.manager.updateUniformBuffer(uniformBuffer)
    }

    getUniforms(): {
        fragment?: string | undefined;
        ubo?: {
            arraySize?: number | undefined;
            name: string;
            size?: number | undefined;
            type?: string | undefined
        }[] | undefined;
        vertex?: string | undefined
    } {
        const result = this.manager.get_uniforms();
        return {
            ubo: result.ubo,
            fragment: result.decls
        }
    }
}