import React, { useEffect } from 'react';
// import "@webgpu/types"

function App() {

  useEffect(() => {
    ; (async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { return; }
      const device = await adapter.requestDevice();


      // First Matrix

      const firstMatrix = new Int32Array(Array.from({length : 256}).map((e,i) => i + 1));

      const gpuBufferFirstMatrix = device.createBuffer({
        mappedAtCreation: true,
        size: firstMatrix.byteLength,
        usage: GPUBufferUsage.STORAGE,
      });
      const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();
      new Int32Array(arrayBufferFirstMatrix).set(firstMatrix);
      gpuBufferFirstMatrix.unmap();

      // Result Matrix
      const resultMatrixBufferSize = firstMatrix.byteLength;
      const resultMatrixBuffer = device.createBuffer({
        size: resultMatrixBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });

      const bindGroupLayout = (device as any).createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "read-only-storage"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "storage"
            }
          }
        ]
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: gpuBufferFirstMatrix
            }
          },
          {
            binding: 1,
            resource: {
              buffer: resultMatrixBuffer
            }
          }
        ]
      });

      const shaderModule = device.createShaderModule({
        code: /*WGSL*/`
      
          @group(0) @binding(0) var<storage, read> firstMatrix : array<i32>;
          @group(0) @binding(1) var<storage, read_write> resultMatrix : array<i32>;
      
          @compute @workgroup_size(1, 1)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            let index = global_id.x;
            resultMatrix[index] = firstMatrix[index] * 2;
          }
        `
      });

      const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
          module: shaderModule,
          entryPoint: "main"
        }
      });

      const commandEncoder = device.createCommandEncoder();

      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);

      passEncoder.dispatchWorkgroups(1, 1);
      passEncoder.end();

      // Get a GPU buffer for reading in an unmapped state.
      const gpuReadBuffer = device.createBuffer({
        size: resultMatrixBufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });

      // Encode commands for copying buffer to buffer.
      commandEncoder.copyBufferToBuffer(
        resultMatrixBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        resultMatrixBufferSize /* size */
      );

      // Submit GPU commands.
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);

      await gpuReadBuffer.mapAsync(GPUMapMode.READ);
      const arrayBuffer = gpuReadBuffer.getMappedRange();
      console.log(new Int32Array(arrayBuffer));
    })()
  }, [])
  return <>
    chien
  </>
    ;
}

export default App;


