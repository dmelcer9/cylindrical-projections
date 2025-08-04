import {ShaderMaterial} from "@babylonjs/core";

export abstract class LightSource {
    public abstract getShaderCode(): string;

    public abstract getUniforms(): {
        ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        decls: string
    };

    public abstract updateUniformBuffer(uniformBuffer: WebGLBuffer): void;

    public abstract setPropertiesOfShaderMaterial(shaderMaterial: ShaderMaterial): void;
}