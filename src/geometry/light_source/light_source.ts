import {ShaderMaterial, UniformBuffer} from "@babylonjs/core";

export abstract class LightSource {
    public abstract getShaderCode(): string;

    public abstract getUniforms(): {
        ubo: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        decls: string
    };

    public abstract updateUniformBuffer(uniformBuffer: UniformBuffer): void;

    public abstract setPropertiesOfShaderMaterial(shaderMaterial: ShaderMaterial): void;

    public abstract setGizmoEnabled(enabled: boolean): void ;
}