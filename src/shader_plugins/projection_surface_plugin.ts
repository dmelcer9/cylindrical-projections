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
    private manager: GeometryManager;
    private projection_surface: ProjectionSurface;

    constructor(material: BABYLON.Material, manager: GeometryManager, projection_surface: ProjectionSurface) {
        super(material, "ProjectionSurfacePluginMaterial", 600, {}, true)
        this.manager = manager;
        this.projection_surface = projection_surface;
    }

    public dispose(forceDisposeTextures?: boolean) {
        super.dispose(forceDisposeTextures);
        this.manager.remove(this.manager.getIdOfSurface(this.projection_surface));
    }

    getClassName(): string {
        return "ProjectionSurfacePluginMaterial"
    }

    getCustomCode(shaderType: string): Nullable<{ [p: string]: string }> {
        if (shaderType == "vertex") {
            return {} // TODO
        } else {
            return {
                "CUSTOM_FRAGMENT_DEFINITIONS": shader_utils,
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