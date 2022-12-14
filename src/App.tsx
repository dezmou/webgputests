import React, { useEffect } from 'react';
// import "@webgpu/types"

function App() {

  useEffect(() => {
    ; (async () => {
      async function testWebGPU() {
        const adapter = (await navigator.gpu.requestAdapter())!;
        const device = await adapter.requestDevice();
        console.log(device);
        await matrixMultiplication(device);
      }

      async function matrixMultiplication(device: GPUDevice) {
        // Result Matrix
        const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * (256 * 65535);
        const resultMatrixBuffer = device.createBuffer({
          size: resultMatrixBufferSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        const input = device.createBuffer({
          mappedAtCreation: true,
          size: Uint32Array.BYTES_PER_ELEMENT,
          usage: GPUBufferUsage.STORAGE,
        });
        const bufferInput = input.getMappedRange();
        new Int32Array(bufferInput).set([5000]);
        input.unmap();

        const bindGroupLayout = device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.COMPUTE,
              buffer: {
                type: 'storage',
              },
            },
            {
              binding: 1,
              visibility: GPUShaderStage.COMPUTE,
              buffer: {
                type: 'read-only-storage',
              },
            },
          ],
        } as any);

        const bindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: {
                buffer: resultMatrixBuffer,
              },
            },
            {
              binding: 1,
              resource: {
                buffer: input,
              },
            },
          ],
        });

        const shaderModule = device.createShaderModule({
          code: /* wgsl */`
            @group(0) @binding(0) var<storage, read_write> resultMatrix : array<u32>;
            @group(0) @binding(1) var<storage> input : array<u32>;
      
            @compute @workgroup_size(256)
            fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
              var chien : i32 = 485;
              for (var i=0; i<5784;i++){
                chien += i;
                if (chien % 4500 == 0) {
                  chien = 0;
                }
              }
              resultMatrix[global_id.x] = bitcast<u32>(input[0] + global_id.x + bitcast<u32>( chien));
            }
          `,
        });

        const computePipeline = device.createComputePipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
          }),
          compute: {
            module: shaderModule,
            entryPoint: 'main',
          },
        });

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(65535);
        passEncoder.end();

        const gpuReadBuffer = device.createBuffer({
          size: resultMatrixBufferSize,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        commandEncoder.copyBufferToBuffer(
          resultMatrixBuffer /* source buffer */,
          0 /* source offset */,
          gpuReadBuffer /* destination buffer */,
          0 /* destination offset */,
          resultMatrixBufferSize /* size */
        );

        const gpuCommands = commandEncoder.finish();
        const time = performance.now()
        device.queue.submit([gpuCommands]);
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        console.log(performance.now() - time);

        const arrayBuffer = gpuReadBuffer.getMappedRange();
        const res = new Int32Array(arrayBuffer);
        console.log(res);
      }

      testWebGPU();
    })()
  }, [])
  return <>
    chien
  </>
    ;
}

export default App;


